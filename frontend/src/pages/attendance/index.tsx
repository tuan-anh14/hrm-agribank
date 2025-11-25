import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, Select, Typography, Space, Alert, Spin, Button, Popconfirm, Tag, DatePicker, Radio } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, EyeOutlined, PlusOutlined, CalendarOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { getAllAttendancesAPI, getMyAttendancesAPI, deleteAttendanceAPI, getAllEmployeesAPI } from "@/services/api";
import type { Attendance } from "@/types/attendance";
import type { Employee } from "@/types/employee";
import { useCurrentApp } from "@/components/context/app.context";
import { handleApiSuccess, notifyError } from "@/utils/notification";
import AttendanceCalendar from "./AttendanceCalendar";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface FetchAttendancesParams {
    page: number;
    limit: number;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
}

async function fetchAttendances(params: FetchAttendancesParams, isEmployee: boolean) {
    const { page, limit, employeeId, startDate, endDate } = params;

    try {
        const queryParams: any = {
            page,
            limit,
        };

        if (startDate) {
            queryParams.startDate = startDate;
        }
        if (endDate) {
            queryParams.endDate = endDate;
        }

        // Employee chỉ lấy chấm công của mình
        // Admin/HR có thể filter theo employeeId
        let res;
        if (isEmployee) {
            res = await getMyAttendancesAPI(queryParams);
        } else {
            if (employeeId) {
                queryParams.employeeId = employeeId;
            }
            res = await getAllAttendancesAPI(queryParams);
        }

        // Backend returns { data, total, page, limit, totalPages }
        if (res && typeof res === 'object' && 'data' in res) {
            return res;
        }

        // Fallback if response structure is different
        const fallbackData = Array.isArray(res) ? res : [];
        return {
            data: fallbackData,
            total: fallbackData.length,
            page: 1,
            limit: 10,
            totalPages: 1,
        };
    } catch (error) {
        throw new Error("Không thể tải danh sách chấm công");
    }
}

interface UseAttendancesReturn {
    state: {
        data: Attendance[];
        total: number;
        page: number;
        limit: number;
        employeeId?: string;
        startDate?: string;
        endDate?: string;
        loading: boolean;
        error: string | null;
        totalPages: number;
    };
    actions: {
        setPage: (page: number) => void;
        setLimit: (limit: number) => void;
        setEmployeeId: (employeeId?: string) => void;
        setDateRange: (startDate?: string, endDate?: string) => void;
        reload: () => void;
    };
}

function useAttendances(initialLimit: number = 10, isEmployee: boolean = false): UseAttendancesReturn {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(initialLimit);
    const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);
    const [startDate, setStartDate] = useState<string | undefined>(undefined);
    const [endDate, setEndDate] = useState<string | undefined>(undefined);

    const [data, setData] = useState<Attendance[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

    const load = useCallback(async () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }

        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        setError(null);

        try {
            const resp = await fetchAttendances({
                page,
                limit,
                employeeId,
                startDate,
                endDate,
            }, isEmployee);
            setData(resp.data || []);
            setTotal(resp.total || 0);
        } catch (e) {
            if ((e as any)?.name !== "AbortError") {
                setError((e as Error).message);
            }
        } finally {
            setLoading(false);
        }
    }, [page, limit, employeeId, startDate, endDate, isEmployee]);

    useEffect(() => {
        load();
        return () => {
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, [load]);

    const setDateRange = useCallback((start?: string, end?: string) => {
        setPage(1);
        setStartDate(start);
        setEndDate(end);
    }, []);

    return {
        state: { data, total, page, limit, employeeId, startDate, endDate, loading, error, totalPages },
        actions: {
            setPage,
            setLimit,
            setEmployeeId: (id?: string) => {
                setPage(1);
                setEmployeeId(id);
            },
            setDateRange,
            reload: load,
        },
    };
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ON_TIME':
            return 'green';
        case 'LATE':
            return 'orange';
        case 'ABSENT':
            return 'red';
        default:
            return 'default';
    }
};

const getStatusText = (status: string) => {
    switch (status) {
        case 'ON_TIME':
            return 'Đúng giờ';
        case 'LATE':
            return 'Muộn';
        case 'ABSENT':
            return 'Vắng mặt';
        default:
            return status;
    }
};

