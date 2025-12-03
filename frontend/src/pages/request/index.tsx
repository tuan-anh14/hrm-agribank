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
    getAllRequestsAPI,
    getMyRequestsAPI,
    deleteRequestAPI,
    approveRequestAPI,
    getAllEmployeesAPI,
    getAllRequestTypesAPI,
} from "@/services/api";
import type { Request, RequestListResponse, RequestStatus, ApproveRequestPayload } from "@/types/request";
import type { Employee } from "@/types/employee";
import type { RequestType } from "@/types/request";
import { useCurrentApp } from "@/components/context/app.context";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const STATUS_OPTIONS: { value: RequestStatus; label: string; color: string }[] = [
    { value: "PENDING", label: "Chờ duyệt", color: "default" },
    { value: "APPROVED", label: "Đã duyệt", color: "green" },
    { value: "REJECTED", label: "Từ chối", color: "red" },
];

interface FetchRequestsParams {
    page: number;
    limit: number;
    employeeId?: string;
    requestTypeId?: string;
    startDate?: string;
    endDate?: string;
    status?: RequestStatus;
}

async function fetchRequests(params: FetchRequestsParams, isEmployee: boolean): Promise<RequestListResponse> {
    try {
        const api = isEmployee ? getMyRequestsAPI : getAllRequestsAPI;
        const res = await api(params);
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
        throw new Error("Không thể tải danh sách đơn");
    }
}



function useRequests(initialLimit: number = 10, isEmployee: boolean = false) {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(initialLimit);
    const [employeeId, setEmployeeId] = useState<string | undefined>();
    const [requestTypeId, setRequestTypeId] = useState<string | undefined>();
    const [status, setStatus] = useState<RequestStatus | undefined>();
    const [startDate, setStartDate] = useState<string | undefined>();
    const [endDate, setEndDate] = useState<string | undefined>();

    const [data, setData] = useState<Request[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: FetchRequestsParams = {
                page,
                limit,
            };
            if (employeeId) params.employeeId = employeeId;
            if (requestTypeId) params.requestTypeId = requestTypeId;
            if (status) params.status = status;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const resp = await fetchRequests(params, isEmployee);
            setData(resp.data);
            setTotal(resp.total);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [page, limit, employeeId, requestTypeId, status, startDate, endDate, isEmployee]);

    useEffect(() => {
        load();
    }, [load]);

    return {
        state: { data, total, page, limit, employeeId, requestTypeId, status, startDate, endDate, loading, error },
        actions: {
            setPage,
            setLimit,
            setEmployeeId,
            setRequestTypeId,
            setStatus,
            setDateRange: (start?: string, end?: string) => {
                setStartDate(start);
                setEndDate(end);
                setPage(1);
            },
            reload: load,
        },
    };
}

