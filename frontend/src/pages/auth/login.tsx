import { App, Button, Divider, Form, Input, Modal } from 'antd';
import type { FormProps } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.scss';
import { loginAPI } from '@/services/api';
import { useCurrentApp } from '@/components/context/app.context';
import { saveToken } from '@/utils/token.util';

type FieldType = {
    username: string;
    password: string;
};

const LoginPage = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { message, notification } = App.useApp();
    const navigate = useNavigate();
    const { setIsAuthenticated, setUser } = useCurrentApp();

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        const { username, password } = values;
        setIsSubmit(true);

        try {
            const res: any = await loginAPI(username, password);
            console.log('Login response:', res);

            if (res?.access_token && res?.user) {
                if (res.mfa_required) {
                    notification.info({
                        message: "Yêu cầu xác thực 2 bước",
                        description: "Tài khoản của bạn cần nhập mã OTP để hoàn tất đăng nhập.",
                        duration: 5
                    });
                    setIsSubmit(false);
                    return;
                }

                saveToken(res.access_token);
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
                const data = res.data;
                if (data.access_token && data.user) {
                    saveToken(data.access_token);
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
                const errorData = error.response.data;
                errorMessage = errorData?.message
                    ? (Array.isArray(errorData.message) ? errorData.message[0] : errorData.message)
                    : 'Đăng nhập thất bại';
            } else if (error?.message) {
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

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                                <a onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}>
                                    Quên mật khẩu / Hỗ trợ?
                                </a>
                            </div>

                            <Form.Item>
                                <Button type='primary' htmlType='submit' loading={isSubmit} block>
                                    Đăng nhập
                                </Button>
                            </Form.Item>

                            <p className='text text-normal' style={{ textAlign: "center", marginTop: '16px', color: '#666' }}>
                                Tài khoản được quản lý bởi hệ thống HRM Agribank
                            </p>
                        </Form>
                    </section>
                </div>
            </main>
            <Modal
                title="Hỗ trợ đăng nhập"
                open={isModalOpen}
                onOk={() => setIsModalOpen(false)}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button key="ok" type="primary" onClick={() => setIsModalOpen(false)}>
                        Đã hiểu
                    </Button>
                ]}
                centered
            >
                <p>Vui lòng liên hệ bộ phận IT chi nhánh hoặc gọi Hotline nội bộ <strong>1900xxxx</strong> để được cấp lại mật khẩu.</p>
            </Modal>
        </div>
    );
};

export default LoginPage;