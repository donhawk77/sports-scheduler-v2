import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
    children: React.ReactNode;
    allowedRoles?: Array<'player' | 'coach' | 'venue' | 'admin'>;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
    const { user, userData, loading } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();

    const SUPERUSER_EMAILS = [
        'don.hawk77@gmail.com',
        'dhawk@valkyrieprosperity.com', // Adding potential variants
        'admin@sportsscheduler.com',
        'agent@valkyrie.com'
    ];

    const isSuperUser = (user?.email && SUPERUSER_EMAILS.includes(user.email)) ||
        userData?.role === 'admin';

    useEffect(() => {
        if (!loading && user && !isSuperUser && allowedRoles && userData && !allowedRoles.includes(userData.role)) {
            console.warn(`Access Denied for ${user.email}. Role ${userData.role} not in ${allowedRoles.join(', ')}. Redirecting...`);
            showToast(`Access restricted: ${userData.role} dashboard`, 'error');
        }
    }, [loading, user, isSuperUser, allowedRoles, userData, showToast]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isSuperUser && allowedRoles && userData && !allowedRoles.includes(userData.role)) {
        const dashboardMap: Record<string, string> = {
            player: '/player',
            coach: '/coach',
            venue: '/venue',
            admin: '/admin'
        };
        return <Navigate to={dashboardMap[userData.role] || '/'} replace />;
    }

    return children;
};
