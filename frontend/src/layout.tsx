import { Outlet } from "react-router";
import AppHeader from "@/components/layouts/app.header";
import { useEffect } from "react";
import { fetchAccountAPI } from "@/services/api";
import { useCurrentApp } from "@/components/context/app.context";

const Layout = () => {
    const { user, setUser, setIsAppLoading, isAuthenticated, setIsAuthenticated } = useCurrentApp()

    useEffect(() => {
        const fetchAccount = async () => {
            const token = localStorage.getItem('access_token');
            
            // Nếu không có token, không cần fetch
            if (!token) {
                setIsAppLoading(false);
                setIsAuthenticated(false);
                return;
            }

            // Nếu đã có user và authenticated từ login, không cần fetch lại
            if (user && isAuthenticated) {
                setIsAppLoading(false);
                return;
            }

            // Set loading state
            setIsAppLoading(true);

            try {
                const res = await fetchAccountAPI();
                if (res?.data?.user) {
                    setUser(res.data.user);
                    setIsAuthenticated(true);
                } else {
                    // Nếu không có data.user, có thể token không hợp lệ
                    console.warn('Failed to fetch account: no user data');
                    setIsAuthenticated(false);
                }
            } catch (error: any) {
                console.error('Error fetching account:', error);
                // Chỉ xóa token nếu lỗi 401 Unauthorized
                if (error?.response?.status === 401 || error?.statusCode === 401) {
                    localStorage.removeItem('access_token');
                    setIsAuthenticated(false);
                } else {
                    // Lỗi network hoặc lỗi khác, giữ token nhưng set authenticated = false
                    setIsAuthenticated(false);
                }
            } finally {
                setIsAppLoading(false);
            }
        };
        fetchAccount();
    }, []);

    return (
        <>
            <AppHeader></AppHeader>
            <Outlet></Outlet>
        </>
    )
}

export default Layout;