import React, { useState, useEffect } from "react";
import { Card, Table, Typography, Space, Button, Tag, Select, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAllPayrollsAPI } from "@/services/api";
import type { Payroll } from "@/types/payroll";
import { notifyError } from "@/utils/notification";

const { Title, Text } = Typography;
const { Option } = Select;

const PayrollListPage: React.FC = () => {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterMonth, setFilterMonth] = useState<number | undefined>();
    const [filterYear, setFilterYear] = useState<number | undefined>();
    const navigate = useNavigate();

    const loadPayrolls = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterMonth) params.month = filterMonth;
            if (filterYear) params.year = filterYear;

            const res = await getAllPayrollsAPI(params);
            const data = Array.isArray(res) ? res : (res as any)?.data || [];
            setPayrolls(data);
        } catch (error) {
            notifyError(error, "Không thể tải danh sách bảng lương");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayrolls();
    }, [filterMonth, filterYear]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const columns: ColumnsType<Payroll> = [
        {
            title: "Nhân viên",
            key: "employee",
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{record.employee?.fullName || '-'}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.employee?.employeeCode}
                    </Text>
                </div>
            ),
        },
        {
            title: "Tháng/Năm",
            key: "period",
            render: (_, record) => `${record.month}/${record.year}`,
            sorter: (a, b) => {
                const aVal = a.year * 12 + a.month;
                const bVal = b.year * 12 + b.month;
                return aVal - bVal;
            },
        },
        {
            title: "Lương cơ bản",
            dataIndex: "salaryV1",
            key: "salaryV1",
            width: 120,
            render: (amount: number) => formatCurrency(amount || 0),
        },
        {
            title: "Phụ cấp",
            dataIndex: "allowance",
            key: "allowance",
            width: 100,
            render: (amount: number) => formatCurrency(amount || 0),
        },
        {
            title: "Thưởng",
            dataIndex: "bonus",
            key: "bonus",
            width: 100,
            render: (amount: number) => (
                <Text type="success">{formatCurrency(amount || 0)}</Text>
            ),
        },
        {
            title: "Phạt",
            dataIndex: "otherDeduction",
            key: "otherDeduction",
            width: 100,
            render: (amount: number) => (
                <Text type="danger">{formatCurrency(amount || 0)}</Text>
            ),
        },
        {
            title: "Khấu trừ",
            key: "deductions",
            width: 120,
            render: (_, record) => {
                const total = (record.insuranceDeduction || 0) + (record.taxDeduction || 0);
                return (
                    <div title={`BH: ${formatCurrency(record.insuranceDeduction || 0)} - Thuế: ${formatCurrency(record.taxDeduction || 0)}`}>
                        {formatCurrency(total)}
                    </div>
                );
            },
        },
        {
            title: "Thực nhận",
            dataIndex: "totalSalary",
            key: "totalSalary",
            width: 140,
            fixed: "right",
            render: (amount: number) => (
                <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                    {formatCurrency(amount)}
                </Text>
            ),
            sorter: (a, b) => a.totalSalary - b.totalSalary,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                const color = status === 'paid' ? 'green' : status === 'approved' ? 'blue' : 'orange';
                const text = status === 'paid' ? 'Đã trả' : status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: "Thao tác",
            key: "actions",
            fixed: "right",
            width: 100,
            render: (_, record) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/admin/payroll/${record.id}`)}
                    size="small"
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap" }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Quản lý bảng lương
                </Title>
                <Space wrap>
                    <Select
                        placeholder="Tất cả tháng"
                        value={filterMonth}
                        onChange={setFilterMonth}
                        allowClear
                        style={{ width: 150 }}
                    >
                        {months.map(m => (
                            <Option key={m} value={m}>Tháng {m}</Option>
                        ))}
                    </Select>
                    <Select
                        value={filterYear}
                        onChange={setFilterYear}
                        style={{ width: 120 }}
                        placeholder="Tất cả năm"
                        allowClear
                    >
                        {years.map(y => (
                            <Option key={y} value={y}>{y}</Option>
                        ))}
                    </Select>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/admin/payroll/generate")}
                    >
                        Tạo bảng lương
                    </Button>
                </Space>
            </Space>

            <Card styles={{ body: { padding: 0 } }}>
                <Table<Payroll>
                    rowKey="id"
                    columns={columns}
                    dataSource={payrolls}
                    loading={loading}
                    pagination={{
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} bảng lương`,
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </Space>
    );
};

export default PayrollListPage;
