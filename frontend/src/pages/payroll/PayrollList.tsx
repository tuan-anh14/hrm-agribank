import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, message, Tag, Space, Popconfirm } from 'antd';
import { CalculatorOutlined, EyeOutlined, CheckOutlined, CloseOutlined, DollarOutlined } from '@ant-design/icons';
import { getAllPayrollsAPI, generatePayrollAPI, updatePayrollStatusAPI, payPayrollAPI } from '@/services/api';
import type { Payroll } from '@/types/payroll';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const PayrollList: React.FC = () => {
    const [data, setData] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [generateForm] = Form.useForm();
    const navigate = useNavigate();

    // Filters
    const [month, setMonth] = useState<number>(dayjs().month() + 1);
    const [year, setYear] = useState<number>(dayjs().year());

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getAllPayrollsAPI({ month, year });
            // @ts-ignore
            setData(res.data || res);
        } catch (error) {
            message.error('Failed to fetch payrolls');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const handleGenerate = async (values: any) => {
        try {
            const m = values.date.month() + 1;
            const y = values.date.year();
            await generatePayrollAPI({ month: m, year: y });
            message.success('Payroll generated successfully');
            setIsGenerateModalOpen(false);
            setMonth(m);
            setYear(y);
            fetchData();
        } catch (error) {
            message.error('Failed to generate payroll');
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await updatePayrollStatusAPI(id, status);
            message.success(`Payroll ${status} successfully`);
            fetchData();
        } catch (error) {
            message.error('Failed to update status');
        }
    };

    const handlePay = async (id: string) => {
        try {
            await payPayrollAPI(id);
            message.success('Payment processed successfully');
            fetchData();
        } catch (error) {
            message.error('Failed to process payment');
        }
    };

    const columns = [
        {
            title: 'Employee',
            dataIndex: ['employee', 'fullName'],
            key: 'employeeName',
            render: (_: string, record: Payroll) => (
                <div>
                    <div>{record.employee?.fullName}</div>
                    <small style={{ color: '#888' }}>{record.employee?.employeeCode}</small>
                </div>
            )
        },
        {
            title: 'Period',
            key: 'period',
            render: (_: any, record: Payroll) => `${record.month}/${record.year}`
        },
        {
            title: 'Total Salary',
            dataIndex: 'totalSalary',
            key: 'totalSalary',
            render: (val: number) => (
                <b style={{ color: '#1890ff' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)}
                </b>
            )
        },
        {
            title: 'Status',
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
            title: 'Action',
            key: 'action',
            render: (_: any, record: Payroll) => (
                <Space>
                    <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/payroll/${record.id}`)} />

                    {record.status === 'pending' && (
                        <>
                            <Popconfirm title="Approve this payroll?" onConfirm={() => handleStatusUpdate(record.id, 'approved')}>
                                <Button type="primary" icon={<CheckOutlined />} size="small" ghost />
                            </Popconfirm>
                            <Popconfirm title="Reject this payroll?" onConfirm={() => handleStatusUpdate(record.id, 'rejected')}>
                                <Button danger icon={<CloseOutlined />} size="small" ghost />
                            </Popconfirm>
                        </>
                    )}

                    {record.status === 'approved' && (
                        <Popconfirm title="Mark as Paid?" onConfirm={() => handlePay(record.id)}>
                            <Button type="primary" icon={<DollarOutlined />} size="small">Pay</Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Payroll Management</h2>
                <Space>
                    <Select value={month} onChange={setMonth} style={{ width: 100 }}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <Select.Option key={i + 1} value={i + 1}>Month {i + 1}</Select.Option>
                        ))}
                    </Select>
                    <Select value={year} onChange={setYear} style={{ width: 100 }}>
                        <Select.Option value={2024}>2024</Select.Option>
                        <Select.Option value={2025}>2025</Select.Option>
                    </Select>
                    <Button type="primary" icon={<CalculatorOutlined />} onClick={() => setIsGenerateModalOpen(true)}>
                        Generate Payroll
                    </Button>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
            />

            <Modal
                title="Generate Payroll"
                open={isGenerateModalOpen}
                onCancel={() => setIsGenerateModalOpen(false)}
                onOk={() => generateForm.submit()}
            >
                <Form form={generateForm} layout="vertical" onFinish={handleGenerate}>
                    <Form.Item name="date" label="Select Month/Year" rules={[{ required: true }]}>
                        <DatePicker picker="month" style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PayrollList;
