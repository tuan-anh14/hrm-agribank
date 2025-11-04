import { App, Button, Divider, Form, Input } from 'antd';
import type { FormProps } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './register.scss';
import { activateAccountAPI } from '@/services/api';

type FieldType = {
    employeeCode: string;
    workEmail: string;
    idLast4?: string;
    dob?: string;
    newPassword: string;
    confirmPassword: string;
};

const RegisterPage = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const { message } = App.useApp();
    const navigate = useNavigate()

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        setIsSubmit(true);
        const { employeeCode, workEmail, idLast4, dob, newPassword } = values;
        const res = await activateAccountAPI({
            employeeCode,
            workEmail,
            idLast4,
            dob,
            newPassword
        });

        if (res.data) {
            message.success("Kích hoạt tài khoản thành công. Vui lòng đăng nhập.");
            navigate("/login");
        } else {
            message.error(res.message)
        }
        setIsSubmit(false)
    };

    return (
        <div className='register-page'>
        <main className='main'>
            <div className='container'>
                <section className='wrapper'>
                    <div className='heading'>
                        <h2 className='text text-large'>Kích hoạt tài khoản</h2>
                        <Divider />
                    </div>
                    <Form
                        name='form-activate'
                        onFinish={onFinish}
                        autoComplete='off'
                    >
                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Mã nhân viên"
                            name="employeeCode"
                            rules={[{ required: true, message: 'Mã nhân viên không được để trống!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Email cơ quan"
                            name="workEmail"
                            rules={[
                                { required: true, message: 'Email cơ quan không được để trống!' },
                                { type: "email", message: "Email không đúng định dạng!" }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Mật khẩu mới"
                            name="newPassword"
                            rules={[{ required: true, message: 'Mật khẩu mới không được để trống!' }]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Xác nhận mật khẩu"
                            name="confirmPassword"
                            dependencies={["newPassword"]}
                            rules={[
                                { required: true, message: 'Xác nhận mật khẩu không được để trống!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="4 số cuối CCCD (tuỳ chọn)"
                            name="idLast4"
                        >
                            <Input maxLength={4} />
                        </Form.Item>

                        <Form.Item<FieldType>
                            labelCol={{ span: 24 }}
                            label="Ngày sinh (tuỳ chọn, yyyy-MM-dd)"
                            name="dob"
                        >
                            <Input placeholder="1990-12-31" />
                        </Form.Item>

                        <Form.Item>
                            <Button type='primary' htmlType='submit' loading={isSubmit}>
                                Kích hoạt
                            </Button>
                        </Form.Item>

                        <Divider>Or</Divider>

                        <p className='text text-normal' style={{ textAlign: "center" }}>
                            Đã có tài khoản?{" "}
                            <Link to="/login" className='text-link'>
                                Đăng nhập
                            </Link>
                        </p>
                    </Form>
                </section>
            </div>
        </main>
    </div>
);
};
export default RegisterPage;