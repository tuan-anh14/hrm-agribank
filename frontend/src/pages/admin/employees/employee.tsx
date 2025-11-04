import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, Input, Select, Tag, Typography, Space, Alert, Spin } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult, FilterValue } from "antd/es/table/interface";
import { getAllEmployeesAPI } from "services/api";

type SortOrder = "asc" | "desc";

type Employee = {
    id: string;
    fullName: string;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    email?: string;
    address?: string;
    positionId?: string | null;
    departmentId?: string | null;
    startDate?: string;
    status?: string;
    createdAt: string;
    updatedAt?: string;
    department?: string | null;
    position?: string | null;
};

type EmployeesResponse = {
    data: Employee[];
    total: number;
    page: number;
    pageSize: number;
};

// API base URL and Authorization are handled by axios interceptor in services/axios.customize.ts

async function fetchEmployees(params: {
    page: number;
    pageSize: number;
    search: string;
    sortBy: keyof Employee | "createdAt";
    sortOrder: SortOrder;
    signal?: AbortSignal;
}): Promise<EmployeesResponse> {
    const { page, pageSize, search, sortBy, sortOrder } = params;
    // Use axios-based API (handles baseURL and Authorization from interceptor)
    const raw = await getAllEmployeesAPI();
    const list: Employee[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : [];
    // client-side search
    const q = search.trim().toLowerCase();
    const filtered = q
        ? list.filter((e) => [
              e.fullName,
              e.email,
              e.phone,
              e.department,
              e.position,
          ].some((v) => (v || "").toLowerCase().includes(q)))
        : list;
    // client-side sort
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
    // client-side paginate
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paged = sorted.slice(start, end);
    return { data: paged, total: sorted.length, page, pageSize };
}

function useEmployees(initialPageSize: number = 10) {
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
        if (abortRef.current) abortRef.current.abort();
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
            if (abortRef.current) abortRef.current.abort();
        };
    }, [load]);

    const setSearchDebounced = useCallback((value: string) => {
        if (debouncedSearchRef.current) window.clearTimeout(debouncedSearchRef.current);
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
    } as const;
}

const { Title, Text } = Typography;

const EmployeePage: React.FC = () => {
    const { state, actions } = useEmployees(10);
    const { data, total, page, pageSize, loading, error, sortBy, sortOrder } = state;

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
                // ensure order matches
                if ((s.order === "ascend" && sortOrder !== "asc") || (s.order === "descend" && sortOrder !== "desc")) {
                    actions.toggleSort(key);
                }
            }
        }
    };

    const columns: ColumnsType<Employee> = useMemo(() => {
        const antOrder = sortOrder === "asc" ? "ascend" : "descend";
        return [
            { title: "Name", dataIndex: "fullName", key: "fullName", sorter: true, sortOrder: sortBy === "fullName" ? antOrder : undefined, responsive: ["xs", "sm", "md", "lg"] },
            { title: "Gender", dataIndex: "gender", key: "gender", responsive: ["md"] },
            { title: "DOB", dataIndex: "dateOfBirth", key: "dateOfBirth", responsive: ["lg"], render: (v: string) => v ? new Date(v).toLocaleDateString() : "-" },
            { title: "Email", dataIndex: "email", key: "email", responsive: ["md"] },
            { title: "Phone", dataIndex: "phone", key: "phone", responsive: ["lg"] },
            { title: "DepartmentId", dataIndex: "departmentId", key: "departmentId", responsive: ["lg"] },
            { title: "PositionId", dataIndex: "positionId", key: "positionId", responsive: ["md"] },
            {
                title: "Status",
                dataIndex: "status",
                key: "status",
                sorter: true,
                sortOrder: sortBy === "status" ? antOrder : undefined,
                render: (value: Employee["status"]) => (
                    <Tag color={String(value).toLowerCase() === "working" ? "green" : "default"}>{value || "-"}</Tag>
                ),
            },
            {
                title: "Created",
                dataIndex: "createdAt",
                key: "createdAt",
                sorter: true,
                sortOrder: sortBy === "createdAt" ? antOrder : undefined,
                render: (value: string) => new Date(value).toLocaleDateString(),
                responsive: ["sm", "md", "lg"],
            },
        ];
    }, [sortBy, sortOrder]);

    return (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space align="center" style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <Title level={3} style={{ margin: 0 }}>Employees</Title>
                <Space wrap>
                    <Input.Search
                        allowClear
                        placeholder="Search by name, code, email..."
                        onChange={(e) => actions.setSearchDebounced(e.target.value)}
                        onSearch={(v) => actions.setSearchDebounced(v)}
                        style={{ minWidth: 240 }}
                    />
                    <Select
                        value={pageSize}
                        onChange={(v) => actions.setPageSize(v)}
                        style={{ width: 120 }}
                        options={[
                            { value: 10, label: "10 / page" },
                            { value: 20, label: "20 / page" },
                            { value: 50, label: "50 / page" },
                            { value: 100, label: "100 / page" },
                        ]}
                    />
                </Space>
            </Space>

            {error && (
                <Alert type="error" showIcon message="Failed to load employees" description={error} />
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
                        showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}`,
                        responsive: true,
                    }}
                    onChange={onTableChange}
                    sortDirections={["ascend", "descend"]}
                />
            </Card>

            {!loading && !error && data.length === 0 && (
                <Text type="secondary">No employees found</Text>
            )}
        </Space>
    );
};

export default EmployeePage;