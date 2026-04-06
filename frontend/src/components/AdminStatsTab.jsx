import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Download, Calendar, Filter, TrendingUp, Package, Users, Building2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7'];

const MOCK_STATS = {
    totalUsers: 1250,
    usersByRole: {
        'ADMIN': 3,
        'CITIZEN': 1150,
        'COLLECTOR': 85,
        'ENTERPRISE': 12
    },
    totalRequests: 1456,
    requestsByStatus: {
        'PENDING': 23,
        'ACCEPTED': 45,
        'ASSIGNED': 32,
        'ON_THE_WAY': 12,
        'COLLECTED': 1344
    },
    openComplaints: 5,
    totalEnterprises: 12
};

export default function AdminStatsTab() {
    const [stats, setStats] = useState(MOCK_STATS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        /*
        axiosClient.get('/admin/overview')
            .then(res => {
                setStats(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        */
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải thống kê...</div>;

    const wasteData = stats?.requestsByStatus ? Object.entries(stats.requestsByStatus).map(([name, value]) => ({ name, value })) : [];
    const userData = stats?.usersByRole ? Object.entries(stats.usersByRole).map(([name, value]) => ({ name, value })) : [];

    // Mock data for trends (since backend doesn't provide historical data yet)
    const trendData = [
        { date: '01/04', requests: 45, completed: 38 },
        { date: '02/04', requests: 52, completed: 42 },
        { date: '03/04', requests: 48, completed: 45 },
        { date: '04/04', requests: 61, completed: 50 },
        { date: '05/04', requests: 55, completed: 48 },
        { date: '06/04', requests: 67, completed: 55 },
    ];

    return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Phân tích & Thống kê</h1>
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Dữ liệu chi tiết về hệ thống EcoCollect</p>
                </div>
                <button style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <Download size={18} />
                    <span>Tải báo cáo PDF</span>
                </button>
            </div>

            {/* Main Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                {/* Request Trend */}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                    <h3 style={{ margin: '0 0 24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TrendingUp size={20} color="#22c55e" />
                        Xu hướng yêu cầu
                    </h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="requests" name="Yêu cầu mới" stroke="#22c55e" fillOpacity={1} fill="url(#colorReq)" />
                                <Area type="monotone" dataKey="completed" name="Hoàn thành" stroke="#3b82f6" fill="none" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Waste Distribution */}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                    <h3 style={{ margin: '0 0 24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={20} color="#3b82f6" />
                        Trạng thái yêu cầu
                    </h3>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={wasteData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {wasteData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* User Roles */}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                    <h3 style={{ margin: '0 0 24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={20} color="#eab308" />
                        Phân bổ vai trò người dùng
                    </h3>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false} />
                                <XAxis type="number" stroke="#666" fontSize={12} hide />
                                <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} width={100} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }} />
                                <Bar dataKey="value" name="Số lượng" fill="#eab308" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* System Health */}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Building2 size={20} color="#ef4444" />
                        Chỉ số vận hành
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#888' }}>Thời gian phản hồi trung bình</span>
                            <span style={{ fontWeight: '600' }}>1.2 giờ</span>
                        </div>
                        <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: '85%', height: '100%', background: '#22c55e' }} />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#888' }}>Tỷ lệ giải quyết khiếu nại</span>
                            <span style={{ fontWeight: '600' }}>92%</span>
                        </div>
                        <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: '92%', height: '100%', background: '#3b82f6' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#888' }}>Độ phủ sóng doanh nghiệp</span>
                            <span style={{ fontWeight: '600' }}>{stats?.totalEnterprises || 0} Đối tác</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}