import { Button, Form, Input, InputNumber, Card, Typography, Space, Spin, Alert } from "antd";
import type { FormProps } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPositionByIdAPI, updatePositionAPI } from "@/services/api";
import { handleApiSuccess, notifyError } from "@/utils/notification";
import type { UpdatePositionPayload, Position } from "@/types/position";

const { Title } = Typography;

type FieldType = {
    title: string;
    baseSalary: number;
    allowance?: number;
    gradeLevel?: number;
    description?: string;
};

const UpdatePositionPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [position, setPosition] = useState<Position | null>(null);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Không tìm thấy ID chức vụ");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getPositionByIdAPI(id);
                let positionData: Position | null = null;

                if (res && typeof res === 'object') {
                    if ('data' in res && res.data) {
                        positionData = res.data as Position;
                    } else if ('id' in res && 'title' in res && !('data' in res)) {
                        positionData = res as unknown as Position;
                    }
                }

                if (positionData) {
                    setPosition(positionData);
                    form.setFieldsValue({
                        title: positionData.title,
                        baseSalary: positionData.baseSalary,
                        allowance: positionData.allowance || undefined,
                        gradeLevel: positionData.gradeLevel || undefined,
                        description: positionData.description || undefined,
                    });
                } else {
                    const errorMsg = (res as any)?.message
                        ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
                        : "Không tìm thấy thông tin chức vụ";
                    setError(errorMsg);
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                const errorMessage = error?.response?.data?.message
                    || error?.message
                    || "Không thể tải thông tin chức vụ";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, form]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!id) {
            notifyError(new Error("Không tìm thấy ID chức vụ"), "Không tìm thấy ID chức vụ");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: UpdatePositionPayload = {
                title: values.title.trim(),
                baseSalary: values.baseSalary,
                allowance: values.allowance || undefined,
                gradeLevel: values.gradeLevel || undefined,
                description: values.description?.trim() || undefined,
            };

            const res = await updatePositionAPI(id, payload);

            if (handleApiSuccess(res, "Cập nhật chức vụ thành công!", "Có lỗi xảy ra khi cập nhật chức vụ")) {
                setTimeout(() => {
                    navigate("/position");
                }, 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi cập nhật chức vụ");
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
                        <Typography.Text>Đang tải thông tin chức vụ...</Typography.Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error && !position) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error}
                        action={
                            <Button size="small" onClick={() => navigate("/position")}>
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
                        Cập nhật thông tin chức vụ
                    </Title>

                    <Form
                        form={form}
                        name="update-position"
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
                                    Cập nhật
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

export default UpdatePositionPage;

