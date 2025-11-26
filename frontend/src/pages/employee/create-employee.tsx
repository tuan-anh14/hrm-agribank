import { Button, Form, Input, Select, Card, Typography, Space, InputNumber } from "antd";
import type { FormProps } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createEmployeeWithAccountAPI, getAllDepartmentsAPI, getAllPositionsAPI } from "@/services/api";
import type { CreateEmployeeWithAccountPayload } from "@/types/employee";
import { EmployeeType } from "@/types/employee";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title } = Typography;
const { Option } = Select;

type FieldType = {
    fullName: string;
    employeeCode?: string;
    type?: EmployeeType;
    email: string;
    password: string;
    role: string;
    gender?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    departmentId?: string;
    positionId?: string;
    startDate?: string;
    salaryCoefficient?: number;
    hourlyRate?: number;
};

interface Department {
    id: string;
    name: string;
}

interface Position {
    id: string;
    title: string;
}

const CreateEmployeePage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingPositions, setLoadingPositions] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [employeeType, setEmployeeType] = useState<EmployeeType>(EmployeeType.FULL_TIME);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingDepartments(true);
            setLoadingPositions(true);
            try {
                const [deptRes, posRes] = await Promise.all([
                    getAllDepartmentsAPI(),
                    getAllPositionsAPI(),
                ]);

                // getAllDepartmentsAPI and getAllPositionsAPI return arrays directly
                if (Array.isArray(deptRes)) {
                    setDepartments(deptRes);
                } else if (Array.isArray((deptRes as any)?.data)) {
                    setDepartments((deptRes as any).data);
                }

                if (Array.isArray(posRes)) {
                    setPositions(posRes);
                } else if (Array.isArray((posRes as any)?.data)) {
                    setPositions((posRes as any).data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                notifyError(error, "Không thể tải danh sách phòng ban và chức vụ");
            } finally {
                setLoadingDepartments(false);
                setLoadingPositions(false);
            }
        };

        fetchData();
    }, []);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        setIsSubmitting(true);
        try {
            const payload: CreateEmployeeWithAccountPayload = {
                fullName: values.fullName,
                employeeCode: values.employeeCode,
                type: values.type,
                email: values.email,
                password: values.password,
                role: values.role || "EMPLOYEE",
                gender: values.gender,
                phone: values.phone,
                address: values.address,
                dateOfBirth: values.dateOfBirth || undefined,
                departmentId: values.departmentId,
                positionId: values.positionId,
                startDate: values.startDate || undefined,
                salaryCoefficient: values.salaryCoefficient,
                hourlyRate: values.hourlyRate,
            };

            const res = await createEmployeeWithAccountAPI(payload);

            if (handleApiSuccess(res, "Tạo nhân viên và tài khoản thành công!", "Có lỗi xảy ra khi tạo nhân viên")) {
                form.resetFields();
                setTimeout(() => navigate("/employee"), 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi tạo nhân viên");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Tạo tài khoản nhân viên
                    </Title>

                    <Form
                        form={form}
                        name="create-employee"
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
                            label="Email (sẽ dùng làm username)"
                            name="email"
                            rules={[
                                { required: true, message: "Vui lòng nhập email!" },
                                { type: "email", message: "Email không hợp lệ!" },
                            ]}
                        >
                            <Input placeholder="a.nguyen@agribank.vn" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Mật khẩu"
                            name="password"
                            rules={[
                                { required: true, message: "Vui lòng nhập mật khẩu!" },
                                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                            ]}
                        >
                            <Input.Password placeholder="Mật khẩu tạm thời" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Vai trò"
                            name="role"
                            initialValue="EMPLOYEE"
                        >
                            <Select>
                                <Option value="EMPLOYEE">Nhân viên</Option>
                                <Option value="HR">HR</Option>
                                <Option value="ADMIN">Admin</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Mã nhân viên"
                            name="employeeCode"
                            tooltip="Để trống để tự động sinh mã"
                        >
                            <Input placeholder="EMP001 (tự động nếu để trống)" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Loại nhân viên"
                            name="type"
                            initialValue="FULL_TIME"
                        >
                            <Select onChange={(value) => setEmployeeType(value as EmployeeType)}>
                                <Option value="FULL_TIME">Full-time (Toàn thời gian)</Option>
                                <Option value="PART_TIME">Part-time (Bán thời gian)</Option>
                            </Select>
                        </Form.Item>

                        {employeeType === 'FULL_TIME' && (
                            <Form.Item<FieldType>
                                label="Hệ số lương"
                                name="salaryCoefficient"
                                tooltip="Lương = Lương cơ bản × Hệ số"
                            >
                                <InputNumber style={{ width: '100%' }} step="0.1" placeholder="2.34" />
                            </Form.Item>
                        )}

                        {employeeType === 'PART_TIME' && (
                            <Form.Item<FieldType>
                                label="Lương theo giờ (VNĐ)"
                                name="hourlyRate"
                            >
                                <InputNumber style={{ width: '100%' }} placeholder="50000" />
                            </Form.Item>
                        )}

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
                            label="Ngày sinh (YYYY-MM-DD)"
                            name="dateOfBirth"
                        >
                            <Input placeholder="1990-01-01" type="date" />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Ngày bắt đầu làm việc"
                            name="startDate"
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

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Tạo tài khoản
                                </Button>
                                <Button onClick={() => navigate("/employee")}>
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

export default CreateEmployeePage;
