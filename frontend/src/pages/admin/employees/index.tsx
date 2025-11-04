import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, Input, Select, Tag, Typography, Space, Alert, Spin, Button, Popconfirm, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult, FilterValue } from "antd/es/table/interface";
import { EditOutlined, DeleteOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAllEmployeesAPI, deleteEmployeeAPI } from "@/services/api";
import type { Employee } from "@/types/employee";

const { Title, Text } = Typography;

type SortOrder = "asc" | "desc";

interface EmployeesResponse {
    data: Employee[];
    total: number;
    page: number;
    pageSize: number;
}

interface FetchEmployeesParams {
    page: number;
    pageSize: number;
    search: string;
    sortBy: keyof Employee | "createdAt";
    sortOrder: SortOrder;
    signal?: AbortSignal;
}

async function fetchEmployees(params: FetchEmployeesParams): Promise<EmployeesResponse> {
    const { page, pageSize, search, sortBy, sortOrder } = params;
    
    try {
        const raw = await getAllEmployeesAPI();
        const list: Employee[] = Array.isArray(raw) 
            ? raw 
            : Array.isArray((raw as any)?.data) 
                ? (raw as any).data 
                : [];
        
        // Client-side search
        const q = search.trim().toLowerCase();
        const filtered = q
            ? list.filter((e) => [
                  e.fullName,
                  e.email,
                  e.phone,
                  e.department?.name,
                  e.position?.title,
              ].some((v) => (v || "").toLowerCase().includes(q)))
            : list;
        
        // Client-side sort
        const sorted = [...filtered].sort((a, b) => {
            const key = sortBy;
            const av = (a as any)[key] ?? "";
            const bv = (b as any)[key] ?? "";
            
            if (key === "createdAt") {
                const ad = new Date(av).getTime();
                const bd = new Date(bv).getTime();
                return sortOrder === "asc" ? ad - bd : bd - ad;
            }
            
            const as = String(av).toLowerCase();
            const bs = String(bv).toLowerCase();
            if (as < bs) return sortOrder === "asc" ? -1 : 1;
            if (as > bs) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
        
        // Client-side paginate
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paged = sorted.slice(start, end);
        
        return { data: paged, total: sorted.length, page, pageSize };
    } catch (error) {
        throw new Error("Không thể tải danh sách nhân viên");
    }
}

interface UseEmployeesReturn {
    state: {
        data: Employee[];
        total: number;
        page: number;
        pageSize: number;
        search: string;
        sortBy: keyof Employee | "createdAt";
        sortOrder: SortOrder;
        loading: boolean;
        error: string | null;
        totalPages: number;
    };
    actions: {
        setPage: (page: number) => void;
        setPageSize: (size: number) => void;
        setSearchDebounced: (value: string) => void;
        toggleSort: (key: keyof Employee | "createdAt") => void;
        reload: () => void;
    };
}

function useEmployees(initialPageSize: number = 10): UseEmployeesReturn {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<keyof Employee | "createdAt">("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const [data, setData] = useState<Employee[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const debouncedSearchRef = useRef<number | null>(null);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    const load = useCallback(async () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        setError(null);
        
        try {
            const resp = await fetchEmployees({
                page,
                pageSize,
                search,
                sortBy,
                sortOrder,
                signal: controller.signal,
            });
            setData(resp.data);
            setTotal(resp.total);
        } catch (e) {
            if ((e as any)?.name !== "AbortError") {
                setError((e as Error).message);
            }
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, sortBy, sortOrder]);

    useEffect(() => {
        load();
        return () => {
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, [load]);

    const setSearchDebounced = useCallback((value: string) => {
        if (debouncedSearchRef.current) {
            window.clearTimeout(debouncedSearchRef.current);
        }
        debouncedSearchRef.current = window.setTimeout(() => {
            setPage(1);
            setSearch(value);
        }, 350);
    }, []);

    const toggleSort = useCallback((key: keyof Employee | "createdAt") => {
        setPage(1);
        setSortBy((prevKey) => {
            if (prevKey === key) {
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                return prevKey;
            }
            setSortOrder("asc");
            return key;
        });
    }, []);

    return {
        state: { data, total, page, pageSize, search, sortBy, sortOrder, loading, error, totalPages },
        actions: { setPage, setPageSize, setSearchDebounced, toggleSort, reload: load },
    };
}

const ListEmployeePage: React.FC = () => {
    const { state, actions } = useEmployees(10);
    const { data, total, page, pageSize, loading, error, sortBy, sortOrder } = state;
    const navigate = useNavigate();

    const handleDelete = async (id: string) => {
        try {
            const res = await deleteEmployeeAPI(id);
            if (res?.data || res?.message) {
                message.success("Xóa nhân viên thành công!");
                actions.reload();
            } else {
                message.error(res?.message || "Có lỗi xảy ra khi xóa nhân viên");
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Có lỗi xảy ra khi xóa nhân viên");
        }
    };

    const onTableChange = (
        pagination: TablePaginationConfig,
        _filters: Record<string, FilterValue | null>,
        sorter: SorterResult<Employee> | SorterResult<Employee>[]
    ) => {
        if (pagination.current && pagination.current !== page) {
            actions.setPage(pagination.current);
        }
        if (pagination.pageSize && pagination.pageSize !== pageSize) {
            actions.setPageSize(pagination.pageSize);
        }
        
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s && s.order && s.field) {
            const key = String(s.field) as keyof Employee | "createdAt";
            if (key !== sortBy) {
                actions.toggleSort(key);
            } else {
                if (
                    (s.order === "ascend" && sortOrder !== "asc") ||
                    (s.order === "descend" && sortOrder !== "desc")
                ) {
                    actions.toggleSort(key);
                }
            }
        }
    };

    const columns: ColumnsType<Employee> = useMemo(() => {
        const antOrder = sortOrder === "asc" ? "ascend" : "descend";
        
        return [
            {
                title: "Họ và tên",
                dataIndex: "fullName",
                key: "fullName",
                sorter: true,
                sortOrder: sortBy === "fullName" ? antOrder : undefined,
                responsive: ["xs", "sm", "md", "lg"],
            },
            {
                title: "Giới tính",
                dataIndex: "gender",
                key: "gender",
                responsive: ["md"],
            },
            {
                title: "Ngày sinh",
                dataIndex: "dateOfBirth",
                key: "dateOfBirth",
                responsive: ["lg"],
                render: (v: string) => (v ? new Date(v).toLocaleDateString("vi-VN") : "-"),
            },
            {
                title: "Email",
                dataIndex: "email",
                key: "email",
                responsive: ["md"],
            },
            {
                title: "Số điện thoại",
                dataIndex: "phone",
                key: "phone",
                responsive: ["lg"],
            },
            {
                title: "Phòng ban",
                dataIndex: ["department", "name"],
                key: "department",
                responsive: ["md"],
                render: (_, record) => record.department?.name || "-",
            },
            {
                title: "Chức vụ",
                dataIndex: ["position", "title"],
                key: "position",
                responsive: ["md"],
                render: (_, record) => record.position?.title || "-",
            },
            {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                sorter: true,
                sortOrder: sortBy === "status" ? antOrder : undefined,
                render: (value: Employee["status"]) => (
                    <Tag color={String(value).toLowerCase() === "working" ? "green" : "default"}>
                        {value || "-"}
                    </Tag>
                ),
            },
            {
                title: "Ngày tạo",
                dataIndex: "createdAt",
                key: "createdAt",
                sorter: true,
                sortOrder: sortBy === "createdAt" ? antOrder : undefined,
                render: (value: string) => new Date(value).toLocaleDateString("vi-VN"),
                responsive: ["sm", "md", "lg"],
            },
            {
                title: "Thao tác",
                key: "actions",
                fixed: "right",
                width: 150,
                render: (_, record) => (
                    <Space size="small">
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/admin/employees/${record.id}`)}
                            size="small"
                        >
                            Xem
                        </Button>
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/admin/employees/${record.id}/edit`)}
                            size="small"
                        >
                            Sửa
                        </Button>
                        <Popconfirm
                            title="Xóa nhân viên"
                            description="Bạn có chắc chắn muốn xóa nhân viên này?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="link" danger icon={<DeleteOutlined />} size="small">
                                Xóa
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ];
    }, [sortBy, sortOrder, navigate]);

    return (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Quản lý nhân viên
                </Title>
                <Space wrap>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/admin/employees/create")}
                    >
                        Tạo nhân viên
                    </Button>
                    <Input.Search
                        allowClear
                        placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                        onChange={(e) => actions.setSearchDebounced(e.target.value)}
                        onSearch={(v) => actions.setSearchDebounced(v)}
                        style={{ minWidth: 240 }}
                    />
                    <Select
                        value={pageSize}
                        onChange={(v) => actions.setPageSize(v)}
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

            {error && (
                <Alert type="error" showIcon message="Lỗi khi tải danh sách nhân viên" description={error} />
            )}

            <Card styles={{ body: { padding: 0 } }}>
                <Table<Employee>
                    rowKey="id"
                    columns={columns}
                    dataSource={data}
                    loading={{ spinning: loading, indicator: <Spin /> }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (t, range) => `${range[0]}-${range[1]} của ${t}`,
                        responsive: true,
                    }}
                    onChange={onTableChange}
                    sortDirections={["ascend", "descend"]}
                    scroll={{ x: 1200 }}
                />
            </Card>

            {!loading && !error && data.length === 0 && (
                <Text type="secondary">Không tìm thấy nhân viên nào</Text>
            )}
        </Space>
    );
};

export default ListEmployeePage;

