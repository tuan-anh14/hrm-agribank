import { Outlet } from "react-router";
import { Layout } from "antd";
import AppHeader from "@/components/layouts/app.header";
import AppSidebar from "@/components/layouts/app.sidebar";
import { SidebarProvider, useSidebar } from "@/components/context/sidebar.context";
import { useIsMobile } from "@/hooks/useResponsive";
import { SPACING, SIDEBAR } from "@/utils/constants";



const { Content } = Layout;

const AppLayoutContent = () => {

    const isMobile = useIsMobile();
    const { collapsed } = useSidebar();


    // Auth logic has been moved to AppProvider (app.context.tsx) to ensure it runs correctly on all pages including Login.




    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Layout style={{ marginTop: 64 }}>
                <AppSidebar />
                <Layout
                    style={{
                        padding: isMobile ? SPACING.mobile.padding : SPACING.desktop.padding,
                        marginLeft: isMobile ? 0 : (collapsed ? SIDEBAR.collapsedWidth : SIDEBAR.width),
                        transition: 'margin-left 0.2s',
                    }}
                >
                    <Content style={{
                        background: '#fff',
                        padding: isMobile ? SPACING.mobile.contentPadding : SPACING.desktop.contentPadding,
                        margin: 0,
                        minHeight: 280,
                    }}>
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    )
}

const AppLayout = () => {
    return (
        <SidebarProvider>
            <AppLayoutContent />
        </SidebarProvider>
    );
}

export default AppLayout;