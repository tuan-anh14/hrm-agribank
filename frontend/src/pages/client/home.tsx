import { Card, Row, Col, Typography, Space, Statistic } from 'antd';
import { UserOutlined, TeamOutlined, BankOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useCurrentApp } from '@/components/context/app.context';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const HomePage = () => {
    const { user } = useCurrentApp();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                    <Title level={2}>Chào mừng, {user?.fullName || 'Người dùng'}!</Title>
                    <Text type="secondary">Hệ thống quản lý nhân sự Agribank</Text>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Thời gian hiện tại"
                                value={formatTime(currentTime)}
                                prefix={<BankOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Ngày"
                                value={formatDate(currentTime)}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Vai trò"
                                value={user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'HR' ? 'Nhân sự' : 'Nhân viên'}
                                prefix={<UserOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Email"
                                value={user?.email || 'N/A'}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card title="Thông tin cá nhân" bordered={false}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                    <Text strong>Họ và tên: </Text>
                                    <Text>{user?.fullName || 'Chưa có'}</Text>
                                </div>
                                <div>
                                    <Text strong>Email: </Text>
                                    <Text>{user?.email || 'Chưa có'}</Text>
                                </div>
                                <div>
                                    <Text strong>Số điện thoại: </Text>
                                    <Text>{user?.phone || 'Chưa có'}</Text>
                                </div>
                                <div>
                                    <Text strong>Phòng ban: </Text>
                                    <Text>{(user as any)?.department?.name || 'Chưa phân công'}</Text>
                                </div>
                                <div>
                                    <Text strong>Chức vụ: </Text>
                                    <Text>{(user as any)?.position?.title || 'Chưa phân công'}</Text>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="Hướng dẫn sử dụng" bordered={false}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Text>• Sử dụng menu trên để điều hướng</Text>
                                {user?.role === 'ADMIN' && (
                                    <>
                                        <Text>• Tạo tài khoản nhân viên từ menu Admin</Text>
                                        <Text>• Quản lý nhân viên, phòng ban, chức vụ</Text>
                                    </>
                                )}
                                {user?.role === 'HR' && (
                                    <>
                                        <Text>• Quản lý nhân viên và phòng ban</Text>
                                        <Text>• Xem và cập nhật thông tin nhân sự</Text>
                                    </>
                                )}
                                <Text>• Cập nhật thông tin cá nhân từ menu Profile</Text>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </div>
    );
};

export default HomePage;
