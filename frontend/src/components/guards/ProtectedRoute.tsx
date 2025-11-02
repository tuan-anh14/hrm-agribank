import { Navigate } from 'react-router-dom';
import { useCurrentApp } from '@/components/context/app.context';
import { getToken, isValidToken, removeToken } from '@/utils/token.util';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { isAuthenticated, user, isAppLoading } = useCurrentApp();
    const token = getToken();

    if (isAppLoading) {
        return <div style={{ padding: '24px', textAlign: 'center' }}>Đang tải...</div>;
    }

    if (!token || !isValidToken()) {
        if (token && !isValidToken()) {
            removeToken();
        }
        return <Navigate to="/login" replace />;
    }

    if (isAuthenticated && user) {
        if (requiredRole && !requiredRole.includes(user.role)) {
            return <Navigate to="/" replace />;
        }
        return <>{children}</>;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

