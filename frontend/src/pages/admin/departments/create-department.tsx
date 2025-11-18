import { Button, Form, Input, Card, Typography, Space } from "antd";
import type { FormProps } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDepartmentAPI } from "@/services/api";
import type { CreateDepartmentPayload } from "@/types/department";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    name: string;
    description?: string;
};

const CreateDepartmentPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        setIsSubmitting(true);
        try {
            const payload: CreateDepartmentPayload = {
                name: values.name.trim(),
                description: values.description?.trim() || undefined,
            };

            const res = await createDepartmentAPI(payload);

            if (handleApiSuccess(res, "Tạo phòng ban thành công!", "Có lỗi xảy ra khi tạo phòng ban")) {
                form.resetFields();
                setTimeout(() => {
                    navigate("/department");
                }, 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi tạo phòng ban");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Tạo phòng ban mới
                    </Title>

                    <Form
                        form={form}
                        name="create-department"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item<FieldType>
                            label="Tên phòng ban"
                            name="name"
                            rules={[
                                { required: true, message: "Vui lòng nhập tên phòng ban!" },
                                { max: 100, message: "Tên phòng ban không được quá 100 ký tự!" },
                            ]}
                        >
                            <Input placeholder="Ví dụ: Phòng Nhân sự" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Mô tả"
                            name="description"
                            rules={[
                                { max: 255, message: "Mô tả không được quá 255 ký tự!" },
                            ]}
                        >
                            <TextArea 
                                rows={4} 
                                placeholder="Mô tả về phòng ban, chức năng, nhiệm vụ..." 
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Tạo phòng ban
                                </Button>
                                <Button onClick={() => navigate("/department")}>
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

export default CreateDepartmentPage;

