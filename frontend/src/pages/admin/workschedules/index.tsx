import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Card,
    Table,
    Select,
    Typography,
    Space,
    Alert,
    Spin,
    Button,
    Popconfirm,
    message,
    Tag,
    DatePicker,
    Modal,
    Form,
    Input,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, EyeOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import {
    getAllWorkSchedulesAPI,
    deleteWorkScheduleAPI,
    approveWorkScheduleAPI,
    getAllEmployeesAPI,
    getAllShiftsAPI,
} from "@/services/api";
import type { WorkSchedule, WorkScheduleListResponse, WorkScheduleStatus } from "@/types/workschedule";
import type { Employee } from "@/types/employee";
import type { Shift } from "@/types/shift";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const STATUS_OPTIONS: { value: WorkScheduleStatus; label: string; color: string }[] = [
    { value: "PENDING", label: "Chờ duyệt", color: "default" },
    { value: "APPROVED", label: "Đã duyệt", color: "green" },
    { value: "REJECTED", label: "Từ chối", color: "red" },
];

interface FetchWorkSchedulesParams {
    page: number;
    limit: number;
    employeeId?: string;
    shiftId?: string;
    startDate?: string;
    endDate?: string;
    status?: WorkScheduleStatus;
}

async function fetchWorkSchedules(params: FetchWorkSchedulesParams): Promise<WorkScheduleListResponse> {
    try {
        const res = await getAllWorkSchedulesAPI(params);
        if (res && typeof res === "object" && "data" in res) {
            return res;
        }
        const fallback = Array.isArray(res) ? res : [];
        return {
            data: fallback,
            total: fallback.length,
            page: 1,
            limit: fallback.length || 10,
            totalPages: 1,
        };
    } catch (error) {
        throw new Error("Không thể tải danh sách lịch làm việc");
    }
}

interface UseWorkSchedulesState {
    data: WorkSchedule[];
    total: number;
    page: number;
    limit: number;
    employeeId?: string;
    shiftId?: string;
    status?: WorkScheduleStatus;
    startDate?: string;
    endDate?: string;
    loading: boolean;
    error: string | null;
}

function useWorkSchedules(initialLimit: number = 10) {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(initialLimit);
    const [employeeId, setEmployeeId] = useState<string | undefined>();
    const [shiftId, setShiftId] = useState<string | undefined>();
    const [status, setStatus] = useState<WorkScheduleStatus | undefined>();
    const [startDate, setStartDate] = useState<string | undefined>();
    const [endDate, setEndDate] = useState<string | undefined>();
    const [data, setData] = useState<WorkSchedule[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchWorkSchedules({
                page,
                limit,
                employeeId,
                shiftId,
                status,
                startDate,
                endDate,
            });
            setData(resp.data);
            setTotal(resp.total);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [page, limit, employeeId, shiftId, status, startDate, endDate]);

    useEffect(() => {
        load();
    }, [load]);

    const setDateRange = (range?: [string?, string?]) => {
        setPage(1);
        setStartDate(range?.[0]);
        setEndDate(range?.[1]);
    };

    return {
        state: {
            data,
            total,
            page,
            limit,
            employeeId,
            shiftId,
            status,
            startDate,
            endDate,
            loading,
            error,
        } as UseWorkSchedulesState,
        actions: {
            setPage,
            setLimit,
            setEmployeeId: (id?: string) => {
                setPage(1);
                setEmployeeId(id);
            },
            setShiftId: (id?: string) => {
                setPage(1);
                setShiftId(id);
            },
            setStatus: (value?: WorkScheduleStatus) => {
                setPage(1);
                setStatus(value);
            },
            setDateRange,
            reload: load,
        },
    };
}

