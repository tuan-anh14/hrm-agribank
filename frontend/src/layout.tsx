import { Outlet } from "react-router";
import { Layout } from "antd";
import AppHeader from "@/components/layouts/app.header";
import AppSidebar from "@/components/layouts/app.sidebar";
import { SidebarProvider, useSidebar } from "@/components/context/sidebar.context";
import { useIsMobile } from "@/hooks/useResponsive";
import { SPACING, SIDEBAR } from "@/utils/constants";
import { useEffect, useCallback } from "react";
import { fetchAccountAPI } from "@/services/api";
import { useCurrentApp } from "@/components/context/app.context";
import { getToken, isValidToken, removeToken } from "@/utils/token.util";

const { Content } = Layout;

const AppLayoutContent = () => {
    const { user, setUser, setIsAppLoading, isAuthenticated, setIsAuthenticated } = useCurrentApp();
    const isMobile = useIsMobile();
    const { collapsed } = useSidebar();

    const fetchAccount = useCallback(async () => {
        const token = getToken();
        
        if (!token) {
            setIsAppLoading(false);
            setIsAuthenticated(false);
            return;
        }

        if (!isValidToken()) {
            removeToken();
            setIsAppLoading(false);
            setIsAuthenticated(false);
            return;
        }

        if (user && isAuthenticated) {
            setIsAppLoading(false);
            return;
        }

        setIsAppLoading(true);

        try {
            const res = await fetchAccountAPI() as IFetchAccount | { data: { user: IUser } };
            
            if ('user' in res && res.user) {
                setUser(res.user);
                setIsAuthenticated(true);
            } else if ('data' in res && res.data?.user) {
                setUser(res.data.user);
                setIsAuthenticated(true);
            } else {
                console.warn('Failed to fetch account: no user data', res);
                setIsAuthenticated(false);
            }
        } catch (error: unknown) {
            console.error('Error fetching account:', error);
            const err = error as { response?: { status?: number }; statusCode?: number };
            if (err?.response?.status === 401 || err?.statusCode === 401) {
                removeToken();
                setIsAuthenticated(false);
            } else {
                setIsAuthenticated(false);
            }
        } finally {
            setIsAppLoading(false);
        }
    }, [user, isAuthenticated, setUser, setIsAuthenticated, setIsAppLoading]);

    useEffect(() => {
        fetchAccount();
    }, [fetchAccount]);

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