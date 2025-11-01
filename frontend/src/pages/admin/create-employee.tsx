import { App, Button, Form, Input, Select, message } from 'antd';
import type { FormProps } from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEmployeeWithAccountAPI, getAllDepartmentsAPI, getAllPositionsAPI } from '@/services/api';

const { Option } = Select;

type FieldType = {
    fullName: string;
    email: string;
    password: string;
    role: string;
    gender?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    departmentId?: string;
    positionId?: string;
};

const CreateEmployeePage = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingPositions, setLoadingPositions] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoadingDepartments(true);
            setLoadingPositions(true);
            try {
                const [deptRes, posRes] = await Promise.all([
                    getAllDepartmentsAPI(),
                    getAllPositionsAPI()
                ]);

                if (deptRes?.data) {
                    setDepartments(deptRes.data);
                }
                if (posRes?.data) {
                    setPositions(posRes.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoadingDepartments(false);
                setLoadingPositions(false);
            }
        };

        fetchData();
    }, []);

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        setIsSubmit(true);
        try {
            const payload = {
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                role: values.role || 'EMPLOYEE',
                gender: values.gender,
                phone: values.phone,
                address: values.address,
                dateOfBirth: values.dateOfBirth || undefined,
                departmentId: values.departmentId,
                positionId: values.positionId,
            };

            const res = await createEmployeeWithAccountAPI(payload);

            if (res?.data) {
                message.success('Tạo nhân viên và tài khoản thành công!');
                setTimeout(() => {
                    navigate('/admin/employees');
                }, 1500);
            } else {
                message.error(res.message || 'Có lỗi xảy ra');
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo nhân viên');
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '24px' }}>Tạo tài khoản nhân viên</h2>
            <Form
                name="create-employee"
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
            >
                <Form.Item<FieldType>
                    label="Họ và tên"
                    name="fullName"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                >
                    <Input placeholder="Nguyễn Văn A" />
                </Form.Item>

                <Form.Item<FieldType>
                    label="Email (sẽ dùng làm username)"
                    name="email"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email!' },
                        { type: 'email', message: 'Email không hợp lệ!' }
                    ]}
                >
                    <Input placeholder="a.nguyen@agribank.vn" />
                </Form.Item>

                <Form.Item<FieldType>
                    label="Mật khẩu"
                    name="password"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu!' },
                        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
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
                    <Input placeholder="1990-01-01" />
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
                    >
                        {positions.map((pos) => (
                            <Option key={pos.id} value={pos.id}>
                                {pos.title}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isSubmit} block>
                        Tạo tài khoản
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default CreateEmployeePage;

