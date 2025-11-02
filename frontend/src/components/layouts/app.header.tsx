import { Avatar, Layout, Space, Typography, Dropdown, Menu, Button } from "antd";
import { UserOutlined, LogoutOutlined, ProfileOutlined, QuestionCircleOutlined, SettingOutlined } from "@ant-design/icons";
import { useCurrentApp } from "components/context/app.context";
import { useNavigate } from "react-router-dom";
import { removeToken } from "@/utils/token.util";
import "./app.header.scss";

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
    const { user, setIsAuthenticated } = useCurrentApp();
    const navigate = useNavigate();

    const handleLogout = () => {
        removeToken();
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
    };

    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<ProfileOutlined />}>
                Hồ sơ cá nhân
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                Đăng xuất
            </Menu.Item>
        </Menu>
    );

    return (
        <Header style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                HRM Agribank
            </div>

            <Space size="large">
                <Button type="text" icon={<QuestionCircleOutlined />} />
                <Button type="text" icon={<SettingOutlined />} />
                <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
                    <Space style={{ cursor: 'pointer' }}>
                        <Avatar
                            src={user?.avatar && user.avatar.trim() ? user.avatar : undefined}
                            alt={user?.fullName}
                            size={32}
                            icon={<UserOutlined />}
                        />
                        <Text>{user?.fullName || "Guest"}</Text>
                    </Space>
                </Dropdown>
            </Space>
        </Header>
    );
};

export default AppHeader;