const ListWorkSchedulePage: React.FC = () => {
    const { state, actions } = useWorkSchedules(10);
    const { data, total, page, limit, loading, error, employeeId, shiftId, status } = state;
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveStatus, setApproveStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
    const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
    const [form] = Form.useForm<{ note?: string }>();

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const res = await getAllEmployeesAPI();
                const list: Employee[] = Array.isArray(res)
                    ? res
                    : Array.isArray((res as any)?.data)
                        ? (res as any).data
                        : [];
                setEmployees(list);
            } catch (err) {
                console.error(err);
            }
        };

        const loadShifts = async () => {
            try {
                const res = await getAllShiftsAPI({ page: 1, limit: 100 });
                if (res && typeof res === "object" && "data" in res) {
                    setShifts(res.data);
                } else {
                    setShifts(Array.isArray(res) ? res : []);
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadEmployees();
        loadShifts();
    }, []);

    const handleDelete = async (id: string, status: WorkScheduleStatus) => {
        if (status !== "PENDING") {
            message.warning("Chỉ có thể xoá lịch ở trạng thái chờ duyệt");
            return;
        }
        try {
            const res = await deleteWorkScheduleAPI(id);
            if (res?.data || res?.message) {
                message.success("Xoá lịch làm việc thành công!");
                actions.reload();
            } else {
                const errorMsg = (res as any)?.message || "Có lỗi xảy ra khi xoá lịch làm việc";
                message.error(errorMsg);
            }
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi xoá lịch làm việc";
            message.error(errorMessage);
        }
    };

    const openApproveModal = (schedule: WorkSchedule, status: "APPROVED" | "REJECTED") => {
        setSelectedSchedule(schedule);
        setApproveStatus(status);
        form.resetFields();
        setApproveModalOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedSchedule) return;
        try {
            const payload = {
                status: approveStatus,
                note: form.getFieldValue("note")?.trim() || undefined,
            } satisfies ApproveWorkSchedulePayload;
            const res = await approveWorkScheduleAPI(selectedSchedule.id, payload);
            if (res?.data || res?.message) {
                message.success(approveStatus === "APPROVED" ? "Duyệt lịch thành công!" : "Từ chối lịch thành công!");
                setApproveModalOpen(false);
                setSelectedSchedule(null);
                actions.reload();
            } else {
                const errorMsg = (res as any)?.message || "Có lỗi xảy ra khi cập nhật trạng thái";
                message.error(errorMsg);
            }
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi cập nhật trạng thái";
            message.error(errorMessage);
        }
    };

    const columns: ColumnsType<WorkSchedule> = useMemo(() => [
        {
            title: "Nhân viên",
            key: "employee",
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{record.employee?.fullName || "N/A"}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.employee?.email || ""}
                    </Text>
                </div>
            ),
        },
        {
            title: "Ca làm việc",
            key: "shift",
            render: (_, record) => (
                <div>
                    <div>{record.shift?.name || "N/A"}</div>
                    {record.shift && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(record.shift.startTime).format("HH:mm")} - {dayjs(record.shift.endTime).format("HH:mm")}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: "Ngày",
            dataIndex: "date",
            key: "date",
            render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: WorkScheduleStatus) => {
                const option = STATUS_OPTIONS.find((opt) => opt.value === status);
                return <Tag color={option?.color}>{option?.label || status}</Tag>;
            },
        },
        {
            title: "Ghi chú",
            dataIndex: "note",
            key: "note",
            render: (text: string) => text || "-",
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 260,
            render: (_, record) => (
                <Space size="small" wrap>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/workschedule/${record.id}`)}
                        size="small"
                    >
                        Xem
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        disabled={record.status !== "PENDING"}
                        onClick={() => navigate(`/workschedule/${record.id}/edit`)}
                        size="small"
                        style={{ color: record.status === "PENDING" ? "#faad14" : undefined }}
                    >
                        Sửa
                    </Button>
                    <Button
                        type="link"
                        icon={<CheckOutlined />}
                        size="small"
                        disabled={record.status !== "PENDING"}
                        onClick={() => openApproveModal(record, "APPROVED")}
                    >
                        Duyệt
                    </Button>
                    <Button
                        type="link"
                        icon={<CloseOutlined />}
                        size="small"
                        danger
                        disabled={record.status !== "PENDING"}
                        onClick={() => openApproveModal(record, "REJECTED")}
                    >
                        Từ chối
                    </Button>
                    <Popconfirm
                        title="Xoá lịch làm việc"
                        description="Bạn có chắc chắn muốn xoá lịch này?"
                        onConfirm={() => handleDelete(record.id, record.status)}
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="link" danger icon={<DeleteOutlined />} size="small" disabled={record.status !== "PENDING"}>
                            Xoá
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ], [navigate]);

    return (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Quản lý lịch làm việc
                </Title>
                <Space wrap>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/workschedule/create")}
                    >
                        Tạo lịch làm việc
                    </Button>
                    <Select
                        allowClear
                        placeholder="Lọc theo nhân viên"
                        value={employeeId}
                        onChange={(value) => actions.setEmployeeId(value)}
                        showSearch
                        optionFilterProp="children"
                        style={{ width: 220 }}
                        options={employees.map((emp) => ({
                            value: emp.id,
                            label: `${emp.fullName}${emp.email ? ` (${emp.email})` : ""}`,
                        }))}
                    />
                    <Select
                        allowClear
                        placeholder="Lọc theo ca làm việc"
                        value={shiftId}
                        onChange={(value) => actions.setShiftId(value)}
                        showSearch
                        optionFilterProp="children"
                        style={{ width: 200 }}
                        options={shifts.map((shift) => ({
                            value: shift.id,
                            label: `${shift.name} (${dayjs(shift.startTime).format("HH:mm")}-${dayjs(shift.endTime).format("HH:mm")})`,
                        }))}
                    />
                    <Select
                        allowClear
                        placeholder="Trạng thái"
                        value={status}
                        onChange={(value) => actions.setStatus(value)}
                        style={{ width: 160 }}
                        options={STATUS_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                        }))}
                    />
                    <RangePicker
                        value={dateRange}
                        onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                                setDateRange(dates);
                                actions.setDateRange([
                                    dates[0].format("YYYY-MM-DD"),
                                    dates[1].format("YYYY-MM-DD"),
                                ]);
                            } else {
                                setDateRange([null, null]);
                                actions.setDateRange(undefined);
                            }
                        }}
                        format="DD/MM/YYYY"
                        placeholder={["Từ ngày", "Đến ngày"]}
                    />
                </Space>
            </Space>

            {error && (
                <Alert type="error" showIcon message="Lỗi khi tải danh sách lịch làm việc" description={error} />
            )}

            <Card styles={{ body: { padding: 0 } }}>
                <Table<WorkSchedule>
                    rowKey="id"
                    columns={columns}
                    dataSource={data}
                    loading={{ spinning: loading, indicator: <Spin /> }}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total,
                        showSizeChanger: true,
                        showTotal: (t, range) => `${range[0]}-${range[1]} của ${t}`,
                        responsive: true,
                    }}
                    onChange={(pagination) => {
                        if (pagination.current && pagination.current !== page) {
                            actions.setPage(pagination.current);
                        }
                        if (pagination.pageSize && pagination.pageSize !== limit) {
                            actions.setLimit(pagination.pageSize);
                        }
                    }}
                    scroll={{ x: "max-content" }}
                />
            </Card>

            {!loading && !error && data.length === 0 && (
                <Text type="secondary">Không có lịch làm việc nào</Text>
            )}

            <Modal
                title={approveStatus === "APPROVED" ? "Duyệt lịch làm việc" : "Từ chối lịch làm việc"}
                open={approveModalOpen}
                onOk={handleApprove}
                onCancel={() => setApproveModalOpen(false)}
                okText={approveStatus === "APPROVED" ? "Duyệt" : "Từ chối"}
                okButtonProps={{ type: approveStatus === "APPROVED" ? "primary" : "primary", danger: approveStatus === "REJECTED" }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="Ghi chú" name="note">
                        <TextArea rows={3} placeholder="Thêm ghi chú (không bắt buộc)" />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
};

export default ListWorkSchedulePage;

