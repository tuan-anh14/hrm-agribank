import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, Input, Select, Typography, Space, Alert, Spin, Button, Popconfirm, message, Tag } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult, FilterValue } from "antd/es/table/interface";
import { EditOutlined, DeleteOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAllPositionsAPI, deletePositionAPI } from "@/services/api";
import type { Position } from "@/types/position";

const { Title, Text } = Typography;

type SortOrder = "asc" | "desc";

interface PositionsResponse {
    data: Position[];
    total: number;
    page: number;
    pageSize: number;
}

interface FetchPositionsParams {
    page: number;
    pageSize: number;
    search: string;
    sortBy: keyof Position | "createdAt";
    sortOrder: SortOrder;
    signal?: AbortSignal;
}

async function fetchPositions(params: FetchPositionsParams): Promise<PositionsResponse> {
    const { page, pageSize, search, sortBy, sortOrder } = params;
    
    try {
        const raw = await getAllPositionsAPI();
        const list: Position[] = Array.isArray(raw) 
            ? raw 
            : Array.isArray((raw as any)?.data) 
                ? (raw as any).data 
                : [];
        
        // Client-side search
        const q = search.trim().toLowerCase();
        const filtered = q
            ? list.filter((p) => [
                  p.title,
                  p.gradeLevel?.toString(),
              ].some((v) => (v || "").toLowerCase().includes(q)))
            : list;
        
        // Client-side sort
        const sorted = [...filtered].sort((a, b) => {
            const key = sortBy;
            const av = (a as any)[key] ?? "";
            const bv = (b as any)[key] ?? "";
            
            if (key === "createdAt" || key === "updatedAt" || key === "baseSalary" || key === "allowance" || key === "gradeLevel") {
                const an = Number(av) || 0;
                const bn = Number(bv) || 0;
                if (key === "createdAt" || key === "updatedAt") {
                    const ad = new Date(av).getTime();
                    const bd = new Date(bv).getTime();
                    return sortOrder === "asc" ? ad - bd : bd - ad;
                }
                return sortOrder === "asc" ? an - bn : bn - an;
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
        throw new Error("Không thể tải danh sách chức vụ");
    }
}

interface UsePositionsReturn {
    state: {
        data: Position[];
        total: number;
        page: number;
        pageSize: number;
        search: string;
        sortBy: keyof Position | "createdAt";
        sortOrder: SortOrder;
        loading: boolean;
        error: string | null;
        totalPages: number;
    };
    actions: {
        setPage: (page: number) => void;
        setPageSize: (size: number) => void;
        setSearchDebounced: (value: string) => void;
        toggleSort: (key: keyof Position | "createdAt") => void;
        reload: () => void;
    };
}

function usePositions(initialPageSize: number = 10): UsePositionsReturn {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<keyof Position | "createdAt">("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const [data, setData] = useState<Position[]>([]);
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
            const resp = await fetchPositions({
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

    const toggleSort = useCallback((key: keyof Position | "createdAt") => {
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

const ListPositionPage: React.FC = () => {
    const { state, actions } = usePositions(10);
    const { data, total, page, pageSize, loading, error, sortBy, sortOrder } = state;
    const navigate = useNavigate();

    const handleDelete = async (id: string) => {
        try {
            const res = await deletePositionAPI(id);
            if (res?.data || res?.message) {
                message.success("Xóa chức vụ thành công!");
                actions.reload();
            } else {
                message.error(res?.message || "Có lỗi xảy ra khi xóa chức vụ");
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Có lỗi xảy ra khi xóa chức vụ";
            message.error(errorMessage);
        }
    };

    const onTableChange = (
        pagination: TablePaginationConfig,
        _filters: Record<string, FilterValue | null>,
        sorter: SorterResult<Position> | SorterResult<Position>[]
    ) => {
        if (pagination.current && pagination.current !== page) {
            actions.setPage(pagination.current);
        }
        if (pagination.pageSize && pagination.pageSize !== pageSize) {
            actions.setPageSize(pagination.pageSize);
        }
        
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        if (s && s.order && s.field) {
            const key = String(s.field) as keyof Position | "createdAt";
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const columns: ColumnsType<Position> = useMemo(() => {
        const antOrder = sortOrder === "asc" ? "ascend" : "descend";
        
        return [
            {
                title: "Tên chức vụ",
                dataIndex: "title",
                key: "title",
                sorter: true,
                sortOrder: sortBy === "title" ? antOrder : undefined,
                responsive: ["xs", "sm", "md", "lg"],
            },
            {
                title: "Lương cơ bản",
                dataIndex: "baseSalary",
                key: "baseSalary",
                sorter: true,
                sortOrder: sortBy === "baseSalary" ? antOrder : undefined,
                responsive: ["md", "lg"],
                render: (value: number) => formatCurrency(value),
            },
            {
                title: "Phụ cấp",
                dataIndex: "allowance",
                key: "allowance",
                sorter: true,
                sortOrder: sortBy === "allowance" ? antOrder : undefined,
                responsive: ["lg"],
                render: (value: number | null) => value ? formatCurrency(value) : "-",
            },
            {
                title: "Cấp bậc",
                dataIndex: "gradeLevel",
                key: "gradeLevel",
                sorter: true,
                sortOrder: sortBy === "gradeLevel" ? antOrder : undefined,
                responsive: ["md", "lg"],
                render: (value: number | null) => value ? <Tag color="purple">Cấp {value}</Tag> : "-",
            },
            {
                title: "Số nhân viên",
                dataIndex: ["_count", "employees"],
                key: "employeeCount",
                sorter: false,
                responsive: ["md", "lg"],
                render: (count: number) => (
                    <Tag color="blue">{count || 0}</Tag>
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
                            onClick={() => navigate(`/position/${record.id}`)}
                            size="small"
                        >
                            Xem
                        </Button>
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/position/${record.id}/edit`)}
                            size="small"
                            style={{ color: '#faad14' }}
                        >
                            Sửa
                        </Button>
                        <Popconfirm
                            title="Xóa chức vụ"
                            description="Bạn có chắc chắn muốn xóa chức vụ này? Không thể xóa nếu còn nhân viên đang giữ chức vụ này."
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
                    Quản lý chức vụ
                </Title>
                <Space wrap>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/position/create")}
                    >
                        Tạo chức vụ
                    </Button>
                    <Input.Search
                        allowClear
                        placeholder="Tìm kiếm theo tên, cấp bậc..."
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
                <Alert type="error" showIcon message="Lỗi khi tải danh sách chức vụ" description={error} />
            )}

            <Card styles={{ body: { padding: 0 } }}>
                <Table<Position>
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
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {!loading && !error && data.length === 0 && (
                <Text type="secondary">Không tìm thấy chức vụ nào</Text>
            )}
        </Space>
    );
};

export default ListPositionPage;
