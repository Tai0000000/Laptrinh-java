import React, { useState } from 'react';
import AdminRequestTab from '../components/AdminRequestTab';
import AdminUserTab from '../components/AdminUserTab';
import AdminOverviewTab from '../components/AdminOverviewTab';
import AdminComplaintTab from '../components/AdminComplaintTab';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('REQUESTS');

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Menu Tab */}
            <div style={{ width: '220px', background: '#2c3e50', color: 'white', padding: '20px' }}>
                <h3>QUẢN TRỊ VIÊN</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li onClick={() => setActiveTab('OVERVIEW')} style={tabStyle(activeTab === 'OVERVIEW')}>Tổng quan</li>
                    <li onClick={() => setActiveTab('USERS')} style={tabStyle(activeTab === 'USERS')}>Người dùng</li>
                    <li onClick={() => setActiveTab('REQUESTS')} style={tabStyle(activeTab === 'REQUESTS')}>Báo cáo rác</li>
                    <li onClick={() => setActiveTab('COMPLAINTS')} style={tabStyle(activeTab === 'COMPLAINTS')}>Khiếu nại</li>
                </ul>
            </div>

            {/* auto change according click */}
            <div style={{ flex: 1, padding: '20px', backgroundColor: '#f4f7f6', overflowY: 'auto' }}>
                {activeTab === 'OVERVIEW' && <AdminOverviewTab />}
                {activeTab === 'USERS' && <AdminUserTab />}
                {activeTab === 'REQUESTS' && <AdminRequestTab />}
                {activeTab === 'COMPLAINTS' && <AdminComplaintTab />}
            </div>
        </div>
    );
}

// KHÚC NÀY CỰC QUAN TRỌNG: Hàm tạo kiểu cho Menu (Phải nằm ngoài cùng ở đây)
const tabStyle = (isActive) => ({
    padding: '12px',
    cursor: 'pointer',
    marginBottom: '5px',
    borderRadius: '5px',
    backgroundColor: isActive ? '#34495e' : 'transparent',
    color: isActive ? '#3498db' : 'white',
    transition: '0.2s'
});