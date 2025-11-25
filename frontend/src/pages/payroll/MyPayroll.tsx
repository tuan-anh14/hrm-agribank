import React, { useEffect, useState } from 'react';
import { Table, Button, message, Tag, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getAllPayrollsAPI } from '@/services/api';
import type { Payroll } from '@/types/payroll';
import { useCurrentApp } from '@/components/context/app.context';
import { useNavigate } from 'react-router-dom';

const MyPayroll: React.FC = () => {
    const { user } = useCurrentApp();
    const [data, setData] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchData = async () => {
        // @ts-ignore
        const empId = user?.employeeId || user?.id;
        if (!empId) return;

        setLoading(true);
        try {
            const res = await getAllPayrollsAPI({ employeeId: empId });
            // @ts-ignore
            setData(res.data || res);
        } catch (error) {
            message.error('Failed to fetch payrolls');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const columns = [
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
                    <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/payroll/${record.id}`)}>View Payslip</Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>My Payroll History</h2>
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
            />
        </div>
    );
};

export default MyPayroll;
