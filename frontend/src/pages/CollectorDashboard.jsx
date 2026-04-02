import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CollectorTaskTab from '../components/CollectorTaskTab';
import CollectorHistoryTab from '../components/CollectorHistoryTab';
import { useAuth } from '../hooks/useAuth';

export default function CollectorDashboard() {
    const [activeTab, setActiveTab] = useState('TASKS');
    const navigate = useNavigate();
    const { logout } = useAuth();

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>

            <div style={{ width: '220px', background: '#2c3e50', color: 'white', padding: '20px' }}>
                <h3 style={{ borderBottom: '1px solid #7f8c8d', paddingBottom: '10px' }}>NGƯỜI THU GOM</h3>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
                    <li onClick={() => setActiveTab('TASKS')} style={tabStyle(activeTab === 'TASKS')}>📋 Nhiệm vụ</li>
                    <li onClick={() => setActiveTab('HISTORY')} style={tabStyle(activeTab === 'HISTORY')}>✅ Lịch sử</li>
                    <li onClick={() => { logout(); navigate('/login'); }} style={tabStyle(false)}>🚪 Đăng xuất</li>
                </ul>
            </div>

            <div style={{ flex: 1, padding: '20px', backgroundColor: '#f4f7f6', overflowY: 'auto' }}>
                {activeTab === 'TASKS' && <CollectorTaskTab />}
                {activeTab === 'HISTORY' && <CollectorHistoryTab />}
            </div>

        </div>
    );
}

const tabStyle = (isActive) => ({
    padding: '12px',
    cursor: 'pointer',
    marginBottom: '5px',
    borderRadius: '5px',
    backgroundColor: isActive ? '#34495e' : 'transparent',
    color: isActive ? '#3498db' : 'white',
    transition: '0.3s'
});