const ListRequestPage: React.FC = () => {
    const { user } = useCurrentApp();
    const isAdmin = user?.role === "ADMIN";
    const isHR = user?.role === "HR";
    const isEmployee = user?.role === "EMPLOYEE";
    const canAction = isAdmin || isHR;

    const { state, actions } = useRequests(10, isEmployee);
    const { data, total, page, limit, employeeId, requestTypeId, status, startDate, endDate, loading, error } = state;
    const navigate = useNavigate();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [approveStatus, setApproveStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (isEmployee && user?.id) {
            actions.setEmployeeId(user.id);
        }
    }, [isEmployee, user?.id]);

    useEffect(() => {
        const loadEmployees = async () => {
            if (isEmployee) return;
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

        const loadRequestTypes = async () => {
            try {
                const res = await getAllRequestTypesAPI();
                const list: RequestType[] = Array.isArray(res)
                    ? res
                    : Array.isArray((res as any)?.data)
                        ? (res as any).data
                        : [];
                setRequestTypes(list);
            } catch (err) {
                console.error(err);
            }
        };

        loadEmployees();
        loadRequestTypes();
    }, [isEmployee]);

    const handleDelete = async (id: string, requestStatus: RequestStatus) => {
        if (requestStatus !== "PENDING") {
            notifyError(new Error("Chỉ có thể xóa đơn ở trạng thái chờ duyệt"), "Chỉ có thể xóa đơn ở trạng thái chờ duyệt");
            return;
        }
        try {
            const res = await deleteRequestAPI(id);
            if (handleApiSuccess(res, "Xóa đơn thành công!", "Có lỗi xảy ra khi xóa đơn")) {
                actions.reload();
            }
        } catch (err: any) {
            notifyError(err, "Có lỗi xảy ra khi xóa đơn");
        }
    };

    const openApproveModal = (request: Request, status: "APPROVED" | "REJECTED") => {
        if (!canAction) return;
        setSelectedRequest(request);
        setApproveStatus(status);
        form.resetFields();
        setApproveModalOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        try {
            const payload: ApproveRequestPayload = {
                status: approveStatus,
                note: form.getFieldValue("note")?.trim() || undefined,
            };
            const res = await approveRequestAPI(selectedRequest.id, payload);
            const successMsg = approveStatus === "APPROVED" ? "Duyệt đơn thành công!" : "Từ chối đơn thành công!";
            if (handleApiSuccess(res, successMsg, "Có lỗi xảy ra khi cập nhật trạng thái")) {
                setApproveModalOpen(false);
                setSelectedRequest(null);
                actions.reload();
            }
        } catch (err: any) {
            notifyError(err, "Có lỗi xảy ra khi cập nhật trạng thái");
        }
    };

    const columns: ColumnsType<Request> = useMemo(() => {
        const cols: ColumnsType<Request> = [
            {
                title: "Nhân viên",
                key: "employee",
                hidden: isEmployee,
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
                title: "Loại đơn",
                key: "requestType",
                render: (_, record) => (
                    <div>
                        <div style={{ fontWeight: 600 }}>{record.requestType?.name || "N/A"}</div>
                        {record.requestType?.description && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {record.requestType.description}
                            </Text>
                        )}
                    </div>
                ),
            },
            {
                title: "Lý do",
                dataIndex: "reason",
                key: "reason",
                render: (text: string) => (
                    <span
                        style={{
                            display: "inline-block",
                            maxWidth: 200,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                        title={text || "-"}
                    >
                        {text || "-"}
                    </span>
                ),
            },
            {
                title: "Thời gian",
                key: "dateRange",
                render: (_, record) => {
                    if (record.startDate && record.endDate) {
                        return (
                            <div>
                                <div>{dayjs(record.startDate).format("DD/MM/YYYY")}</div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    đến {dayjs(record.endDate).format("DD/MM/YYYY")}
                                </Text>
                            </div>
                        );
                    } else if (record.startDate) {
                        return dayjs(record.startDate).format("DD/MM/YYYY");
                    }
                    return "-";
                },
            },
            {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                render: (status: RequestStatus) => {
                    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
                    return <Tag color={option?.color}>{option?.label || status}</Tag>;
                },
            },
            {
                title: "Người duyệt",
                key: "approvedBy",
                render: (_, record) => {
                    if (record.approvedBy) {
                        return (
                            <div>
                                <div>{record.approvedBy.fullName}</div>
                                {record.approvedDate && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {dayjs(record.approvedDate).format("DD/MM/YYYY HH:mm")}
                                    </Text>
                                )}
                            </div>
                        );
                    }
                    return "-";
                },
            },
            {
                title: "Thao tác",
                key: "actions",
                width: canAction ? 260 : 150,
                render: (_, record) => (
                    <Space size="small" wrap>
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/request/${record.id}`)}
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
                                    onClick={() => navigate(`/request/${record.id}/edit`)}
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
                            </>
                        )}
                        {record.status === "PENDING" && (
                            <Popconfirm
                                title="Xóa đơn"
                                description="Bạn có chắc chắn muốn xóa đơn này?"
                                onConfirm={() => handleDelete(record.id, record.status)}
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button type="link" danger icon={<DeleteOutlined />} size="small">
                                    Xóa
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                ),
            },
        ];
        return cols.filter((col) => !col.hidden);
    }, [isEmployee, canAction, navigate]);

    const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        if (dates && dates[0] && dates[1]) {
            actions.setDateRange(dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD"));
        } else {
            actions.setDateRange(undefined, undefined);
        }
    };

    return (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    {isEmployee ? "Đơn của tôi" : "Quản lý đơn"}
                </Title>
                <Space wrap>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/request/create")}
                    >
                        Tạo đơn mới
                    </Button>
                </Space>
            </Space>

            <Card>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Space wrap style={{ width: "100%" }}>
                        {!isEmployee && (
                            <Select
                                placeholder="Chọn nhân viên"
                                allowClear
                                style={{ width: 200 }}
                                value={employeeId}
                                onChange={(v) => {
                                    actions.setEmployeeId(v);
                                    actions.setPage(1);
                                }}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                                options={employees.map((emp) => ({
                                    value: emp.id,
                                    label: `${emp.fullName} (${emp.employeeCode})`,
                                }))}
                            />
                        )}
                        <Select
                            placeholder="Chọn loại đơn"
                            allowClear
                            style={{ width: 200 }}
                            value={requestTypeId}
                            onChange={(v) => {
                                actions.setRequestTypeId(v);
                                actions.setPage(1);
                            }}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                            options={requestTypes.map((rt) => ({
                                value: rt.id,
                                label: rt.name,
                            }))}
                        />
                        <Select
                            placeholder="Trạng thái"
                            allowClear
                            style={{ width: 150 }}
                            value={status}
                            onChange={(v) => {
                                actions.setStatus(v);
                                actions.setPage(1);
                            }}
                            options={STATUS_OPTIONS.map((opt) => ({
                                value: opt.value,
                                label: opt.label,
                            }))}
                        />
                        <RangePicker
                            placeholder={["Từ ngày", "Đến ngày"]}
                            value={
                                startDate && endDate
                                    ? [dayjs(startDate), dayjs(endDate)]
                                    : null
                            }
                            onChange={handleDateRangeChange}
                            format="DD/MM/YYYY"
                        />
                        <Select
                            value={limit}
                            onChange={(v) => {
                                actions.setLimit(v);
                                actions.setPage(1);
                            }}
                            style={{ width: 120 }}
                            options={[
                                { value: 10, label: "10 / trang" },
                                { value: 20, label: "20 / trang" },
                                { value: 50, label: "50 / trang" },
                                { value: 100, label: "100 / trang" },
                            ]}
                        />
                    </Space>
                </Space>
            </Card>

            {error && (
                <Alert type="error" showIcon message="Lỗi khi tải danh sách đơn" description={error} />
            )}

            <Card styles={{ body: { padding: 0 } }}>
                <Table<Request>
                    rowKey="id"
                    columns={columns}
                    dataSource={data}
                    loading={{ spinning: loading, indicator: <Spin /> }}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total,
                        showSizeChanger: false,
                        showTotal: (t, range) => `${range[0]}-${range[1]} của ${t}`,
                        responsive: true,
                    }}
                    onChange={(pagination) => {
                        if (pagination.current && pagination.current !== page) {
                            actions.setPage(pagination.current);
                        }
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                title={approveStatus === "APPROVED" ? "Duyệt đơn" : "Từ chối đơn"}
                open={approveModalOpen}
                onOk={handleApprove}
                onCancel={() => {
                    setApproveModalOpen(false);
                    setSelectedRequest(null);
                    form.resetFields();
                }}
                okText={approveStatus === "APPROVED" ? "Duyệt" : "Từ chối"}
                cancelText="Hủy"
                okButtonProps={{ danger: approveStatus === "REJECTED" }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="Ghi chú" name="note">
                        <TextArea rows={4} placeholder="Nhập ghi chú (tùy chọn)" />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
};

export default ListRequestPage;

