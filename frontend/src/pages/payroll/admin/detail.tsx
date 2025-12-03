import React, { useState, useEffect } from "react";
import { Card, Descriptions, Typography, Space, Spin, Alert, Button, Tag, Divider } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getPayrollByIdAPI } from "@/services/api";
import type { Payroll } from "@/types/payroll";
import { notifyError } from "@/utils/notification";

const { Title, Text } = Typography;

const PayrollDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [payroll, setPayroll] = useState<Payroll | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadPayroll = async () => {
            if (!id) {
                setError("Không tìm thấy ID bảng lương");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const res = await getPayrollByIdAPI(id);
                const data = (res as any)?.data || res;
                setPayroll(data);
            } catch (err) {
                const errorMsg = (err as any)?.response?.data?.message || "Không thể tải thông tin bảng lương";
                setError(errorMsg);
                notifyError(err, errorMsg);
            } finally {
                setLoading(false);
            }
        };

        loadPayroll();
    }, [id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    if (loading) {
        return (
            <div style={{ padding: "24px", textAlign: "center" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                    <Text>Đang tải thông tin bảng lương...</Text>
                </div>
            </div>
        );
    }

    if (error || !payroll) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Alert
                    type="error"
                    message="Lỗi"
                    description={error || "Không tìm thấy thông tin bảng lương"}
                    action={
                        <Button size="small" onClick={() => navigate("/admin/payroll")}>
                            Quay lại
                        </Button>
                    }
                />
            </div>
        );
    }

    const statusColor = payroll.status === 'paid' ? 'green' : payroll.status === 'approved' ? 'blue' : 'orange';
    const statusText = payroll.status === 'paid' ? 'Đã trả' : payroll.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';

    return (
        <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
            <Space direction="vertical" size={24} style={{ width: "100%" }}>
                <Space align="center">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/admin/payroll")}
                    >
                        Quay lại
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>
                        Chi tiết bảng lương
                    </Title>
                </Space>

                <Card>
                    <Descriptions title="Thông tin nhân viên" bordered column={2}>
                        <Descriptions.Item label="Họ tên">
                            {payroll.employee?.fullName || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã nhân viên">
                            {payroll.employee?.employeeCode || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phòng ban">
                            {payroll.employee?.department?.name || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chức vụ">
                            {payroll.employee?.position?.title || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Loại nhân viên">
                            {payroll.employee?.type === 'FULL_TIME' ? 'Full-time' : 'Part-time'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kỳ lương">
                            Tháng {payroll.month}/{payroll.year}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card>
                    <Descriptions title="Chi tiết công" bordered column={2}>
                        <Descriptions.Item label="Giờ công chuẩn">
                            {payroll.standardWorkHours} giờ
                        </Descriptions.Item>
                        <Descriptions.Item label="Giờ tăng ca">
                            {payroll.overtimeHours} giờ
                        </Descriptions.Item>
                        {payroll.salaryCoefficient && (
                            <Descriptions.Item label="Hệ số lương">
                                {payroll.salaryCoefficient}
                            </Descriptions.Item>
                        )}
                        {payroll.baseSalary && (
                            <Descriptions.Item label="Lương cơ bản">
                                {formatCurrency(payroll.baseSalary)}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Card>

                <Card>
                    <Descriptions title="Chi tiết lương" bordered column={1}>
                        <Descriptions.Item label="Tiền công làm việc">
                            <Text strong>{formatCurrency(payroll.totalWorkAmount)}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tiền tăng ca">
                            <Text strong>{formatCurrency(payroll.totalOTAmount)}</Text>
                        </Descriptions.Item>
                        {payroll.allowance && payroll.allowance > 0 && (
                            <Descriptions.Item label="Phụ cấp">
                                <Text style={{ color: '#52c41a' }}>+{formatCurrency(payroll.allowance)}</Text>
                            </Descriptions.Item>
                        )}
                        {payroll.bonus && payroll.bonus > 0 && (
                            <Descriptions.Item label="Thưởng">
                                <Text style={{ color: '#52c41a' }}>+{formatCurrency(payroll.bonus)}</Text>
                            </Descriptions.Item>
                        )}
                        {payroll.otherDeduction && payroll.otherDeduction > 0 && (
                            <Descriptions.Item label="Phạt">
                                <Text style={{ color: '#ff4d4f' }}>-{formatCurrency(payroll.otherDeduction)}</Text>
                            </Descriptions.Item>
                        )}
                        {((payroll.insuranceDeduction || 0) + (payroll.taxDeduction || 0)) > 0 && (
                            <Descriptions.Item label="Khấu trừ (BH + Thuế)">
                                <Text style={{ color: '#ff4d4f' }}>-{formatCurrency((payroll.insuranceDeduction || 0) + (payroll.taxDeduction || 0))}</Text>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={statusColor}>{statusText}</Tag>
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    <div style={{ textAlign: "right" }}>
                        <Space direction="vertical" align="end">
                            <Text type="secondary">Tổng lương thực lĩnh:</Text>
                            <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                                {formatCurrency(payroll.totalSalary)}
                            </Title>
                        </Space>
                    </div>
                </Card>
            </Space>
        </div>
    );
};

export default PayrollDetailPage;
