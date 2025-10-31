import { App, Button, Divider, Form, Input } from 'antd';
import type { FormProps } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login.scss';
import { loginAPI } from '@/services/api';
import { useCurrentApp } from '@/components/context/app.context';

type FieldType = {
    username: string;
    password: string;
};

const LoginPage = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const { message, notification } = App.useApp();
    const navigate = useNavigate();
    const { setIsAuthenticated, setUser } = useCurrentApp()

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        const { username, password } = values;
        setIsSubmit(true);

        setTimeout(async () => {
            const res = await loginAPI(username, password);

            if (res?.data) {
                if (res.data.mfa_required) {
                    notification.info({
                        message: "Yêu cầu xác thực 2 bước",
                        description: "Tài khoản của bạn cần nhập mã OTP để hoàn tất đăng nhập.",
                        duration: 5
                    });
                    setIsSubmit(false);
                    return;
                }

                setIsAuthenticated(true);
                setUser(res.data.user as any);

                const access = res.data.tokens?.accessToken || (res.data as any).access_token;
                if (access) {
                    localStorage.setItem('access_token', access);
                }

                message.success("Đăng nhập thành công.");
                navigate("/");
            } else {
                notification.error({
                    message: "Đăng nhập thất bại",
                    description: res.message && Array.isArray(res.message) ? res.message[0] : res.message,
                    duration: 5
                });
            }

            setIsSubmit(false);
        }, 2000);
    };
    return (
        <div className='login-page'>
            <main className='main'>
                <div className='container'>
                    <section className='wrapper'>
                        <div className='heading'>
                            <h2 className='text text-large'>Đăng nhập</h2>
                            <Divider />
                        </div>
                        <Form
                            name='form-login'
                            onFinish={onFinish}
                            autoComplete='off'
                        >
                            <Form.Item<FieldType>
                                labelCol={{ span: 24 }}
                                label="Email cơ quan hoặc mã nhân viên"
                                name="username"
                                rules={[{ required: true, message: 'Vui lòng nhập email hoặc mã nhân viên!' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item<FieldType>
                                labelCol={{ span: 24 }}
                                label="Mật khẩu"
                                name="password"
                                rules={[{ required: true, message: 'Mật khẩu không được để trống!' }]}
                            >
                                <Input.Password />
                            </Form.Item>

                            <Form.Item>
                                <Button type='primary' htmlType='submit' loading={isSubmit}>
                                    Đăng nhập
                                </Button>
                            </Form.Item>

                            <Divider>Or</Divider>

                            <p className='text text-normal' style={{ textAlign: "center" }}>
                                Chưa có tài khoản? {" "}
                                <Link to="/register" className='text-link'>
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </Form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;