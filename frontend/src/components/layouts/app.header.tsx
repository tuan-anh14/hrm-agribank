import { Avatar, Layout, Space, Typography, Dropdown, Button, Modal, Descriptions } from "antd";
import type { MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined, ProfileOutlined, QuestionCircleOutlined, SettingOutlined, MenuOutlined } from "@ant-design/icons";
import { useCurrentApp } from "components/context/app.context";
import { useSidebar } from "@/components/context/sidebar.context";
import { useResponsive } from "@/hooks/useResponsive";
import { useNavigate } from "react-router-dom";
import { removeToken } from "@/utils/token.util";
import { useState, useMemo } from "react";
import "./app.header.scss";

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
    const { user, setIsAuthenticated } = useCurrentApp();
    const { toggleSidebar } = useSidebar();
    const navigate = useNavigate();
    const { isMobile, width } = useResponsive();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    
    const showUsername = useMemo(() => width >= 576, [width]);

    const handleLogout = () => {
        removeToken();
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
    };

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'profile') {
            setIsProfileModalOpen(true);
        } else if (key === 'logout') {
            handleLogout();
        }
    };

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <ProfileOutlined />,
            label: 'Thông tin tài khoản',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
        },
    ];

    return (
        <Header style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            flexWrap: 'wrap',
            gap: '8px',
        }}>
            <Space size="middle">
                <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={toggleSidebar}
                    style={{
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                />
                <Typography.Text strong style={{ 
                    fontSize: isMobile ? '14px' : '18px', 
                    color: '#1890ff',
                    flexShrink: 0,
                }}>
                    HRM Agribank
                </Typography.Text>
            </Space>

            <Space size="middle" wrap>
                {!isMobile && (
                    <>
                        <Button type="text" icon={<QuestionCircleOutlined />} />
                        <Button type="text" icon={<SettingOutlined />} />
                    </>
                )}
                <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']} placement="bottomRight">
                    <Space style={{ cursor: 'pointer' }} size="small">
                        <Avatar
                            src={user?.avatar && user.avatar.trim() ? user.avatar : undefined}
                            alt={user?.fullName}
                            size={32}
                            icon={<UserOutlined />}
                        />
                        {showUsername && (
                            <Text>{user?.fullName || "Guest"}</Text>
                        )}
                    </Space>
                </Dropdown>
            </Space>

            <Modal
                title="Thông tin tài khoản"
                open={isProfileModalOpen}
                onCancel={() => setIsProfileModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsProfileModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
                width="90%"
                style={{ maxWidth: '600px' }}
            >
                <Descriptions column={1} bordered>
                    <Descriptions.Item label="Họ và tên">
                        {user?.fullName || 'Chưa có'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                        {user?.email || 'Chưa có'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                        {user?.phone || 'Chưa có'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Vai trò">
                        {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'HR' ? 'Nhân sự' : 'Nhân viên'}
                    </Descriptions.Item>
                    {(user as IUserHRM)?.department && (
                        <Descriptions.Item label="Phòng ban">
                            {(user as IUserHRM).department?.name || 'Chưa phân công'}
                        </Descriptions.Item>
                    )}
                    {(user as IUserHRM)?.position && (
                        <Descriptions.Item label="Chức vụ">
                            {(user as IUserHRM).position?.title || 'Chưa phân công'}
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </Modal>
        </Header>
    );
};

export default AppHeader;