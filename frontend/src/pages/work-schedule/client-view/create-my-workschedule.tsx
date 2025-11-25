import { Button, Form, Select, DatePicker, Input, message, Card, Typography, Space } from "antd";
import type { FormProps } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getAllShiftsAPI, createMyWorkScheduleAPI } from "@/services/api";
import type { Shift } from "@/types/shift";
import { handleApiSuccess, notifyError } from "@/utils/notification";
import { useIsMobile } from "@/hooks/useResponsive";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    shiftId?: string;
    date?: dayjs.Dayjs;
    note?: string;
};

const CreateMyWorkSchedulePage: React.FC = () => {
    const [form] = Form.useForm<FieldType>();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shifts, setShifts] = useState<Shift[]>([]);

    useEffect(() => {
        const loadShifts = async () => {
            try {
                const res = await getAllShiftsAPI({ page: 1, limit: 100 });
                if (res && typeof res === "object" && "data" in res) {
                    setShifts(res.data);
                } else {
                    setShifts(Array.isArray(res) ? res : []);
                }
            } catch (error) {
                console.error("Error loading shifts", error);
                message.error("Không thể tải danh sách ca làm việc");
            }
        };

        loadShifts();
    }, []);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!values.shiftId || !values.date) {
            message.error("Vui lòng chọn đầy đủ ca làm việc và ngày");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                shiftId: values.shiftId,
                date: values.date.format("YYYY-MM-DD"),
                note: values.note?.trim() || undefined,
            };

            const res = await createMyWorkScheduleAPI(payload);
            if (
                handleApiSuccess(
                    res,
                    "Đăng ký lịch làm việc thành công! Vui lòng chờ phê duyệt.",
                    "Có lỗi xảy ra khi đăng ký lịch"
                )
            ) {
                form.resetFields();
                setTimeout(() => navigate("/my-workschedule"), 1500);
            }
        } catch (error: any) {
            if (error?.response?.status === 409) {
                message.error(
                    "Bạn đã đăng ký lịch làm việc trong ngày này. Vui lòng chọn ngày khác hoặc cập nhật lịch cũ."
                );
            } else {
                notifyError(error, "Có lỗi xảy ra khi đăng ký lịch");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: isMobile ? "12px" : "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Đăng ký lịch làm việc
                    </Title>

                    <Form<FieldType>
                        form={form}
                        layout="vertical"
                        size="large"
                        onFinish={onFinish}
                    >
                        <Form.Item
                            label="Ca làm việc"
                            name="shiftId"
                            rules={[{ required: true, message: "Vui lòng chọn ca làm việc" }]}
                        >
                            <Select
                                placeholder="Chọn ca làm việc"
                                showSearch
                                optionFilterProp="children"
                                options={shifts.map((shift) => ({
                                    value: shift.id,
                                    label: `${shift.name} (${dayjs(shift.startTime).format("HH:mm")}-${dayjs(shift.endTime).format("HH:mm")})`,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Ngày làm việc"
                            name="date"
                            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                                disabledDate={(current) => current && current < dayjs().startOf("day")}
                                placeholder="Chọn ngày làm việc"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Ghi chú"
                            name="note"
                            rules={[{ max: 500, message: "Ghi chú không được quá 500 ký tự" }]}
                        >
                            <TextArea
                                rows={4}
                                placeholder="Thêm ghi chú (không bắt buộc)"
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Đăng ký
                                </Button>
                                <Button onClick={() => navigate("/my-workschedule")}>Huỷ</Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Space>
            </Card>
        </div>
    );
};

export default CreateMyWorkSchedulePage;

