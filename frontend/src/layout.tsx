import { Outlet } from "react-router";
import AppHeader from "@/components/layouts/app.header";
import { useEffect } from "react";
import { fetchAccountAPI } from "@/services/api";
import { useCurrentApp } from "@/components/context/app.context";

const Layout = () => {
    const { setUser, isAppLoading, setIsAppLoading } = useCurrentApp()

    useEffect(() => {
        const fetchAccount = async () => {
            const res = await fetchAccountAPI();
            if (res.data) {
                setUser(res.data.user)
            }
            setIsAppLoading(false)
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