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

                // Axios interceptor unwraps response.data
                // Backend returns Employee directly, so res might be Employee or IBackendRes<Employee>
                let employeeData: Employee | null = null;
                
                if (employeeRes && typeof employeeRes === 'object') {
                    // Check if res is IBackendRes (has data field)
                    if ('data' in employeeRes && employeeRes.data) {
                        employeeData = employeeRes.data as Employee;
                    }
                    // Check if res is Employee directly (has id and fullName, but not data field)
                    else if ('id' in employeeRes && 'fullName' in employeeRes && !('data' in employeeRes)) {
                        employeeData = employeeRes as unknown as Employee;
                    }
                }
                
                if (employeeData) {
                    setEmployee(employeeData);
                    form.setFieldsValue({
                        fullName: employeeData.fullName,
                        email: employeeData.email,
                        gender: employeeData.gender,
                        phone: employeeData.phone,
                        address: employeeData.address,
                        dateOfBirth: employeeData.dateOfBirth ? (employeeData.dateOfBirth as string).split("T")[0] : undefined,
                        departmentId: employeeData.departmentId,
                        positionId: employeeData.positionId,
                        status: employeeData.status,
                        startDate: employeeData.startDate ? (employeeData.startDate as string).split("T")[0] : undefined,
                    });
                } else {
                    const errorMsg = (employeeRes as any)?.message 
                        ? (Array.isArray((employeeRes as any).message) ? (employeeRes as any).message[0] : (employeeRes as any).message)
                        : "Không tìm thấy thông tin nhân viên";
                    setError(errorMsg);
                }

                // Handle departments and positions
                const departmentsData = deptRes?.data || deptRes;
                if (Array.isArray(departmentsData)) {
                    setDepartments(departmentsData);
                }

                const positionsData = posRes?.data || posRes;
                if (Array.isArray(positionsData)) {
                    setPositions(positionsData);
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                const errorMessage = error?.response?.data?.message 
                    || error?.message 
                    || "Không thể tải thông tin nhân viên";
                setError(errorMessage);
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

