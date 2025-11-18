import { Button, Form, Select, DatePicker, Input, message, Card, Typography, Space, Spin, Alert } from "antd";
import type { FormProps } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
    getWorkScheduleByIdAPI,
    updateWorkScheduleAPI,
    getAllEmployeesAPI,
    getAllShiftsAPI,
} from "@/services/api";
import type { WorkSchedule, UpdateWorkSchedulePayload } from "@/types/workschedule";
import type { Employee } from "@/types/employee";
import type { Shift } from "@/types/shift";

const { Title, Text } = Typography;
const { TextArea } = Input;

type FieldType = {
    employeeId?: string;
    shiftId?: string;
    date?: dayjs.Dayjs;
    note?: string;
};

const UpdateWorkSchedulePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm<FieldType>();
    const [schedule, setSchedule] = useState<WorkSchedule | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const res = await getAllEmployeesAPI();
                const list: Employee[] = Array.isArray(res)
                    ? res
                    : Array.isArray((res as any)?.data)
                        ? (res as any).data
                        : [];
                setEmployees(list);
            } catch (err) {
                console.error(err);
            }
        };

        const loadShifts = async () => {
            try {
                const res = await getAllShiftsAPI({ page: 1, limit: 100 });
                if (res && typeof res === "object" && "data" in res) {
                    setShifts(res.data);
                } else {
                    setShifts(Array.isArray(res) ? res : []);
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadEmployees();
        loadShifts();
    }, []);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!id) {
                setError("Không tìm thấy ID lịch làm việc");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getWorkScheduleByIdAPI(id);
                let data: WorkSchedule | null = null;

                if (res && typeof res === "object") {
                    if ("data" in res && res.data) {
                        data = res.data as WorkSchedule;
                    } else if ("id" in res && "employeeId" in res && !("data" in res)) {
                        data = res as unknown as WorkSchedule;
                    }
                }

                if (data) {
                    setSchedule(data);
                    form.setFieldsValue({
                        employeeId: data.employeeId,
                        shiftId: data.shiftId,
                        date: dayjs(data.date),
                        note: data.note || undefined,
                    });
                } else {
                    const errorMsg = (res as any)?.message || "Không tìm thấy thông tin lịch";
                    setError(errorMsg);
                }
            } catch (err: any) {
                const errorMessage =
                    err?.response?.data?.message || err?.message || "Không thể tải thông tin lịch";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [id, form]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!id) {
            message.error("Không tìm thấy ID lịch làm việc");
            return;
        }

        if (!values.date) {
            message.error("Vui lòng chọn ngày làm việc");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: UpdateWorkSchedulePayload = {
                employeeId: values.employeeId,
                shiftId: values.shiftId,
                date: values.date.format("YYYY-MM-DD"),
                note: values.note?.trim() || undefined,
            };

            const res = await updateWorkScheduleAPI(id, payload);
            if (res?.data || res?.message) {
                message.success("Cập nhật lịch làm việc thành công!");
                setTimeout(() => navigate("/workschedule"), 1000);
            } else {
                const errorMsg = (res as any)?.message || "Có lỗi xảy ra khi cập nhật lịch";
                message.error(errorMsg);
            }
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi cập nhật lịch";
            message.error(errorMessage);
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
                        <Text>Đang tải thông tin lịch làm việc...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !schedule) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin lịch làm việc"}
                        action={
                            <Button size="small" onClick={() => navigate("/workschedule")}>
                                Quay lại
                            </Button>
                        }
                    />
                </Card>
            </div>
        );
    }

    const isEditable = schedule.status === "PENDING";

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Cập nhật lịch làm việc
                    </Title>

                    {!isEditable && (
                        <Alert
                            type="info"
                            showIcon
                            message="Lịch đã được xử lý"
                            description="Bạn chỉ có thể chỉnh sửa ghi chú khi lịch đã được duyệt hoặc từ chối."
                        />
                    )}

                    <Form<FieldType>
                        form={form}
                        layout="vertical"
                        size="large"
                        onFinish={onFinish}
                    >
                        <Form.Item
                            label="Nhân viên"
                            name="employeeId"
                            rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
                        >
                            <Select
                                placeholder="Chọn nhân viên"
                                showSearch
                                optionFilterProp="children"
                                options={employees.map((emp) => ({
                                    value: emp.id,
                                    label: `${emp.fullName}${emp.email ? ` (${emp.email})` : ""}`,
                                }))}
                                disabled={!isEditable}
                            />
                        </Form.Item>

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
                                disabled={!isEditable}
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
                                disabled={!isEditable}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Ghi chú"
                            name="note"
                            rules={[{ max: 500, message: "Ghi chú không được quá 500 ký tự" }]}
                        >
                            <TextArea rows={4} placeholder="Thêm ghi chú (không bắt buộc)" />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Cập nhật
                                </Button>
                                <Button onClick={() => navigate("/workschedule")}>Huỷ</Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Space>
            </Card>
        </div>
    );
};

export default UpdateWorkSchedulePage;

