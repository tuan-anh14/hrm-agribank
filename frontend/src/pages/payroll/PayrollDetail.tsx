import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Divider, Spin, message, Row, Col } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { getPayrollByIdAPI } from '@/services/api';
import type { Payroll } from '@/types/payroll';

const PayrollDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<Payroll | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) fetchData(id);
    }, [id]);

    const fetchData = async (payrollId: string) => {
        setLoading(true);
        try {
            const res = await getPayrollByIdAPI(payrollId);
            setData(res.data || null);
        } catch (error) {
            message.error('Failed to fetch payroll detail');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    if (!data) return <div>Payroll not found</div>;

    const formatCurrency = (val?: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    const totalIncome = (data.totalWorkAmount || 0) + (data.bonus || 0);
    const totalDeduction = (data.insuranceDeduction || 0) + (data.taxDeduction || 0) + (data.otherDeduction || 0);

    return (
        <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
                Back
            </Button>

            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Payslip: {data.month}/{data.year}</span>
                        <Tag color={data.status === 'paid' ? 'green' : 'blue'}>{data.status.toUpperCase()}</Tag>
                    </div>
                }
                extra={<Button icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>}
            >
                <Descriptions title="Employee Information" bordered column={2}>
                    <Descriptions.Item label="Name">{data.employee?.fullName}</Descriptions.Item>
                    <Descriptions.Item label="Code">{data.employee?.employeeCode}</Descriptions.Item>
                    <Descriptions.Item label="Department">{data.employee?.department?.name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Position">{data.employee?.position?.title || 'N/A'}</Descriptions.Item>
                </Descriptions>

                <Divider />

                <Descriptions title="Work Summary" bordered column={2}>
                    <Descriptions.Item label="Standard Days">{data.standardWorkHours / 8} days</Descriptions.Item>
                    <Descriptions.Item label="Actual Days">{data.actualWorkDays} days</Descriptions.Item>
                    <Descriptions.Item label="Overtime">{data.overtimeHours} hours</Descriptions.Item>
                </Descriptions>

                <Divider />

                <Row gutter={24}>
                    <Col span={12}>
                        <h3>Income</h3>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Salary V1 (Grade)">{formatCurrency(data.salaryV1)}</Descriptions.Item>
                            <Descriptions.Item label="Salary V2 (Business)">{formatCurrency(data.salaryV2)}</Descriptions.Item>
                            <Descriptions.Item label="Allowance">{formatCurrency(data.allowance)}</Descriptions.Item>
                            <Descriptions.Item label="Bonus/Rewards">{formatCurrency(data.bonus)}</Descriptions.Item>
                            <Descriptions.Item label="Overtime Pay">{formatCurrency(data.totalOTAmount)}</Descriptions.Item>
                            <Descriptions.Item label="Total Income" labelStyle={{ fontWeight: 'bold' }} contentStyle={{ fontWeight: 'bold' }}>
                                {formatCurrency(totalIncome)}
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                    <Col span={12}>
                        <h3>Deductions</h3>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Insurance (10.5%)">{formatCurrency(data.insuranceDeduction)}</Descriptions.Item>
                            <Descriptions.Item label="Tax (PIT)">{formatCurrency(data.taxDeduction)}</Descriptions.Item>
                            <Descriptions.Item label="Other (Fines)">{formatCurrency(data.otherDeduction)}</Descriptions.Item>
                            <Descriptions.Item label="Total Deduction" labelStyle={{ fontWeight: 'bold' }} contentStyle={{ fontWeight: 'bold', color: 'red' }}>
                                {formatCurrency(totalDeduction)}
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>

                <Divider />

                <div style={{ textAlign: 'right' }}>
                    <h3>Net Salary</h3>
                    <h1 style={{ color: '#1890ff', margin: 0 }}>{formatCurrency(data.totalSalary)}</h1>
                </div>
            </Card>
        </div>
    );
};

export default PayrollDetail;
