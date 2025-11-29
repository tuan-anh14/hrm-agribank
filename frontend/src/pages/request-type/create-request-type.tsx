import { Button, Form, Input, Card, Typography, Space } from "antd";
import type { FormProps } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequestTypeAPI } from "@/services/api";
import type { CreateRequestTypePayload } from "@/types/request";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    name: string;
    description?: string;
};

const CreateRequestTypePage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        setIsSubmitting(true);
        try {
            const payload: CreateRequestTypePayload = {
                name: values.name.trim(),
                description: values.description?.trim() || undefined,
            };

            const res = await createRequestTypeAPI(payload);

            if (handleApiSuccess(res, "Tạo loại đơn thành công!", "Có lỗi xảy ra khi tạo loại đơn")) {
                form.resetFields();
                setTimeout(() => {
                    navigate("/request-type");
                }, 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi tạo loại đơn");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Tạo loại đơn mới
                    </Title>

                    <Form
                        form={form}
                        name="create-request-type"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item<FieldType>
                            label="Tên loại đơn"
                            name="name"
                            rules={[
                                { required: true, message: "Vui lòng nhập tên loại đơn!" },
                                { max: 100, message: "Tên loại đơn không được quá 100 ký tự!" },
                            ]}
                        >
                            <Input placeholder="Ví dụ: Nghỉ phép có lương" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Mô tả"
                            name="description"
                            rules={[
                                { max: 500, message: "Mô tả không được quá 500 ký tự!" },
                            ]}
                        >
                            <TextArea 
                                rows={4} 
                                placeholder="Mô tả về loại đơn, quy định, điều kiện..." 
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Tạo loại đơn
                                </Button>
                                <Button onClick={() => navigate("/request-type")}>
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

export default CreateRequestTypePage;

