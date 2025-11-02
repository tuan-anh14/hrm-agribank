import { Outlet } from "react-router";
import { Layout } from "antd";
import AppHeader from "@/components/layouts/app.header";
import AppSidebar from "@/components/layouts/app.sidebar";
import { useEffect } from "react";
import { fetchAccountAPI } from "@/services/api";
import { useCurrentApp } from "@/components/context/app.context";
import { getToken, isValidToken, removeToken } from "@/utils/token.util";

const { Content } = Layout;

const AppLayout = () => {
    const { user, setUser, setIsAppLoading, isAuthenticated, setIsAuthenticated } = useCurrentApp()

    useEffect(() => {
        const fetchAccount = async () => {
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
                const res = await fetchAccountAPI();
                if (res?.data?.user) {
                    setUser(res.data.user);
                    setIsAuthenticated(true);
                } else {
                    console.warn('Failed to fetch account: no user data');
                    setIsAuthenticated(false);
                }
            } catch (error: any) {
                console.error('Error fetching account:', error);
                if (error?.response?.status === 401 || error?.statusCode === 401) {
                    removeToken();
                    setIsAuthenticated(false);
                } else {
                    setIsAuthenticated(false);
                }
            } finally {
                setIsAppLoading(false);
            }
        };
        fetchAccount();
    }, []);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Layout>
                <AppSidebar />
                <Layout style={{ padding: '24px' }}>
                    <Content style={{
                        background: '#fff',
                        padding: '24px',
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

export default AppLayout;