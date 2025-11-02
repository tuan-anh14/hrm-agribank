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

        try {
            const res: any = await loginAPI(username, password);
            console.log('Login response:', res);

            // Axios interceptor đã trả về response.data
            // Backend trả về trực tiếp: { access_token, token_type, expires_in, user }
            // Không wrap trong IBackendRes format
            if (res?.access_token && res?.user) {
                // Check MFA nếu có
                if (res.mfa_required) {
                    notification.info({
                        message: "Yêu cầu xác thực 2 bước",
                        description: "Tài khoản của bạn cần nhập mã OTP để hoàn tất đăng nhập.",
                        duration: 5
                    });
                    setIsSubmit(false);
                    return;
                }

                // Lưu token và user info
                localStorage.setItem('access_token', res.access_token);
                setIsAuthenticated(true);
                setUser({
                    id: res.user.id,
                    email: res.user.email,
                    fullName: res.user.fullName,
                    role: res.user.role,
                    phone: res.user.phone || '',
                    avatar: res.user.avatar || '',
                });

                message.success("Đăng nhập thành công.");
                navigate("/");
            } else if (res?.data) {
                // Fallback: Nếu backend wrap trong data object (format khác)
                const data = res.data;
                if (data.access_token && data.user) {
                    localStorage.setItem('access_token', data.access_token);
                    setIsAuthenticated(true);
                    setUser({
                        id: data.user.id,
                        email: data.user.email,
                        fullName: data.user.fullName,
                        role: data.user.role,
                        phone: data.user.phone || '',
                        avatar: data.user.avatar || '',
                    });
                    message.success("Đăng nhập thành công.");
                    navigate("/");
                } else {
                    throw new Error('Định dạng response không hợp lệ');
                }
            } else {
                // Error response từ backend
                const errorMsg = res?.message 
                    ? (Array.isArray(res.message) ? res.message[0] : res.message)
                    : 'Vui lòng kiểm tra lại thông tin đăng nhập';
                
                notification.error({
                    message: "Đăng nhập thất bại",
                    description: errorMsg,
                    duration: 5
                });
            }
        } catch (error: any) {
            console.error('Login error:', error);
            
            let errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng.';
            
            if (error?.response?.data) {
                // Server trả về error response
                const errorData = error.response.data;
                errorMessage = errorData?.message 
                    ? (Array.isArray(errorData.message) ? errorData.message[0] : errorData.message)
                    : 'Đăng nhập thất bại';
            } else if (error?.message) {
                // Network error hoặc axios error
                if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED') {
                    errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.';
                } else {
                    errorMessage = error.message;
                }
            }

            notification.error({
                message: "Đăng nhập thất bại",
                description: errorMessage,
                duration: 5
            });
        } finally {
            setIsSubmit(false);
        }
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