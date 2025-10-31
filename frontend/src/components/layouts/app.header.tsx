import { Avatar, Badge, Input, Layout, Space, Typography, Dropdown, Menu } from "antd";
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, ProfileOutlined } from "@ant-design/icons";
import { useCurrentApp } from "components/context/app.context";
import { Link, useNavigate } from "react-router-dom";
import "./app.header.scss";

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
    const { user, setIsAuthenticated, setUser } = useCurrentApp();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        // setUser(null);
        setIsAuthenticated(false);
        navigate("/login");
    };

    const menu = (
        <Menu>
            <Menu.Item key="profile" icon={<ProfileOutlined />}>
                <Link to="/profile">Hồ sơ cá nhân</Link>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                Đăng xuất
            </Menu.Item>
        </Menu>
    );

    return (
        <Header className="app-header">
            {/* Logo */}
            <div className="logo">
                <Link to="/">
                    <img src="/src/assets/logo.webp" alt="Tuan Anh" className="logo-img" />
                </Link>
            </div>

            {/* Thanh tìm kiếm */}
            <Input.Search
                placeholder="Bạn tìm gì hôm nay"
                className="search-box"
                allowClear
            />

            {/* Giỏ hàng + Avatar User */}
            <Space size="large" className="user-section">
                <Badge count={10} size="small" className="cart-badge">
                    <ShoppingCartOutlined className="cart-icon" />
                </Badge>

                <Dropdown overlay={menu} trigger={['click']}>
                    <Space className="user-info">
                        <Avatar
                            src={`/uploads/${user?.avatar}`}
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