import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, Input, Typography, Space, Alert, Spin, Button, Popconfirm, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getAllShiftsAPI, deleteShiftAPI } from "@/services/api";
import { handleApiSuccess, notifyError } from "@/utils/notification";
import type { Shift, ShiftListResponse } from "@/types/shift";

const { Title, Text } = Typography;

interface FetchShiftsParams {
    page: number;
    limit: number;
    search?: string;
}

async function fetchShifts(params: FetchShiftsParams): Promise<ShiftListResponse> {
    const { page, limit, search } = params;
    try {
        const queryParams: any = { page, limit };
        if (search) {
            queryParams.search = search;
        }

        const res = await getAllShiftsAPI(queryParams);
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
        throw new Error("Không thể tải danh sách ca làm việc");
    }
}

function useShifts(initialLimit: number = 10) {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(initialLimit);
    const [search, setSearch] = useState("");

    const [data, setData] = useState<Shift[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchTimeoutRef = useRef<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchShifts({
                page,
                limit,
                search: search.trim() || undefined,
            });
            setData(resp.data);
            setTotal(resp.total);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSearchChange = (value: string) => {
        if (searchTimeoutRef.current) {
            window.clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = window.setTimeout(() => {
            setPage(1);
            setSearch(value);
        }, 300);
    };

    return {
        state: { data, total, page, limit, loading, error, search },
        actions: {
            setPage,
            setLimit,
            setSearch: handleSearchChange,
            reload: load,
        },
    };
}

const ListShiftPage: React.FC = () => {
    const { state, actions } = useShifts(10);
    const { data, total, page, limit, loading, error } = state;
    const navigate = useNavigate();

    const handleDelete = async (id: string) => {
        try {
            const res = await deleteShiftAPI(id);
            if (handleApiSuccess(res, "Xoá ca làm việc thành công!", "Có lỗi xảy ra khi xoá ca làm việc")) {
                actions.reload();
            }
        } catch (err: any) {
            notifyError(err, "Có lỗi xảy ra khi xoá ca làm việc");
        }
    };

    const columns: ColumnsType<Shift> = useMemo(() => [
        {
            title: "Tên ca",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: "Giờ bắt đầu",
            dataIndex: "startTime",
            key: "startTime",
            render: (value: string) => dayjs(value).format("HH:mm"),
        },
        {
            title: "Giờ kết thúc",
            dataIndex: "endTime",
            key: "endTime",
            render: (value: string) => dayjs(value).format("HH:mm"),
        },
        {
            title: "Thời lượng",
            key: "duration",
            render: (_, record) => {
                // Normalize to same date to calculate duration based on time only
                const start = dayjs(record.startTime).year(2000).month(0).date(1);
                const end = dayjs(record.endTime).year(2000).month(0).date(1);
                const duration = end.diff(start, "minute");
                if (duration <= 0) {
                    return <Tag color="red">Không hợp lệ</Tag>;
                }
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return (
                    <Text>
                        {hours ? `${hours}h ` : ""}
                        {minutes ? `${minutes}m` : ""}
                    </Text>
                );
            },
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 180,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/shift/${record.id}`)}
                        size="small"
                    >
                        Xem
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/shift/${record.id}/edit`)}
                        size="small"
                        style={{ color: "#faad14" }}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xoá ca làm việc"
                        description="Bạn có chắc chắn muốn xoá ca này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="link" danger icon={<DeleteOutlined />} size="small">
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
                    Quản lý ca làm việc
                </Title>
                <Space wrap>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/shift/create")}
                    >
                        Tạo ca làm việc
                    </Button>
                    <Input.Search
                        allowClear
                        placeholder="Tìm kiếm theo tên ca..."
                        onChange={(e) => actions.setSearch(e.target.value)}
                        onSearch={(value) => actions.setSearch(value)}
                        style={{ minWidth: 220 }}
                    />
                </Space>
            </Space>

            {error && (
                <Alert type="error" showIcon message="Lỗi khi tải danh sách ca làm việc" description={error} />
            )}

            <Card styles={{ body: { padding: 0 } }}>
                <Table<Shift>
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
                <Text type="secondary">Không có ca làm việc nào</Text>
            )}
        </Space>
    );
};

export default ListShiftPage;

