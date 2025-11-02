import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    DashboardOutlined,
    UserOutlined,
    TeamOutlined,
    BankOutlined,
    FileTextOutlined,
    CalendarOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import { useCurrentApp } from '@/components/context/app.context';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

const AppSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useCurrentApp();

    const menuItems: MenuProps['items'] = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/employee',
            icon: <UserOutlined />,
            label: 'Nhân viên',
        },
        {
            key: 'admin',
            icon: <TeamOutlined />,
            label: 'Quản trị',
            children: user?.role === 'ADMIN' ? [
                {
                    key: '/admin/create-employee',
                    icon: <UserOutlined />,
                    label: 'Tạo nhân viên',
                },
            ] : [],
        },
        {
            key: '/department',
            icon: <BankOutlined />,
            label: 'Phòng ban',
        },
        {
            key: '/position',
            icon: <FileTextOutlined />,
            label: 'Chức vụ',
        },
        {
            key: '/attendance',
            icon: <CalendarOutlined />,
            label: 'Chấm công',
        },
        {
            key: '/payroll',
            icon: <DollarOutlined />,
            label: 'Lương',
        },
    ].filter(item => {
        // Filter admin menu if not ADMIN
        if (item.key === 'admin' && user?.role !== 'ADMIN') {
            return false;
        }
        return true;
    });

    const handleMenuClick = ({ key }: { key: string }) => {
        if (key && key !== location.pathname) {
            navigate(key);
        }
    };

    const selectedKeys = [location.pathname];

    return (
        <Sider
            width={200}
            style={{
                background: '#fff',
                boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
            }}
        >
            <div style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #f0f0f0',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#1890ff',
            }}>
                HRM System
            </div>
            <Menu
                mode="inline"
                selectedKeys={selectedKeys}
                items={menuItems}
                onClick={handleMenuClick}
                style={{
                    height: 'calc(100vh - 64px)',
                    borderRight: 0,
                }}
            />
        </Sider>
    );
};

export default AppSidebar;