const ListAttendancePage: React.FC = () => {
    const { user } = useCurrentApp();
    const isEmployee = user?.role === 'EMPLOYEE';
    const { state, actions } = useAttendances(10, isEmployee);
    const { data, total, page, limit, loading, error, employeeId } = state;
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
    const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">(isEmployee ? "CALENDAR" : "LIST");

    useEffect(() => {
        // Chỉ load employees nếu không phải EMPLOYEE (Admin/HR cần filter)
        if (!isEmployee) {
            const loadEmployees = async () => {
                try {
                    const res = await getAllEmployeesAPI();
                    const list: Employee[] = Array.isArray(res)
                        ? res
                        : Array.isArray((res as any)?.data)
                            ? (res as any).data
                            : [];
                    setEmployees(list);
                } catch (error) {
                    console.error("Error loading employees:", error);
                    notifyError(error, "Không thể tải danh sách nhân viên");
                }
            };
            loadEmployees();
        }
    }, [isEmployee]);

    const handleDelete = async (id: string) => {
        try {
            const res = await deleteAttendanceAPI(id);
            if (handleApiSuccess(res, "Xóa chấm công thành công!", "Có lỗi xảy ra khi xóa chấm công")) {
                actions.reload();
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi xóa chấm công");
        }
    };

    const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        if (dates && dates[0] && dates[1]) {
            setDateRange(dates);
            actions.setDateRange(
                dates[0].format('YYYY-MM-DD'),
                dates[1].format('YYYY-MM-DD')
            );
        } else {
            setDateRange([null, null]);
            actions.setDateRange(undefined, undefined);
        }
    };

    const columns: ColumnsType<Attendance> = useMemo(() => {
        return [
            {
                title: "Nhân viên",
                key: "employee",
                render: (_, record) => (
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.employee?.fullName || '-'}</div>
                        {record.employee?.email && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {record.employee.email}
                            </Text>
                        )}
                    </div>
                ),
                responsive: ["xs", "sm", "md", "lg"],
            },
            {
                title: "Phòng ban",
                key: "department",
                render: (_, record) => record.employee?.department?.name || '-',
                responsive: ["md", "lg"],
            },
            {
                title: "Ngày",
                dataIndex: "date",
                key: "date",
                render: (value: string) => dayjs(value).format('DD/MM/YYYY'),
                responsive: ["xs", "sm", "md", "lg"],
            },
            {
                title: "Check-in",
                dataIndex: "checkInTime",
                key: "checkInTime",
                render: (value: string | null) => value ? dayjs(value).format('HH:mm:ss') : '-',
                responsive: ["sm", "md", "lg"],
            },
            {
                title: "Check-out",
                dataIndex: "checkOutTime",
                key: "checkOutTime",
                render: (value: string | null) => value ? dayjs(value).format('HH:mm:ss') : '-',
                responsive: ["sm", "md", "lg"],
            },
            {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                render: (status: string) => (
                    <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
                ),
                responsive: ["xs", "sm", "md", "lg"],
            },
            {
                title: "Đi muộn",
                dataIndex: "lateMinutes",
                key: "lateMinutes",
                render: (minutes: number) => {
                    if (!minutes || minutes === 0) return <Text type="secondary">-</Text>;
                    return (
                        <Tag color="orange">
                            {minutes} phút
                        </Tag>
                    );
                },
                responsive: ["md", "lg"],
            },
            {
                title: "Về sớm",
                dataIndex: "earlyMinutes",
                key: "earlyMinutes",
                render: (minutes: number) => {
                    if (!minutes || minutes === 0) return <Text type="secondary">-</Text>;
                    return (
                        <Tag color="volcano">
                            {minutes} phút
                        </Tag>
                    );
                },
                responsive: ["md", "lg"],
            },
            {
                title: "Ghi chú",
                dataIndex: "note",
                key: "note",
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
                responsive: ["md", "lg"],
            },
            {
                title: "Thao tác",
                key: "actions",
                fixed: "right",
                width: isEmployee ? 80 : 150,
                render: (_, record) => (
                    <Space size="small">
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/attendance/${record.id}`)}
                            size="small"
                        >
                            Xem
                        </Button>
                        {!isEmployee && (
                            <>
                                <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/attendance/${record.id}/edit`)}
                                    size="small"
                                    style={{ color: '#faad14' }}
                                >
                                    Sửa
                                </Button>
                                <Popconfirm
                                    title="Xóa chấm công"
                                    description="Bạn có chắc chắn muốn xóa chấm công này?"
                                    onConfirm={() => handleDelete(record.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button type="link" danger icon={<DeleteOutlined />} size="small">
                                        Xóa
                                    </Button>
                                </Popconfirm>
                            </>
                        )}
                    </Space>
                ),
            },
        ];
    }, [navigate, isEmployee]);

    return (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    {isEmployee ? "Chấm công của tôi" : "Quản lý chấm công"}
                </Title>
                <Space wrap>
                    <Radio.Group
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="LIST"><UnorderedListOutlined /> Danh sách</Radio.Button>
                        <Radio.Button value="CALENDAR"><CalendarOutlined /> Lịch</Radio.Button>
                    </Radio.Group>

                    {!isEmployee && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => navigate("/attendance/create")}
                        >
                            Tạo chấm công
                        </Button>
                    )}
                </Space>
            </Space>

            {viewMode === "LIST" ? (
                <>
                    <Card size="small">
                        <Space wrap>
                            {!isEmployee && (
                                <Select
                                    value={employeeId || undefined}
                                    onChange={(v) => actions.setEmployeeId(v || undefined)}
                                    placeholder="Lọc theo nhân viên"
                                    allowClear
                                    showSearch
                                    optionFilterProp="children"
                                    style={{ width: 200 }}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={employees.map(emp => ({
                                        value: emp.id,
                                        label: `${emp.fullName}${emp.email ? ` (${emp.email})` : ''}`,
                                    }))}
                                />
                            )}
                            <RangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                format="DD/MM/YYYY"
                                placeholder={['Từ ngày', 'Đến ngày']}
                            />
                            <Select
                                value={limit}
                                onChange={(v) => actions.setLimit(v)}
                                style={{ width: 120 }}
                                options={[
                                    { value: 10, label: "10 / trang" },
                                    { value: 20, label: "20 / trang" },
                                    { value: 50, label: "50 / trang" },
                                    { value: 100, label: "100 / trang" },
                                ]}
                            />
                        </Space>
                    </Card>

                    {error && (
                        <Alert type="error" showIcon message="Lỗi khi tải danh sách chấm công" description={error} />
                    )}

                    <Card styles={{ body: { padding: 0 } }}>
                        <Table<Attendance>
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
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>

                    {!loading && !error && data.length === 0 && (
                        <Text type="secondary">Không tìm thấy chấm công nào</Text>
                    )}
                </>
            ) : (
                <AttendanceCalendar employeeId={isEmployee ? undefined : employeeId} />
            )}
        </Space>
    );
};

export default ListAttendancePage;

