import { Routes, Route } from 'react-router-dom';
import CitizenDashboard from '../pages/CitizenDashboard';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/login" element={<div>Login</div>} />
            <Route path="/citizen/:userId" element={<CitizenDashboard />} />
        </Routes>
    );
};

export default AppRoutes;
