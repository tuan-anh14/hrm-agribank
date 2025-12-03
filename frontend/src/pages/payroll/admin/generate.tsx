import React, { useState } from "react";
import { Card, Form, Select, Button, Typography, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { generatePayrollAPI } from "@/services/api";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title, Text } = Typography;
const { Option } = Select;

const GeneratePayrollPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = async (values: { month: number; year: number }) => {
        setLoading(true);
        try {
            const res = await generatePayrollAPI(values);
            if (handleApiSuccess(
                res,
                `Đã tạo bảng lương tháng ${values.month}/${values.year} thành công!`,
                "Có lỗi xảy ra khi tạo bảng lương"
            )) {
                setTimeout(() => navigate("/admin/payroll"), 1500);
            }
        } catch (error) {
            notifyError(error, "Có lỗi xảy ra khi tạo bảng lương");
        } finally {
            setLoading(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Tạo bảng lương
                    </Title>

                    <Text type="secondary">
                        Hệ thống sẽ tự động tính toán lương cho tất cả nhân viên dựa trên:
                        <ul>
                            <li>Số giờ làm việc từ bảng chấm công</li>
                            <li>Loại nhân viên (Full-time/Part-time)</li>
                            <li>Hệ số lương và lương cơ bản</li>
                            <li>Số giờ tăng ca</li>
                        </ul>
                    </Text>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{
                            month: currentMonth,
                            year: currentYear,
                        }}
                    >
                        <Form.Item
                            label="Tháng"
                            name="month"
                            rules={[{ required: true, message: "Vui lòng chọn tháng" }]}
                        >
                            <Select placeholder="Chọn tháng">
                                {months.map(m => (
                                    <Option key={m} value={m}>Tháng {m}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Năm"
                            name="year"
                            rules={[{ required: true, message: "Vui lòng chọn năm" }]}
                        >
                            <Select placeholder="Chọn năm">
                                {years.map(y => (
                                    <Option key={y} value={y}>{y}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Tạo bảng lương
                                </Button>
                                <Button onClick={() => navigate("/admin/payroll")}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Space>
            </Card>
        </div>
    );
};

export default GeneratePayrollPage;
