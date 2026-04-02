import { createElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getPrimaryRole, getRouteByRole } from '../contexts/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    if (!user) {
        return createElement(Navigate, { to: '/login' });
    }

    if (allowedRoles?.length) {
        const role = getPrimaryRole(user);

        if (!allowedRoles.includes(role)) {
            return createElement(Navigate, { to: getRouteByRole(user), replace: true });
        }
    }

    return children;
};

export default PrivateRoute;
