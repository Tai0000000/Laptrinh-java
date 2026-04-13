import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Download, TrendingUp, Package, Users, Building2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7'];

export default function AdminStatsTab() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        axiosClient.get('/admin/overview')
            .then(res => {
                if (cancelled) return;
                setStats(res.data);
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setError('Không thể tải thống kê từ máy chủ');
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải thống kê...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
    if (!stats) return null;

    const wasteData = stats?.requestsByStatus ? Object.entries(stats.requestsByStatus).map(([name, value]) => ({ name, value })) : [];
    const userData = stats?.usersByRole ? Object.entries(stats.usersByRole).map(([name, value]) => ({ name, value })) : [];

    const trendData = Array.isArray(stats.last7DaysTrend) ? stats.last7DaysTrend : [];

    return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', color: '#fff' }}>
            {}
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

            {}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                {}
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

                {}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                    <h3 style={{ margin: '0 0 24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={20} color="#3b82f6" />
                        Trạng thái yêu cầu
                    </h3>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center' }}>
                        {wasteData.length === 0 ? (
                            <div style={{ width: '100%', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                                Chưa có dữ liệu trạng thái yêu cầu
                            </div>
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>

            {}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {}
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

                {}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Building2 size={20} color="#ef4444" />
                        Chỉ số vận hành
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#888' }}>Thời gian xử lý TB (PENDING → COLLECTED)</span>
                            <span style={{ fontWeight: '600' }}>
                                {stats.avgHoursToCollect != null ? `${stats.avgHoursToCollect} giờ` : '—'}
                            </span>
                        </div>
                        <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${stats.avgHoursToCollect != null
                                    ? Math.min(100, (stats.avgHoursToCollect / 72) * 100)
                                    : 0}%`,
                                height: '100%',
                                background: '#22c55e'
                            }} />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#888' }}>Tỷ lệ đã xử lý khiếu nại</span>
                            <span style={{ fontWeight: '600' }}>
                                {stats.complaintResolutionPercent != null ? `${stats.complaintResolutionPercent}%` : '—'}
                            </span>
                        </div>
                        <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${stats.complaintResolutionPercent != null ? stats.complaintResolutionPercent : 0}%`,
                                height: '100%',
                                background: '#3b82f6'
                            }} />
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