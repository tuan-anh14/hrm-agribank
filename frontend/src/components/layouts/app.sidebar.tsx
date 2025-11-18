import { Layout, Menu, Drawer } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    DashboardOutlined,
    UserOutlined,
    BankOutlined,
    FileTextOutlined,
    CalendarOutlined,
    DollarOutlined,
    FieldTimeOutlined,
} from '@ant-design/icons';
import { useSidebar } from '@/components/context/sidebar.context';
import { useIsMobile } from '@/hooks/useResponsive';
import { SIDEBAR } from '@/utils/constants';
import type { MenuProps } from 'antd';
import { useEffect, useMemo, useCallback } from 'react';
import './app.sidebar.scss';

const { Sider } = Layout;

const AppSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { collapsed, setCollapsed } = useSidebar();
    const isMobile = useIsMobile();

    useEffect(() => {
        if (isMobile) {
            setCollapsed(true);
        }
    }, [isMobile, setCollapsed]);

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
            key: '/shift',
            icon: <FieldTimeOutlined />,
            label: 'Ca làm việc',
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
    ];

    const handleMenuClick = useCallback<NonNullable<MenuProps['onClick']>>((info) => {
        const { key } = info;
        if (key && typeof key === 'string' && key !== location.pathname) {
            navigate(key);
            if (isMobile) {
                setCollapsed(true);
            }
        }
    }, [navigate, location.pathname, isMobile, setCollapsed]);

    const selectedKeys = useMemo(() => [location.pathname], [location.pathname]);

    const sidebarContent = (
        <>
            <div className="sidebar-header">
                HRM System
            </div>
            <Menu
                mode="inline"
                selectedKeys={selectedKeys}
                items={menuItems}
                onClick={handleMenuClick}
                className="sidebar-menu"
            />
        </>
    );

    if (isMobile) {
        return (
            <Drawer
                title={null}
                placement="left"
                onClose={() => setCollapsed(true)}
                open={!collapsed}
                styles={{ body: { padding: 0 } }}
                width={SIDEBAR.mobileWidth}
                closable={false}
                className="app-sidebar-drawer"
            >
                {sidebarContent}
            </Drawer>
        );
    }

    return (
        <Sider
            width={SIDEBAR.width}
            breakpoint="lg"
            collapsed={collapsed}
            collapsedWidth={SIDEBAR.collapsedWidth}
            collapsible={true}
            trigger={null}
            className="app-sidebar"
        >
            {sidebarContent}
        </Sider>
    );
};

export default AppSidebar;

