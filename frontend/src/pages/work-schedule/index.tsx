import React, { useCallback, useEffect, useMemo, useState } from "react";
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
    Radio,
    Grid,
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
import type { WorkSchedule, WorkScheduleListResponse, WorkScheduleStatus, ApproveWorkSchedulePayload } from "@/types/workschedule";
import type { Employee } from "@/types/employee";
import type { Shift } from "@/types/shift";
import { handleApiSuccess, notifyError } from "@/utils/notification";

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

import CalendarView from "./calendar-view";
import { useCurrentApp } from "@/components/context/app.context";

const ListWorkSchedulePage: React.FC = () => {
    const { user } = useCurrentApp();
    const { state, actions } = useWorkSchedules(10);
    const { data, total, page, limit, loading, error, employeeId, shiftId, status } = state;
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("LIST");

    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveStatus, setApproveStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
    const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
    const [form] = Form.useForm<{ note?: string }>();

    const isAdmin = user?.role === "ADMIN";
    const isHR = user?.role === "HR";
    const isEmployee = !isAdmin && !isHR;

    // Actions: Admin/HR can Approve/Reject/Delete. Employee can only View.
    const canAction = isAdmin || isHR;

    useEffect(() => {
        // If employee, force employeeId filter
        if (isEmployee && user?.id) {
            actions.setEmployeeId(user.id);
        }
    }, [isEmployee, user?.id]);

    useEffect(() => {
        const loadEmployees = async () => {
            if (isEmployee) return; // Employees don't need to load other employees
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
    }, [isEmployee]);

    const handleDelete = async (id: string, status: WorkScheduleStatus) => {
        if (!canAction) return;
        if (status !== "PENDING") {
            message.warning("Chỉ có thể xoá lịch ở trạng thái chờ duyệt");
            return;
        }
        try {
            const res = await deleteWorkScheduleAPI(id);
            if (handleApiSuccess(res, "Xoá lịch làm việc thành công!", "Có lỗi xảy ra khi xoá lịch làm việc")) {
                actions.reload();
            }
        } catch (err: any) {
            notifyError(err, "Có lỗi xảy ra khi xoá lịch làm việc");
        }
    };

    const openApproveModal = (schedule: WorkSchedule, status: "APPROVED" | "REJECTED") => {
        if (!canAction) return;
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
            const successMsg = approveStatus === "APPROVED" ? "Duyệt lịch thành công!" : "Từ chối lịch thành công!";
            if (handleApiSuccess(res, successMsg, "Có lỗi xảy ra khi cập nhật trạng thái")) {
                setApproveModalOpen(false);
                setSelectedSchedule(null);
                actions.reload();
            }
        } catch (err: any) {
            notifyError(err, "Có lỗi xảy ra khi cập nhật trạng thái");
        }
    };

    const columns: ColumnsType<WorkSchedule> = useMemo(() => {
        const cols: ColumnsType<WorkSchedule> = [
            {
                title: "Nhân viên",
                key: "employee",
                hidden: isEmployee, // Hide employee column for employee view
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
                width: canAction ? 260 : 100,
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
                        {canAction && (
                            <>
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
                            </>
                        )}
                    </Space>
                ),
            },
        ];
        return cols.filter(col => !col.hidden);
    }, [navigate, canAction, isEmployee]);

    return (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space
                direction={isMobile ? "vertical" : "horizontal"}
                align={isMobile ? "start" : "center"}
                style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    {isEmployee ? "Lịch làm việc của tôi" : "Quản lý lịch làm việc"}
                </Title>
                <Space
                    wrap
                    direction={isMobile ? "vertical" : "horizontal"}
                    style={{ width: isMobile ? "100%" : "auto" }}
                >
                    <Radio.Group
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        buttonStyle="solid"
                        style={{ width: isMobile ? "100%" : "auto" }}
                    >
                        <Radio.Button value="LIST">Danh sách</Radio.Button>
                        <Radio.Button value="CALENDAR">Lịch</Radio.Button>
                    </Radio.Group>

                    {/* Both Admin and Employee can create/request schedule */}
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/workschedule/create")}
                        block={isMobile}
                    >
                        {isEmployee ? "Đăng ký lịch làm" : "Tạo lịch làm việc"}
                    </Button>
                </Space>
            </Space>

            {viewMode === "LIST" ? (
                <>
                    <Card
                        size="small"
                        styles={{
                            body: {
                                padding: isMobile ? 12 : 16,
                            },
                        }}
                    >
                        <Space
                            direction={isMobile ? "vertical" : "horizontal"}
                            style={{ width: "100%" }}
                            wrap
                        >
                            {!isEmployee && (
                                <Select
                                    allowClear
                                    placeholder="Lọc theo nhân viên"
                                    value={employeeId}
                                    onChange={(value) => actions.setEmployeeId(value)}
                                    showSearch
                                    optionFilterProp="children"
                                    style={{ width: isMobile ? "100%" : 220 }}
                                    options={employees.map((emp) => ({
                                        value: emp.id,
                                        label: `${emp.fullName}${emp.email ? ` (${emp.email})` : ""}`,
                                    }))}
                                />
                            )}
                            <Select
                                allowClear
                                placeholder="Lọc theo ca làm việc"
                                value={shiftId}
                                onChange={(value) => actions.setShiftId(value)}
                                showSearch
                                optionFilterProp="children"
                                style={{ width: isMobile ? "100%" : 200 }}
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
                                style={{ width: isMobile ? "100%" : 160 }}
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
                                style={{ width: isMobile ? "100%" : "auto" }}
                            />
                        </Space>
                    </Card>

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
                </>
            ) : (
                <CalendarView
                    employeeId={isEmployee ? user?.id : employeeId}
                    shifts={shifts}
                    employees={employees}
                    onEmployeeChange={actions.setEmployeeId}
                />
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

