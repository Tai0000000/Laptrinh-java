import { Routes, Route } from 'react-router-dom';
import CitizenDashboard from '../pages/CitizenDashboard';
import AdminDashboard from '../pages/AdminDashboard';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/login" element={<div>Login</div>} />
            <Route path="/citizen/:userId" element={<CitizenDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
    );
};

export default AppRoutes;
