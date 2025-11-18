import { Button, Form, Input, Card, Typography, Space, Spin, Alert } from "antd";
import type { FormProps } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDepartmentByIdAPI, updateDepartmentAPI } from "@/services/api";
import type { UpdateDepartmentPayload, Department } from "@/types/department";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    name: string;
    description?: string;
};

const UpdateDepartmentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [department, setDepartment] = useState<Department | null>(null);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Không tìm thấy ID phòng ban");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getDepartmentByIdAPI(id);
                let departmentData: Department | null = null;
                
                if (res && typeof res === 'object') {
                    if ('data' in res && res.data) {
                        departmentData = res.data as Department;
                    } else if ('id' in res && 'name' in res && !('data' in res)) {
                        departmentData = res as unknown as Department;
                    }
                }
                
                if (departmentData) {
                    setDepartment(departmentData);
                    form.setFieldsValue({
                        name: departmentData.name,
                        description: departmentData.description || undefined,
                    });
                } else {
                    const errorMsg = (res as any)?.message 
                        ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
                        : "Không tìm thấy thông tin phòng ban";
                    setError(errorMsg);
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                const errorMessage = error?.response?.data?.message 
                    || error?.message 
                    || "Không thể tải thông tin phòng ban";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, form]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!id) {
            notifyError(new Error("Không tìm thấy ID phòng ban"), "Không tìm thấy ID phòng ban");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: UpdateDepartmentPayload = {
                name: values.name.trim(),
                description: values.description?.trim() || undefined,
            };

            const res = await updateDepartmentAPI(id, payload);

            if (handleApiSuccess(res, "Cập nhật phòng ban thành công!", "Có lỗi xảy ra khi cập nhật phòng ban")) {
                setTimeout(() => {
                    navigate("/department");
                }, 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi cập nhật phòng ban");
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
                        <Typography.Text>Đang tải thông tin phòng ban...</Typography.Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error && !department) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error}
                        action={
                            <Button size="small" onClick={() => navigate("/department")}>
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
                        Cập nhật thông tin phòng ban
                    </Title>

                    <Form
                        form={form}
                        name="update-department"
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
                                    Cập nhật
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

export default UpdateDepartmentPage;

