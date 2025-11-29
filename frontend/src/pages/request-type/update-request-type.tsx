import { Button, Form, Input, Card, Typography, Space, Spin, Alert } from "antd";
import type { FormProps } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRequestTypeByIdAPI, updateRequestTypeAPI } from "@/services/api";
import type { UpdateRequestTypePayload, RequestType } from "@/types/request";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    name: string;
    description?: string;
};

const UpdateRequestTypePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requestType, setRequestType] = useState<RequestType | null>(null);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Không tìm thấy ID loại đơn");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getRequestTypeByIdAPI(id);
                let requestTypeData: RequestType | null = null;
                
                if (res && typeof res === 'object') {
                    if ('data' in res && res.data) {
                        requestTypeData = res.data as RequestType;
                    } else if ('id' in res && 'name' in res && !('data' in res)) {
                        requestTypeData = res as unknown as RequestType;
                    }
                }
                
                if (requestTypeData) {
                    setRequestType(requestTypeData);
                    form.setFieldsValue({
                        name: requestTypeData.name,
                        description: requestTypeData.description || undefined,
                    });
                } else {
                    const errorMsg = (res as any)?.message 
                        ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
                        : "Không tìm thấy thông tin loại đơn";
                    setError(errorMsg);
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                const errorMessage = error?.response?.data?.message 
                    || error?.message 
                    || "Không thể tải thông tin loại đơn";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, form]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!id) {
            notifyError(new Error("Không tìm thấy ID loại đơn"), "Không tìm thấy ID loại đơn");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: UpdateRequestTypePayload = {
                name: values.name.trim(),
                description: values.description?.trim() || undefined,
            };

            const res = await updateRequestTypeAPI(id, payload);

            if (handleApiSuccess(res, "Cập nhật loại đơn thành công!", "Có lỗi xảy ra khi cập nhật loại đơn")) {
                setTimeout(() => {
                    navigate("/request-type");
                }, 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi cập nhật loại đơn");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Typography.Text>Đang tải thông tin loại đơn...</Typography.Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error && !requestType) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error}
                        action={
                            <Button size="small" onClick={() => navigate("/request-type")}>
                                Quay lại
                            </Button>
                        }
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Cập nhật thông tin loại đơn
                    </Title>

                    <Form
                        form={form}
                        name="update-request-type"
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
                                    Cập nhật
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

export default UpdateRequestTypePage;

