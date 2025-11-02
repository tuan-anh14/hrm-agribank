import { Card, Row, Col, Typography, Statistic, Progress } from 'antd';
import {
    UserOutlined,
    TeamOutlined,
    UsergroupAddOutlined,
    RiseOutlined,
    BankOutlined,
    TrophyOutlined,
} from '@ant-design/icons';
import { useCurrentApp } from '@/components/context/app.context';

const { Title } = Typography;

const HomePage = () => {
    const { user } = useCurrentApp();

    // Mock data - sẽ thay thế bằng API calls sau
    const stats = {
        totalEmployees: 156,
        newHires: 12,
        turnoverRate: 8.5,
        attendanceRate: 95.2,
    };

    return (
        <div>
            {/* Welcome Header */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>
                    Chào mừng, {user?.fullName || 'Người dùng'}!
                </Title>
                <Typography.Text type="secondary">
                    Hệ thống quản lý nhân sự Agribank
                </Typography.Text>
            </div>

            {/* Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng nhân viên"
                            value={stats.totalEmployees}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#999' }}>
                            Đang hoạt động
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tuyển dụng tháng này"
                            value={stats.newHires}
                            prefix={<UsergroupAddOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#999' }}>
                            Nhân viên mới
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tỷ lệ nghỉ việc"
                            value={stats.turnoverRate}
                            suffix="%"
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#999' }}>
                            Tháng này
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tỷ lệ chấm công"
                            value={stats.attendanceRate}
                            suffix="%"
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                        <div style={{ marginTop: '8px' }}>
                            <Progress
                                percent={stats.attendanceRate}
                                size="small"
                                strokeColor="#722ed1"
                                showInfo={false}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Personal Info and Quick Stats */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="Thông tin cá nhân" variant="outlined">
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Typography.Text type="secondary">Họ và tên</Typography.Text>
                                <div style={{ marginTop: '4px', fontWeight: 500 }}>
                                    {user?.fullName || 'Chưa có'}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Typography.Text type="secondary">Email</Typography.Text>
                                <div style={{ marginTop: '4px', fontWeight: 500 }}>
                                    {user?.email || 'Chưa có'}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Typography.Text type="secondary">Số điện thoại</Typography.Text>
                                <div style={{ marginTop: '4px', fontWeight: 500 }}>
                                    {user?.phone || 'Chưa có'}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Typography.Text type="secondary">Vai trò</Typography.Text>
                                <div style={{ marginTop: '4px', fontWeight: 500 }}>
                                    {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'HR' ? 'Nhân sự' : 'Nhân viên'}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Typography.Text type="secondary">Phòng ban</Typography.Text>
                                <div style={{ marginTop: '4px', fontWeight: 500 }}>
                                    {(user as any)?.department?.name || 'Chưa phân công'}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Typography.Text type="secondary">Chức vụ</Typography.Text>
                                <div style={{ marginTop: '4px', fontWeight: 500 }}>
                                    {(user as any)?.position?.title || 'Chưa phân công'}
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Hoạt động nhanh" variant="outlined">
                        <Row gutter={[16, 16]}>
                            {user?.role === 'ADMIN' && (
                                <>
                                    <Col span={24}>
                                        <Card
                                            size="small"
                                            style={{ backgroundColor: '#f0f5ff', border: '1px solid #adc6ff' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <Typography.Text strong>Tạo nhân viên mới</Typography.Text>
                                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                                        Thêm tài khoản nhân viên vào hệ thống
                                                    </div>
                                                </div>
                                                <BankOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={24}>
                                        <Card
                                            size="small"
                                            style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <Typography.Text strong>Quản lý phòng ban</Typography.Text>
                                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                                        Xem và quản lý các phòng ban
                                                    </div>
                                                </div>
                                                <TeamOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                                            </div>
                                        </Card>
                                    </Col>
                                </>
                            )}
                            <Col span={24}>
                                <Card
                                    size="small"
                                    style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <Typography.Text strong>Xem chấm công</Typography.Text>
                                            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                                Xem lịch sử chấm công của bạn
                                            </div>
                                        </div>
                                        <TrophyOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default HomePage;
