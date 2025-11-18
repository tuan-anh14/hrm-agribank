import { Button, Form, Input, Card, Typography, Space, Spin, Alert, TimePicker } from "antd";
import type { FormProps } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { getShiftByIdAPI, updateShiftAPI } from "@/services/api";
import { handleApiSuccess, notifyError } from "@/utils/notification";
import type { Shift, UpdateShiftPayload } from "@/types/shift";

const { Title, Text } = Typography;

type FieldType = {
    name: string;
    startTime?: Dayjs;
    endTime?: Dayjs;
};

const UpdateShiftPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm<FieldType>();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shift, setShift] = useState<Shift | null>(null);

    useEffect(() => {
        const fetchShift = async () => {
            if (!id) {
                setError("Không tìm thấy ID ca làm việc");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getShiftByIdAPI(id);
                let shiftData: Shift | null = null;

                if (res && typeof res === "object") {
                    if ("data" in res && res.data) {
                        shiftData = res.data as Shift;
                    } else if ("id" in res && "name" in res && !("data" in res)) {
                        shiftData = res as unknown as Shift;
                    }
                }

                if (shiftData) {
                    setShift(shiftData);
                    form.setFieldsValue({
                        name: shiftData.name,
                        startTime: dayjs(shiftData.startTime),
                        endTime: dayjs(shiftData.endTime),
                    });
                } else {
                    const errorMsg =
                        (res as any)?.message || "Không tìm thấy thông tin ca làm việc";
                    setError(errorMsg);
                }
            } catch (err: any) {
                const errorMessage =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Không thể tải thông tin ca làm việc";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchShift();
    }, [id, form]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!id) {
            message.error("Không tìm thấy ID ca làm việc");
            return;
        }
        if (!values.startTime || !values.endTime) {
            message.error("Vui lòng chọn đầy đủ giờ bắt đầu và kết thúc");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: UpdateShiftPayload = {
                name: values.name?.trim(),
                startTime: values.startTime?.toISOString(),
                endTime: values.endTime?.toISOString(),
            };

            const res = await updateShiftAPI(id, payload);
            if (handleApiSuccess(res, "Cập nhật ca làm việc thành công!", "Có lỗi xảy ra khi cập nhật ca làm việc")) {
                setTimeout(() => navigate("/shift"), 1000);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi cập nhật ca làm việc");
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
                        <Text>Đang tải thông tin ca làm việc...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !shift) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin ca làm việc"}
                        action={
                            <Button size="small" onClick={() => navigate("/shift")}>
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
                        Cập nhật ca làm việc
                    </Title>

                    <Form<FieldType>
                        form={form}
                        layout="vertical"
                        size="large"
                        onFinish={onFinish}
                    >
                        <Form.Item
                            label="Tên ca"
                            name="name"
                            rules={[
                                { required: true, message: "Vui lòng nhập tên ca" },
                                { max: 100, message: "Tên ca không được quá 100 ký tự" },
                            ]}
                        >
                            <Input placeholder="Ví dụ: Ca sáng" />
                        </Form.Item>

                        <Form.Item
                            label="Giờ bắt đầu"
                            name="startTime"
                            rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu" }]}
                        >
                            <TimePicker
                                format="HH:mm"
                                style={{ width: "100%" }}
                                minuteStep={5}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Giờ kết thúc"
                            name="endTime"
                            rules={[{ required: true, message: "Vui lòng chọn giờ kết thúc" }]}
                        >
                            <TimePicker
                                format="HH:mm"
                                style={{ width: "100%" }}
                                minuteStep={5}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Cập nhật
                                </Button>
                                <Button onClick={() => navigate("/shift")}>Huỷ</Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Space>
            </Card>
        </div>
    );
};

export default UpdateShiftPage;

