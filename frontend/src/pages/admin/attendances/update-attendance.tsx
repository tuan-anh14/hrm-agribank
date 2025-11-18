import { Button, Form, Input, message, Card, Typography, Space, Spin, Alert, Select, DatePicker } from "antd";
import type { FormProps } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { getAttendanceByIdAPI, updateAttendanceAPI, getAllEmployeesAPI } from "@/services/api";
import type { UpdateAttendancePayload, Attendance } from "@/types/attendance";
import type { Employee } from "@/types/employee";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    employeeId?: string;
    date?: Dayjs;
    checkInTime?: Dayjs;
    checkOutTime?: Dayjs;
    status?: 'ON_TIME' | 'LATE' | 'ABSENT';
    note?: string;
};

const UpdateAttendancePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attendance, setAttendance] = useState<Attendance | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const navigate = useNavigate();
    const [form] = Form.useForm();

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
            }
        };
        loadEmployees();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Không tìm thấy ID chấm công");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getAttendanceByIdAPI(id);
                let attendanceData: Attendance | null = null;
                
                if (res && typeof res === 'object') {
                    if ('data' in res && res.data) {
                        attendanceData = res.data as Attendance;
                    } else if ('id' in res && 'employeeId' in res && !('data' in res)) {
                        attendanceData = res as unknown as Attendance;
                    }
                }
                
                if (attendanceData) {
                    setAttendance(attendanceData);
                    form.setFieldsValue({
                        employeeId: attendanceData.employeeId,
                        date: attendanceData.date ? dayjs(attendanceData.date) : undefined,
                        checkInTime: attendanceData.checkInTime ? dayjs(attendanceData.checkInTime) : undefined,
                        checkOutTime: attendanceData.checkOutTime ? dayjs(attendanceData.checkOutTime) : undefined,
                        status: attendanceData.status,
                        note: attendanceData.note || undefined,
                    });
                } else {
                    const errorMsg = (res as any)?.message 
                        ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
                        : "Không tìm thấy thông tin chấm công";
                    setError(errorMsg);
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                const errorMessage = error?.response?.data?.message 
                    || error?.message 
                    || "Không thể tải thông tin chấm công";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, form]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!id) {
            message.error("Không tìm thấy ID chấm công");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: UpdateAttendancePayload = {
                employeeId: values.employeeId,
                date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
                checkInTime: values.checkInTime ? values.checkInTime.toISOString() : undefined,
                checkOutTime: values.checkOutTime ? values.checkOutTime.toISOString() : undefined,
                status: values.status,
                note: values.note?.trim() || undefined,
            };

            const res = await updateAttendanceAPI(id, payload);

            let attendanceData = null;
            if (res && typeof res === 'object') {
                if ('data' in res && res.data) {
                    attendanceData = res.data;
                } else if ('id' in res && 'employeeId' in res && !('data' in res)) {
                    attendanceData = res;
                }
            }

            if (attendanceData) {
                message.success("Cập nhật chấm công thành công!");
                setTimeout(() => {
                    navigate("/attendance");
                }, 1500);
            } else {
                const errorMsg = (res as any)?.message 
                    ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
                    : "Có lỗi xảy ra";
                message.error(errorMsg);
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message 
                || error?.message 
                || "Có lỗi xảy ra khi cập nhật chấm công";
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
                        <Typography.Text>Đang tải thông tin chấm công...</Typography.Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error && !attendance) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error}
                        action={
                            <Button size="small" onClick={() => navigate("/attendance")}>
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
                        Cập nhật thông tin chấm công
                    </Title>

                    <Form
                        form={form}
                        name="update-attendance"
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
                                    Cập nhật
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

export default UpdateAttendancePage;

