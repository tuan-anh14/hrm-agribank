import { Button, Form, Input, Card, Typography, Space, Select, DatePicker } from "antd";
import type { FormProps } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type Dayjs } from "dayjs";
import { createAttendanceAPI, getAllEmployeesAPI } from "@/services/api";
import type { CreateAttendancePayload } from "@/types/attendance";
import type { Employee } from "@/types/employee";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    employeeId: string;
    date?: Dayjs;
    checkInTime?: Dayjs;
    checkOutTime?: Dayjs;
    status?: 'ON_TIME' | 'LATE' | 'ABSENT';
    note?: string;
};

const CreateAttendancePage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [employees, setEmployees] = useState<Employee[]>([]);

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
            } catch (error) {
                console.error("Error loading employees:", error);
                notifyError(error, "Không thể tải danh sách nhân viên");
            }
        };
        loadEmployees();
    }, []);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        setIsSubmitting(true);
        try {
            const payload: CreateAttendancePayload = {
                employeeId: values.employeeId,
                date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
                checkInTime: values.checkInTime ? values.checkInTime.toISOString() : undefined,
                checkOutTime: values.checkOutTime ? values.checkOutTime.toISOString() : undefined,
                status: values.status,
                note: values.note?.trim() || undefined,
            };

            const res = await createAttendanceAPI(payload);

            if (handleApiSuccess(res, "Tạo chấm công thành công!", "Có lỗi xảy ra khi tạo chấm công")) {
                form.resetFields();
                setTimeout(() => {
                    navigate("/attendance");
                }, 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi tạo chấm công");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Tạo chấm công mới
                    </Title>

                    <Form
                        form={form}
                        name="create-attendance"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item<FieldType>
                            label="Nhân viên"
                            name="employeeId"
                            rules={[
                                { required: true, message: "Vui lòng chọn nhân viên!" },
                            ]}
                        >
                            <Select
                                placeholder="Chọn nhân viên"
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={employees.map(emp => ({
                                    value: emp.id,
                                    label: `${emp.fullName}${emp.email ? ` (${emp.email})` : ''}`,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Ngày chấm công"
                            name="date"
                            rules={[
                                { required: true, message: "Vui lòng chọn ngày chấm công!" },
                            ]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                                placeholder="Chọn ngày"
                            />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Giờ check-in"
                            name="checkInTime"
                        >
                            <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm:ss"
                                style={{ width: "100%" }}
                                placeholder="Chọn giờ check-in"
                            />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Giờ check-out"
                            name="checkOutTime"
                        >
                            <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm:ss"
                                style={{ width: "100%" }}
                                placeholder="Chọn giờ check-out"
                            />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Trạng thái"
                            name="status"
                        >
                            <Select
                                placeholder="Chọn trạng thái"
                                options={[
                                    { value: 'ON_TIME', label: 'Đúng giờ' },
                                    { value: 'LATE', label: 'Muộn' },
                                    { value: 'ABSENT', label: 'Vắng mặt' },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Ghi chú"
                            name="note"
                            rules={[
                                { max: 500, message: "Ghi chú không được quá 500 ký tự!" },
                            ]}
                        >
                            <TextArea
                                rows={4}
                                placeholder="Ghi chú về chấm công..."
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Tạo chấm công
                                </Button>
                                <Button onClick={() => navigate("/attendance")}>
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

export default CreateAttendancePage;

