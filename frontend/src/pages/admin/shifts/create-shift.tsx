import { Button, Form, Input, message, Card, Typography, Space, TimePicker } from "antd";
import type { FormProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createShiftAPI } from "@/services/api";
import type { CreateShiftPayload } from "@/types/shift";

const { Title } = Typography;

type FieldType = {
    name: string;
    startTime?: Dayjs;
    endTime?: Dayjs;
};

const isSuccessResponse = (res: any) =>
    res && typeof res === "object" && (("id" in res) || ("data" in res && res.data));

const getErrorMessage = (error: any, fallback: string) => {
    let serverMessage = error?.response?.data?.message ?? error?.response?.data;
    if (Array.isArray(serverMessage)) {
        serverMessage = serverMessage[0];
    }
    if (typeof serverMessage === "string" && serverMessage.trim()) {
        return serverMessage;
    }
    return error?.message || fallback;
};

const CreateShiftPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm<FieldType>();

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!values.startTime || !values.endTime) {
            message.error("Vui lòng chọn đầy đủ giờ bắt đầu và kết thúc");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: CreateShiftPayload = {
                name: values.name.trim(),
                startTime: values.startTime.toISOString(),
                endTime: values.endTime.toISOString(),
            };

            const res = await createShiftAPI(payload);
            if (isSuccessResponse(res)) {
                message.success("Tạo ca làm việc thành công!");
                form.resetFields();
                setTimeout(() => navigate("/shift"), 1000);
            } else {
                const errorMsg = getErrorMessage(res, "Có lỗi xảy ra khi tạo ca làm việc");
                message.error(errorMsg);
            }
        } catch (error: any) {
            message.error(getErrorMessage(error, "Có lỗi xảy ra khi tạo ca làm việc"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Tạo ca làm việc mới
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
                                    Tạo ca làm việc
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

export default CreateShiftPage;

