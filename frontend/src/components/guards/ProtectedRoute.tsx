import { Navigate } from 'react-router-dom';
import { useCurrentApp } from '@/components/context/app.context';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { isAuthenticated, user, isAppLoading } = useCurrentApp();
    const token = localStorage.getItem('access_token');

    // Wait for app to finish loading (chỉ khi đang fetch account)
    if (isAppLoading) {
        return <div style={{ padding: '24px', textAlign: 'center' }}>Đang tải...</div>;
    }

    // Check authentication - không có token thì redirect về login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Đã có token và authenticated → cho phép truy cập
    if (isAuthenticated && token) {
        // Check role nếu yêu cầu
        if (requiredRole && user && !requiredRole.includes(user.role)) {
            return <Navigate to="/" replace />;
        }
        return <>{children}</>;
    }

    // Có token nhưng chưa authenticated - có thể đang fetch account hoặc lỗi
    // Chờ một lần render để Layout có cơ hội fetch account
    // Nếu sau đó vẫn không authenticated thì sẽ redirect
    return <Navigate to="/login" replace />;
};

export default ProtectedRoute;

