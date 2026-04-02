import { Navigate, Routes, Route } from 'react-router-dom';
import CitizenDashboard from '../pages/CitizenDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import CollectorDashboard from '../pages/CollectorDashboard';
import EnterpriseDashboard from '../pages/EnterpriseDashboard';
import LoginRegister from '../pages/LoginRegister';
import { getRouteByRole } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import PrivateRoute from './PrivateRoute';

const HomeRedirect = () => {
    const { user } = useAuth();

    return <Navigate to={user ? getRouteByRole(user) : '/login'} replace />;
};

const LoginRoute = () => {
    const { user } = useAuth();

    return user ? <Navigate to={getRouteByRole(user)} replace /> : <LoginRegister />;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route
                path="/citizen/:userId"
                element={
                    <PrivateRoute allowedRoles={['CITIZEN']}>
                        <CitizenDashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <PrivateRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/collector"
                element={
                    <PrivateRoute allowedRoles={['COLLECTOR']}>
                        <CollectorDashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/enterprise"
                element={
                    <PrivateRoute allowedRoles={['ENTERPRISE']}>
                        <EnterpriseDashboard />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
};

export default AppRoutes;
