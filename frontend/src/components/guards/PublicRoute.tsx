import { Navigate } from 'react-router-dom';
import { useCurrentApp } from '@/components/context/app.context';
import { getToken, isValidToken } from '@/utils/token.util';

interface PublicRouteProps {
    children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
    const { isAppLoading } = useCurrentApp();
    const token = getToken();

    if (isAppLoading) {
        return <div style={{ padding: '24px', textAlign: 'center' }}>Đang tải...</div>;
    }

    if (token && isValidToken()) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default PublicRoute;

