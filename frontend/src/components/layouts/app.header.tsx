import { Avatar, Layout, Space, Typography, Dropdown, Menu } from "antd";
import { UserOutlined, LogoutOutlined, ProfileOutlined, UserAddOutlined, HomeOutlined } from "@ant-design/icons";
import { useCurrentApp } from "components/context/app.context";
import { Link, useNavigate } from "react-router-dom";
import "./app.header.scss";

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
    const { user, setIsAuthenticated } = useCurrentApp();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        setIsAuthenticated(false);
        navigate("/login");
    };

    const menu = (
        <Menu>
            <Menu.Item key="home" icon={<HomeOutlined />}>
                <Link to="/">Trang chủ</Link>
            </Menu.Item>
            <Menu.Item key="profile" icon={<ProfileOutlined />}>
                <Link to="/profile">Hồ sơ cá nhân</Link>
            </Menu.Item>
            {user?.role === 'ADMIN' && (
                <Menu.Item key="create-employee" icon={<UserAddOutlined />}>
                    <Link to="/admin/create-employee">Tạo tài khoản nhân viên</Link>
                </Menu.Item>
            )}
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                Đăng xuất
            </Menu.Item>
        </Menu>
    );

    return (
        <Header className="app-header" style={{ backgroundColor: '#001529', padding: '0 24px' }}>
            {/* Logo */}
            <div className="logo">
                <Link to="/" style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                    HRM Agribank
                </Link>
            </div>

            {/* Navigation */}
            <Space size="large" style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Link to="/" style={{ color: '#fff' }}>Trang chủ</Link>
                {user?.role === 'ADMIN' && (
                    <Link to="/admin/create-employee" style={{ color: '#fff' }}>Tạo nhân viên</Link>
                )}
            </Space>

            {/* User Section */}
            <Space size="large" className="user-section">
                <Dropdown menu={menu} trigger={['click']} placement="bottomRight">
                    <Space className="user-info" style={{ cursor: 'pointer' }}>
                        <Avatar
                            src={user?.avatar && user.avatar.trim() ? user.avatar : undefined}
                            alt={user?.fullName}
                            size={32}
                            icon={<UserOutlined />}
                        />
                        <Text style={{ color: '#fff' }}>{user?.fullName || "Guest"}</Text>
                    </Space>
                </Dropdown>
            </Space>
        </Header>
    );
};

export default AppHeader;