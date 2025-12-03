import { Layout, Menu, Drawer } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    DashboardOutlined,
    UserOutlined,
    BankOutlined,
    CalendarOutlined,
    DollarOutlined,
    ScheduleOutlined,
    FileSearchOutlined,
    MessageOutlined,
} from '@ant-design/icons';
import { useSidebar } from '@/components/context/sidebar.context';
import { useCurrentApp } from '@/components/context/app.context';
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
    const { user } = useCurrentApp();
    const isMobile = useIsMobile();
    const isEmployee = user?.role === 'EMPLOYEE';

    useEffect(() => {
        if (isMobile) {
            setCollapsed(true);
        }
    }, [isMobile, setCollapsed]);

    const menuItems: MenuProps['items'] = useMemo(() => {
        // Helper to create menu items
        const getItem = (
            label: React.ReactNode,
            key: React.Key,
            icon?: React.ReactNode,
            children?: MenuProps['items'],
            type?: 'group',
        ): Required<MenuProps>['items'][number] => {
            return {
                key,
                icon,
                children,
                label,
                type,
            } as any;
        }

        const items: MenuProps['items'] = [
            getItem('Dashboard', '/', <DashboardOutlined />),
        ];

        if (isEmployee) {
            // --- EMPLOYEE VIEW ---
            items.push(
                getItem('Công việc', 'sub-work', <ScheduleOutlined />, [
                    getItem('Lịch làm việc', '/workschedule'),
                    getItem('Chấm công', '/attendance'),
                    getItem('Đơn của tôi', '/request'),
                ]),
                getItem('Thu nhập', 'sub-income', <DollarOutlined />, [
                    getItem('Bảng lương', '/payroll'),
                    getItem('Khen thưởng / Kỷ luật', '/reward-penalty'),
                ]),
                getItem('Tiện ích', 'sub-utils', <MessageOutlined />, [
                    getItem('Chat', '/chat'),
                ])
            );
        } else {
            // --- ADMIN / HR VIEW ---
            items.push(
                getItem('Quản lý Tổ chức', 'sub-org', <BankOutlined />, [
                    getItem('Phòng ban', '/department'),
                    getItem('Chức vụ', '/position'),
                    getItem('Ca làm việc', '/shift'),
                ]),
                getItem('Quản lý Nhân sự', 'sub-hr', <UserOutlined />, [
                    getItem('Danh sách nhân viên', '/employee'),
                ]),
                getItem('Chấm công & Đơn', 'sub-time', <CalendarOutlined />, [
                    getItem('Quản lý lịch làm', '/workschedule'),
                    getItem('Quản lý chấm công', '/attendance'),
                    getItem('Quản lý đơn', '/request'),
                    getItem('Loại đơn', '/request-type'),
                ]),
                getItem('Lương & Phúc lợi', 'sub-payroll', <DollarOutlined />, [
                    getItem('Quản lý lương', '/payroll'),
                    getItem('Khen thưởng / Kỷ luật', '/reward-penalty'),
                ]),
                getItem('Hệ thống', 'sub-system', <FileSearchOutlined />, [
                    getItem('Nhật ký hệ thống', '/audit-log'),
                    getItem('Chat', '/chat'),
                ])
            );
        }

        return items;
    }, [isEmployee]);

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

