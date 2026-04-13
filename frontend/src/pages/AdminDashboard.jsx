import React, { useState } from 'react';
import {
    LayoutDashboard,
    FileText,
    Users,
    Map as MapIcon,
    BarChart3,
    Settings,
    LogOut,
    Leaf,
    MessageSquare,
    Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminOverviewTab from '../components/AdminOverviewTab';
import AdminRequestTab from '../components/AdminRequestTab';
import AdminUserTab from '../components/AdminUserTab';
import AdminComplaintTab from '../components/AdminComplaintTab';
import AdminEnterpriseTab from '../components/AdminEnterpriseTab';
import AdminStatsTab from '../components/AdminStatsTab';
import AdminMapTab from '../components/AdminMapTab';
import AdminSettingsTab from '../components/AdminSettingsTab';
import { useAuth } from '../hooks/useAuth';
import { getPrimaryRole } from '../contexts/AuthContext';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('OVERVIEW');

    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const role = getPrimaryRole(user);
    const isAdmin = role === 'ADMIN';

    const menuItems = [
        { id: 'OVERVIEW', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
        { id: 'REQUESTS', label: 'Yêu cầu thu gom', icon: <FileText size={20} /> },
        { id: 'COLLECTORS', label: isAdmin ? 'Người dùng' : 'Nhân viên thu gom', icon: <Users size={20} /> },
        { id: 'COMPLAINTS', label: 'Khiếu nại', icon: <MessageSquare size={20} /> },
        { id: 'ENTERPRISES', label: 'Doanh nghiệp', icon: <Building2 size={20} /> },
        { id: 'MAP', label: 'Bản đồ', icon: <MapIcon size={20} /> },
        { id: 'STATS', label: 'Thống kê', icon: <BarChart3 size={20} /> },
        { id: 'SETTINGS', label: 'Cài đặt', icon: <Settings size={20} /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {}
            <div style={{
                width: '260px', background: '#0a0a0a', borderRight: '1px solid #1f1f1f',
                display: 'flex', flexDirection: 'column', padding: '24px 16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
                    <div style={{ background: '#22c55e', padding: '8px', borderRadius: '10px' }}>
                        <Leaf size={24} color="black" fill="black" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '-0.02em' }}>EcoCollect</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{isAdmin ? 'Quản trị viên' : 'Doanh nghiệp'}</div>
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {menuItems.map((item) => (
                            <li
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                                    cursor: 'pointer', borderRadius: '12px', transition: 'all 0.2s',
                                    backgroundColor: activeTab === item.id ? '#1a1a1a' : 'transparent',
                                    color: activeTab === item.id ? '#22c55e' : '#888',
                                    fontWeight: activeTab === item.id ? '600' : '400'
                                }}
                            >
                                {item.icon}
                                <span style={{ fontSize: '14px' }}>{item.label}</span>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #1f1f1f', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={20} color="#888" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {user?.username || user?.email || 'Người dùng'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {user?.email || 'Chưa có email'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', color: '#888', fontSize: '14px' }} onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Đăng xuất</span>
                    </div>
                </div>
            </div>

            {}
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#000' }}>
                {activeTab === 'OVERVIEW' && <AdminOverviewTab />}
                {activeTab === 'REQUESTS' && <AdminRequestTab />}
                {activeTab === 'COLLECTORS' && <AdminUserTab />}
                {activeTab === 'COMPLAINTS' && <AdminComplaintTab />}
                {activeTab === 'ENTERPRISES' && <AdminEnterpriseTab />}
                {activeTab === 'MAP' && <AdminMapTab />}
                {activeTab === 'STATS' && <AdminStatsTab />}
                {activeTab === 'SETTINGS' && <AdminSettingsTab />}

                {!['OVERVIEW', 'REQUESTS', 'COLLECTORS', 'COMPLAINTS', 'ENTERPRISES', 'MAP', 'STATS', 'SETTINGS'].includes(activeTab) && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        <h2>Đang phát triển tính năng {menuItems.find(m => m.id === activeTab)?.label}</h2>
                    </div>
                )}
            </div>
        </div>
    );
}