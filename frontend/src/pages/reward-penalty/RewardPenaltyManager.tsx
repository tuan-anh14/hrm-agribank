import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { createRewardPenaltyAPI, deleteRewardPenaltyAPI, getAllRewardPenaltiesAPI } from '@/services/api';
import { getAllEmployeesAPI } from '@/services/api';
import { RewardPenaltyType } from '@/types/reward-penalty';
import type { RewardPenalty, CreateRewardPenaltyDto } from '@/types/reward-penalty';
import type { Employee } from '@/types/employee';
import dayjs from 'dayjs';

import { useCurrentApp } from '@/components/context/app.context';

const RewardPenaltyManager: React.FC = () => {
    const { user } = useCurrentApp();
    const [data, setData] = useState<RewardPenalty[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterEmployeeId, setFilterEmployeeId] = useState<string | undefined>(undefined);
    const [filterType, setFilterType] = useState<RewardPenaltyType | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const isAdmin = user?.role === "ADMIN";
    const isHR = user?.role === "HR";
    const isEmployee = !isAdmin && !isHR;

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterEmployeeId) params.employeeId = filterEmployeeId;
            if (filterType) params.type = filterType;

            // If employee, force filter by own ID (though backend enforces it too)
            if (isEmployee && user?.id) {
                params.employeeId = user.id;
            }

            const res = await getAllRewardPenaltiesAPI(params);
            setData(res);
        } catch (error) {
            message.error('Lấy dữ liệu thất bại');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        if (isEmployee) return; // Employees don't need to fetch employee list
        try {
            const res = await getAllEmployeesAPI();
            setEmployees(res);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [filterEmployeeId, filterType, user]);

    useEffect(() => {
        if (!isEmployee) {
            fetchEmployees();
        }
    }, [isEmployee]);

    const handleCreate = async (values: CreateRewardPenaltyDto) => {
        try {
            await createRewardPenaltyAPI(values);
            message.success('Tạo thành công');
            setIsModalOpen(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            message.error('Tạo thất bại');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteRewardPenaltyAPI(id);
            message.success('Xóa thành công');
            fetchData();
        } catch (error) {
            message.error('Xóa thất bại');
        }
    };

    const columns = [
        {
            title: 'Nhân viên',
            dataIndex: ['employee', 'fullName'],
            key: 'employeeName',
            hidden: isEmployee,
            render: (_: string, record: RewardPenalty) => `${record.employee?.fullName} (${record.employee?.employeeCode})`
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === RewardPenaltyType.REWARD ? 'green' : 'red'}>
                    {type}
                </Tag>
            )
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Hành động',
            key: 'action',
            hidden: isEmployee,
            render: (_: string, record: RewardPenalty) => (
                <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => handleDelete(record.id)}>
                    <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            )
        }
    ];

    const visibleColumns = columns.filter(col => !col.hidden);

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <h2 style={{ margin: 0 }}>{isEmployee ? "Lịch sử Khen thưởng / Kỷ luật" : "Quản lý Khen thưởng / Kỷ luật"}</h2>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {!isEmployee && (
                        <Select
                            placeholder="Lọc theo nhân viên"
                            style={{ width: 200 }}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            onChange={setFilterEmployeeId}
                            value={filterEmployeeId}
                        >
                            {employees.map(emp => (
                                <Select.Option key={emp.id} value={emp.id}>
                                    {emp.fullName}
                                </Select.Option>
                            ))}
                        </Select>
                    )}
                    <Select
                        placeholder="Lọc theo loại"
                        style={{ width: 150 }}
                        allowClear
                        onChange={setFilterType}
                        value={filterType}
                    >
                        <Select.Option value={RewardPenaltyType.REWARD}>Khen thưởng</Select.Option>
                        <Select.Option value={RewardPenaltyType.PENALTY}>Kỷ luật</Select.Option>
                    </Select>
                    {!isEmployee && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                            Thêm mới
                        </Button>
                    )}
                </div>
            </div>

            <Table
                columns={visibleColumns}
                dataSource={data}
                rowKey="id"
                loading={loading}
            />

            <Modal
                title="Thêm Khen thưởng / Kỷ luật"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="employeeId" label="Nhân viên" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children">
                            {employees.map(emp => (
                                <Select.Option key={emp.id} value={emp.id}>
                                    {emp.fullName} - {emp.employeeCode}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value={RewardPenaltyType.REWARD}>Khen thưởng</Select.Option>
                            <Select.Option value={RewardPenaltyType.PENALTY}>Kỷ luật</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(displayValue) => displayValue?.replace(/\$\s?|(,*)/g, '') as unknown as number} />
                    </Form.Item>
                    <Form.Item name="reason" label="Lý do">
                        <Input.TextArea />
                    </Form.Item>
                </Form >
            </Modal >
        </div >
    );
};

export default RewardPenaltyManager;
