import { Outlet } from "react-router";
import AppHeader from "@/components/layouts/app.header";
import { useEffect } from "react";
import { fetchAccountAPI } from "@/services/api";
import { useCurrentApp } from "@/components/context/app.context";

const Layout = () => {
    const { setUser, isAppLoading, setIsAppLoading, setIsAuthenticated } = useCurrentApp()

    useEffect(() => {
        const fetchAccount = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setIsAppLoading(false);
                return;
            }

            try {
                const res = await fetchAccountAPI();
                if (res?.data) {
                    setUser(res.data.user);
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('access_token');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                localStorage.removeItem('access_token');
                setIsAuthenticated(false);
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