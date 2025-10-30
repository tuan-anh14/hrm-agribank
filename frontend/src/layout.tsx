import { Outlet } from "react-router";
import AppHeader from "./components/layouts/app.header";

const Layout = () => {
    return (
        <>
            <AppHeader></AppHeader>
            <Outlet></Outlet>
        </>
    )
}

export default Layout;