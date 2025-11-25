import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { createRewardPenaltyAPI, deleteRewardPenaltyAPI, getAllRewardPenaltiesAPI } from '@/services/api';
import { getAllEmployeesAPI } from '@/services/api';
import { RewardPenaltyType } from '@/types/reward-penalty';
import type { RewardPenalty, CreateRewardPenaltyDto } from '@/types/reward-penalty';
import type { Employee } from '@/types/employee';
import dayjs from 'dayjs';

const RewardPenaltyManager: React.FC = () => {
    const [data, setData] = useState<RewardPenalty[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getAllRewardPenaltiesAPI();
            setData(data);
        } catch (error) {
            message.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await getAllEmployeesAPI();
            setEmployees(res);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchEmployees();
    }, []);

    const handleCreate = async (values: CreateRewardPenaltyDto) => {
        try {
            await createRewardPenaltyAPI(values);
            message.success('Created successfully');
            setIsModalOpen(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            message.error('Failed to create');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteRewardPenaltyAPI(id);
            message.success('Deleted successfully');
            fetchData();
        } catch (error) {
            message.error('Failed to delete');
        }
    };

    const columns = [
        {
            title: 'Employee',
            dataIndex: ['employee', 'fullName'],
            key: 'employeeName',
            render: (_: string, record: RewardPenalty) => `${record.employee?.fullName} (${record.employee?.employeeCode})`
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === RewardPenaltyType.REWARD ? 'green' : 'red'}>
                    {type}
                </Tag>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: string, record: RewardPenalty) => (
                <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.id)}>
                    <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <h2>Reward & Penalty Management</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                    Add New
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
            />

            <Modal
                title="Add Reward/Penalty"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children">
                            {employees.map(emp => (
                                <Select.Option key={emp.id} value={emp.id}>
                                    {emp.fullName} - {emp.employeeCode}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value={RewardPenaltyType.REWARD}>Reward</Select.Option>
                            <Select.Option value={RewardPenaltyType.PENALTY}>Penalty</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(displayValue) => displayValue?.replace(/\$\s?|(,*)/g, '') as unknown as number} />
                    </Form.Item>
                    <Form.Item name="reason" label="Reason">
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RewardPenaltyManager;
