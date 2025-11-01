import { Navigate } from 'react-router-dom';
import { useCurrentApp } from '@/components/context/app.context';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { isAuthenticated, user, isAppLoading } = useCurrentApp();
    const token = localStorage.getItem('access_token');

    // Wait for app to finish loading
    if (isAppLoading) {
        return <div>Đang tải...</div>;
    }

    // Check authentication
    if (!token || !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check role if required
    if (requiredRole && user && !requiredRole.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

