import { Button, Form, Input, Select, message, Card, Typography, Space, Spin, Alert } from "antd";
import type { FormProps } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getEmployeeByIdAPI,
    updateEmployeeAPI,
    getAllDepartmentsAPI,
    getAllPositionsAPI,
} from "@/services/api";
import type { UpdateEmployeePayload } from "@/types/employee";
import type { Employee } from "@/types/employee";

const { Title } = Typography;
const { Option } = Select;

type FieldType = {
    fullName: string;
    email?: string;
    gender?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    departmentId?: string;
    positionId?: string;
    status?: string;
    startDate?: string;
};

interface Department {
    id: string;
    name: string;
}

interface Position {
    id: string;
    title: string;
}

const UpdateEmployeePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingPositions, setLoadingPositions] = useState(false);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Không tìm thấy ID nhân viên");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            setLoadingDepartments(true);
            setLoadingPositions(true);

            try {
                const [employeeRes, deptRes, posRes] = await Promise.all([
                    getEmployeeByIdAPI(id),
                    getAllDepartmentsAPI(),
                    getAllPositionsAPI(),
                ]);

                if (employeeRes?.data) {
                    const emp = employeeRes.data;
                    setEmployee(emp);
                    form.setFieldsValue({
                        fullName: emp.fullName,
                        email: emp.email,
                        gender: emp.gender,
                        phone: emp.phone,
                        address: emp.address,
                        dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split("T")[0] : undefined,
                        departmentId: emp.departmentId,
                        positionId: emp.positionId,
                        status: emp.status,
                        startDate: emp.startDate ? emp.startDate.split("T")[0] : undefined,
                    });
                } else {
                    setError("Không tìm thấy thông tin nhân viên");
                }

                if (deptRes?.data) {
                    setDepartments(deptRes.data);
                }
                if (posRes?.data) {
                    setPositions(posRes.data);
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                setError(error?.response?.data?.message || "Không thể tải thông tin nhân viên");
            } finally {
                setLoading(false);
                setLoadingDepartments(false);
                setLoadingPositions(false);
            }
        };

        fetchData();
    }, [id, form]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!id) {
            message.error("Không tìm thấy ID nhân viên");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: UpdateEmployeePayload = {
                fullName: values.fullName,
                email: values.email,
                gender: values.gender,
                phone: values.phone,
                address: values.address,
                dateOfBirth: values.dateOfBirth || undefined,
                departmentId: values.departmentId,
                positionId: values.positionId,
                status: values.status,
                startDate: values.startDate || undefined,
            };

            const res = await updateEmployeeAPI(id, payload);

            if (res?.data) {
                message.success("Cập nhật nhân viên thành công!");
                setTimeout(() => {
                    navigate("/admin/employees");
                }, 1500);
            } else {
                message.error(res?.message || "Có lỗi xảy ra");
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật nhân viên");
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
                        <Typography.Text>Đang tải thông tin nhân viên...</Typography.Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error && !employee) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error}
                        action={
                            <Button size="small" onClick={() => navigate("/admin/employees")}>
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
                        Cập nhật thông tin nhân viên
                    </Title>

                    <Form
                        form={form}
                        name="update-employee"
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item<FieldType>
                            label="Họ và tên"
                            name="fullName"
                            rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
                        >
                            <Input placeholder="Nguyễn Văn A" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Email"
                            name="email"
                            rules={[{ type: "email", message: "Email không hợp lệ!" }]}
                        >
                            <Input placeholder="a.nguyen@agribank.vn" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Giới tính"
                            name="gender"
                        >
                            <Select placeholder="Chọn giới tính">
                                <Option value="Nam">Nam</Option>
                                <Option value="Nữ">Nữ</Option>
                                <Option value="Khác">Khác</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Số điện thoại"
                            name="phone"
                        >
                            <Input placeholder="0123456789" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Ngày sinh"
                            name="dateOfBirth"
                        >
                            <Input type="date" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Địa chỉ"
                            name="address"
                        >
                            <Input.TextArea rows={2} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Phòng ban"
                            name="departmentId"
                        >
                            <Select
                                placeholder="Chọn phòng ban"
                                loading={loadingDepartments}
                                showSearch
                                optionFilterProp="children"
                                allowClear
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string)
                                        ?.toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                            >
                                {departments.map((dept) => (
                                    <Option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Chức vụ"
                            name="positionId"
                        >
                            <Select
                                placeholder="Chọn chức vụ"
                                loading={loadingPositions}
                                showSearch
                                optionFilterProp="children"
                                allowClear
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string)
                                        ?.toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                            >
                                {positions.map((pos) => (
                                    <Option key={pos.id} value={pos.id}>
                                        {pos.title}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Trạng thái"
                            name="status"
                        >
                            <Select placeholder="Chọn trạng thái">
                                <Option value="working">Đang làm việc</Option>
                                <Option value="on_leave">Nghỉ phép</Option>
                                <Option value="inactive">Không hoạt động</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Ngày bắt đầu làm việc"
                            name="startDate"
                        >
                            <Input type="date" />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Cập nhật
                                </Button>
                                <Button onClick={() => navigate("/admin/employees")}>
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

export default UpdateEmployeePage;

