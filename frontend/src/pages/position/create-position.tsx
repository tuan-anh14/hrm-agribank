import { Button, Form, Input, InputNumber, Card, Typography, Space } from "antd";
import type { FormProps } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPositionAPI } from "@/services/api";
import type { CreatePositionPayload } from "@/types/position";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title } = Typography;

type FieldType = {
    title: string;
    baseSalary: number;
    allowance?: number;
    gradeLevel?: number;
    description?: string;
};

const CreatePositionPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        setIsSubmitting(true);
        try {
            const payload: CreatePositionPayload = {
                title: values.title.trim(),
                baseSalary: values.baseSalary,
                allowance: values.allowance || undefined,
                gradeLevel: values.gradeLevel || undefined,
                description: values.description?.trim() || undefined,
            };

            const res = await createPositionAPI(payload);

            if (handleApiSuccess(res, "Tạo chức vụ thành công!", "Có lỗi xảy ra khi tạo chức vụ")) {
                form.resetFields();
                setTimeout(() => {
                    navigate("/position");
                }, 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi tạo chức vụ");
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Tạo chức vụ mới
                    </Title>

                    <Form
                        form={form}
                        name="create-position"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item<FieldType>
                            label="Tên chức vụ"
                            name="title"
                            rules={[
                                { required: true, message: "Vui lòng nhập tên chức vụ!" },
                                { max: 100, message: "Tên chức vụ không được quá 100 ký tự!" },
                            ]}
                        >
                            <Input placeholder="Ví dụ: Trưởng phòng Nhân sự" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Lương cơ bản (VND)"
                            name="baseSalary"
                            rules={[
                                { required: true, message: "Vui lòng nhập lương cơ bản!" },
                                { type: "number", min: 0, message: "Lương cơ bản phải lớn hơn 0!" },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="15000000"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                                min={0}
                            />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Phụ cấp (VND)"
                            name="allowance"
                            rules={[
                                { type: "number", min: 0, message: "Phụ cấp phải lớn hơn hoặc bằng 0!" },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="2000000"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
                                min={0}
                            />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Cấp bậc"
                            name="gradeLevel"
                            rules={[
                                { type: "number", min: 0, max: 20, message: "Cấp bậc phải từ 0 đến 20!" },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="3"
                                min={0}
                                max={20}
                            />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Mô tả"
                            name="description"
                            rules={[
                                { max: 255, message: "Mô tả không được quá 255 ký tự!" },
                            ]}
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Mô tả về chức vụ..."
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Tạo chức vụ
                                </Button>
                                <Button onClick={() => navigate("/position")}>
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

export default CreatePositionPage;

