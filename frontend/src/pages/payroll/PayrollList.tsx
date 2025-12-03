import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, message, Tag, Space, Popconfirm } from 'antd';
import { CalculatorOutlined, EyeOutlined, CheckOutlined, CloseOutlined, DollarOutlined } from '@ant-design/icons';
import { getAllPayrollsAPI, generatePayrollAPI, updatePayrollStatusAPI, payPayrollAPI, getAllEmployeesAPI } from '@/services/api';
import type { Payroll } from '@/types/payroll';
import type { Employee } from '@/types/employee';

import { useNavigate } from 'react-router-dom';
import { useCurrentApp } from '@/components/context/app.context';

const PayrollList: React.FC = () => {
    const { user } = useCurrentApp();
    const [data, setData] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [generateForm] = Form.useForm();
    const navigate = useNavigate();

    const isAdmin = user?.role === "ADMIN";
    const isHR = user?.role === "HR";
    const isEmployee = !isAdmin && !isHR;
    const canAction = isAdmin || isHR;

    // Filters
    const [month, setMonth] = useState<number | undefined>(undefined);
    const [year, setYear] = useState<number | undefined>(undefined);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (canAction) {
            fetchEmployees();
        }
    }, [canAction]);

    const fetchEmployees = async () => {
        try {
            const res = await getAllEmployeesAPI();
            // @ts-ignore
            setEmployees(res.data || res);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (month) params.month = month;
            if (year) params.year = year;
            if (isEmployee && user?.id) {
                params.employeeId = user.id;
            } else if (selectedEmployeeId) {
                params.employeeId = selectedEmployeeId;
            }
            const res = await getAllPayrollsAPI(params);
            // @ts-ignore
            setData(res.data || res);
        } catch (error) {
            message.error('Lấy dữ liệu thất bại');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [month, year, selectedEmployeeId, user]);

    const handleGenerate = async (values: any) => {
        try {
            const m = values.date.month() + 1;
            const y = values.date.year();
            await generatePayrollAPI({ month: m, year: y });
            message.success('Tạo bảng lương thành công');
            setIsGenerateModalOpen(false);
            setMonth(m);
            setYear(y);
            fetchData();
        } catch (error) {
            message.error('Tạo bảng lương thất bại');
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await updatePayrollStatusAPI(id, status);
            message.success(`Cập nhật trạng thái ${status} thành công`);
            fetchData();
        } catch (error) {
            message.error('Cập nhật trạng thái thất bại');
        }
    };

    const handlePay = async (id: string) => {
        try {
            await payPayrollAPI(id);
            message.success('Thanh toán thành công');
            fetchData();
        } catch (error) {
            message.error('Thanh toán thất bại');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const columns = [
        {
            title: 'Nhân viên',
            dataIndex: ['employee', 'fullName'],
            key: 'employeeName',
            hidden: isEmployee,
            render: (_: string, record: Payroll) => (
                <div>
                    <div>{record.employee?.fullName}</div>
                    <small style={{ color: '#888' }}>{record.employee?.employeeCode}</small>
                </div>
            )
        },
        {
            title: 'Kỳ lương',
            key: 'period',
            render: (_: any, record: Payroll) => `${record.month}/${record.year}`
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
                <span style={{ color: '#52c41a' }}>{formatCurrency(amount || 0)}</span>
            ),
        },
        {
            title: "Phạt",
            dataIndex: "otherDeduction",
            key: "otherDeduction",
            width: 100,
            render: (amount: number) => (
                <span style={{ color: '#ff4d4f' }}>{formatCurrency(amount || 0)}</span>
            ),
        },
        {
            title: "Khấu trừ",
            key: "deductions",
            width: 120,
            render: (_: any, record: Payroll) => {
                const total = (record.insuranceDeduction || 0) + (record.taxDeduction || 0);
                return (
                    <div title={`BH: ${formatCurrency(record.insuranceDeduction || 0)} - Thuế: ${formatCurrency(record.taxDeduction || 0)}`}>
                        {formatCurrency(total)}
                    </div>
                );
            },
        },
        {
            title: 'Thực nhận',
            dataIndex: 'totalSalary',
            key: 'totalSalary',
            width: 140,
            fixed: 'right' as const,
            render: (val: number) => (
                <b style={{ color: '#1890ff', fontSize: 16 }}>
                    {formatCurrency(val)}
                </b>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'approved') color = 'blue';
                if (status === 'paid') color = 'green';
                if (status === 'rejected') color = 'red';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: Payroll) => (
                <Space>
                    <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/payroll/${record.id}`)}>
                        {isEmployee ? "Xem chi tiết" : ""}
                    </Button>

                    {canAction && record.status === 'pending' && (
                        <>
                            <Popconfirm title="Duyệt bảng lương này?" onConfirm={() => handleStatusUpdate(record.id, 'approved')}>
                                <Button type="primary" icon={<CheckOutlined />} size="small" ghost />
                            </Popconfirm>
                            <Popconfirm title="Từ chối bảng lương này?" onConfirm={() => handleStatusUpdate(record.id, 'rejected')}>
                                <Button danger icon={<CloseOutlined />} size="small" ghost />
                            </Popconfirm>
                        </>
                    )}

                    {canAction && record.status === 'approved' && (
                        <Popconfirm title="Xác nhận đã thanh toán?" onConfirm={() => handlePay(record.id)}>
                            <Button type="primary" icon={<DollarOutlined />} size="small">Thanh toán</Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    const visibleColumns = columns.filter(col => !col.hidden);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h2 style={{ margin: 0 }}>{isEmployee ? "Lịch sử lương của tôi" : "Quản lý Bảng lương"}</h2>
                <Space wrap>
                    <Select value={month} onChange={setMonth} style={{ width: 120 }} placeholder="Chọn tháng" allowClear>
                        {Array.from({ length: 12 }, (_, i) => (
                            <Select.Option key={i + 1} value={i + 1}>Tháng {i + 1}</Select.Option>
                        ))}
                    </Select>
                    <Select value={year} onChange={setYear} style={{ width: 120 }} placeholder="Chọn năm" allowClear>
                        <Select.Option value={2024}>2024</Select.Option>
                        <Select.Option value={2025}>2025</Select.Option>
                    </Select>
                    {canAction && (
                        <Select
                            showSearch
                            value={selectedEmployeeId}
                            onChange={setSelectedEmployeeId}
                            style={{ width: 200 }}
                            placeholder="Chọn nhân viên"
                            allowClear
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={employees.map(emp => ({
                                value: emp.id,
                                label: `${emp.fullName} (${emp.employeeCode})`
                            }))}
                        />
                    )}
                    {canAction && (
                        <Button type="primary" icon={<CalculatorOutlined />} onClick={() => setIsGenerateModalOpen(true)}>
                            Tạo bảng lương
                        </Button>
                    )}
                </Space>
            </div>

            <Table
                columns={visibleColumns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1000 }}
            />

            <Modal
                title="Tạo bảng lương"
                open={isGenerateModalOpen}
                onCancel={() => setIsGenerateModalOpen(false)}
                onOk={() => generateForm.submit()}
            >
                <Form form={generateForm} layout="vertical" onFinish={handleGenerate}>
                    <Form.Item name="date" label="Chọn Tháng/Năm" rules={[{ required: true }]}>
                        <DatePicker picker="month" style={{ width: '100%' }} />
                    </Form.Item>
                </Form >
            </Modal >
        </div >
    );
};

export default PayrollList;
