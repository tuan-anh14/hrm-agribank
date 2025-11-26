import { Button, Form, Select, DatePicker, Input, message, Card, Typography, Space } from "antd";
import type { FormProps } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getAllEmployeesAPI, getAllShiftsAPI, createWorkScheduleAPI, createMyWorkScheduleAPI } from "@/services/api";
import type { Employee } from "@/types/employee";
import type { Shift } from "@/types/shift";
import type { CreateWorkSchedulePayload } from "@/types/workschedule";
import { handleApiSuccess, notifyError } from "@/utils/notification";
import { useCurrentApp } from "@/components/context/app.context";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    employeeId?: string;
    shiftId?: string;
    date?: dayjs.Dayjs;
    note?: string;
};

const CreateWorkSchedulePage: React.FC = () => {
    const { user } = useCurrentApp();
    const [form] = Form.useForm<FieldType>();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);

    const isAdmin = user?.role === "ADMIN";
    const isHR = user?.role === "HR";
    const isEmployee = !isAdmin && !isHR;

    useEffect(() => {
        if (isEmployee && user?.id) {
            form.setFieldsValue({ employeeId: user.id });
        }
    }, [isEmployee, user?.id, form]);

    useEffect(() => {
        const loadEmployees = async () => {
            if (isEmployee) return;
            try {
                const res = await getAllEmployeesAPI();
                const list: Employee[] = Array.isArray(res)
                    ? res
                    : Array.isArray((res as any)?.data)
                        ? (res as any).data
                        : [];
                setEmployees(list);
            } catch (error) {
                console.error("Error loading employees", error);
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
            } catch (error) {
                console.error("Error loading shifts", error);
            }
        };

        loadEmployees();
        loadShifts();
    }, [isEmployee]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!values.employeeId || !values.shiftId || !values.date) {
            message.error("Vui lòng chọn đầy đủ nhân viên, ca làm và ngày");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: CreateWorkSchedulePayload = {
                employeeId: values.employeeId,
                shiftId: values.shiftId,
                date: values.date.format("YYYY-MM-DD"),
                note: values.note?.trim() || undefined,
            };

            let res;
            if (isEmployee) {
                // Remove employeeId for self-registration
                const { employeeId, ...rest } = payload;
                res = await createMyWorkScheduleAPI(rest);
            } else {
                res = await createWorkScheduleAPI(payload);
            }
            const successMsg = isEmployee ? "Đăng ký lịch thành công!" : "Tạo lịch làm việc thành công!";
            if (handleApiSuccess(res, successMsg, "Có lỗi xảy ra khi tạo lịch")) {
                form.resetFields();
                setTimeout(() => navigate("/workschedule"), 1000);
            }
        } catch (error: any) {
            if (error?.response?.status === 409) {
                message.error("Nhân viên đã có lịch làm việc trong ngày này. Vui lòng chọn ngày khác hoặc cập nhật lịch cũ.");
            } else {
                notifyError(error, "Có lỗi xảy ra khi tạo lịch");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        {isEmployee ? "Đăng ký lịch làm việc" : "Tạo lịch làm việc mới"}
                    </Title>

                    <Form<FieldType>
                        form={form}
                        layout="vertical"
                        size="large"
                        onFinish={onFinish}
                    >
                        {!isEmployee && (
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
                                />
                            </Form.Item>
                        )}

                        {/* Hidden field for employeeId when isEmployee is true */}
                        {isEmployee && (
                            <Form.Item name="employeeId" hidden>
                                <Input />
                            </Form.Item>
                        )}

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
                                    {isEmployee ? "Đăng ký" : "Tạo lịch"}
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

export default CreateWorkSchedulePage;

