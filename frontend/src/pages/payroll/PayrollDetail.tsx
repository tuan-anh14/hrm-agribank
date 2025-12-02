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
            const payrollData = (res as any).data || res;
            setData(payrollData || null);
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
                Quay lại
            </Button>

            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Phiếu lương: Tháng {data.month}/{data.year}</span>
                        <Tag color={data.status === 'paid' ? 'green' : data.status === 'approved' ? 'blue' : 'orange'}>
                            {data.status === 'paid' ? 'ĐÃ THANH TOÁN' : data.status === 'approved' ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
                        </Tag>
                    </div>
                }
                extra={<Button icon={<PrinterOutlined />} onClick={() => window.print()}>In phiếu</Button>}
            >
                <Descriptions title="Thông tin nhân viên" bordered column={{ xs: 1, sm: 2, md: 2 }}>
                    <Descriptions.Item label="Họ tên">{data.employee?.fullName}</Descriptions.Item>
                    <Descriptions.Item label="Mã NV">{data.employee?.employeeCode}</Descriptions.Item>
                    <Descriptions.Item label="Phòng ban">{data.employee?.department?.name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Chức vụ">{data.employee?.position?.title || 'N/A'}</Descriptions.Item>
                </Descriptions>

                <Divider />

                <Descriptions title="Tổng hợp công" bordered column={{ xs: 1, sm: 2, md: 2 }}>
                    <Descriptions.Item label="Công chuẩn">{data.standardWorkHours / 8} ngày</Descriptions.Item>
                    <Descriptions.Item label="Công thực tế">{data.actualWorkDays} ngày</Descriptions.Item>
                    <Descriptions.Item label="Tăng ca">{data.overtimeHours} giờ</Descriptions.Item>
                </Descriptions>

                <Divider />

                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <h3>Thu nhập</h3>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Lương cơ bản">{formatCurrency(data.salaryV1)}</Descriptions.Item>
                            <Descriptions.Item label="Phụ cấp">{formatCurrency(data.allowance)}</Descriptions.Item>
                            <Descriptions.Item label="Thưởng">{formatCurrency(data.bonus)}</Descriptions.Item>
                            <Descriptions.Item label="Lương làm thêm">{formatCurrency(data.totalOTAmount)}</Descriptions.Item>
                            <Descriptions.Item label="Tổng thu nhập" labelStyle={{ fontWeight: 'bold' }} contentStyle={{ fontWeight: 'bold' }}>
                                {formatCurrency(totalIncome)}
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                    <Col xs={24} md={12}>
                        <h3>Khấu trừ</h3>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Bảo hiểm (10.5%)">{formatCurrency(data.insuranceDeduction)}</Descriptions.Item>
                            <Descriptions.Item label="Thuế TNCN">{formatCurrency(data.taxDeduction)}</Descriptions.Item>
                            <Descriptions.Item label="Phạt">{formatCurrency(data.otherDeduction)}</Descriptions.Item>
                            <Descriptions.Item label="Tổng khấu trừ" labelStyle={{ fontWeight: 'bold' }} contentStyle={{ fontWeight: 'bold', color: 'red' }}>
                                {formatCurrency(totalDeduction)}
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>

                <Divider />

                <div style={{ textAlign: 'right' }}>
                    <h3>Thực nhận</h3>
                    <h1 style={{ color: '#1890ff', margin: 0 }}>{formatCurrency(data.totalSalary)}</h1>
                </div>
            </Card>
        </div>
    );
};

export default PayrollDetail;
