import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  Truck, 
  CheckCircle2, 
  Scale, 
  Recycle,
  ChevronDown,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  Layers,
  Map as MapIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import axiosClient from '../api/axiosClient';

const data = [
  { name: 'T2', recyclable: 120, organic: 80, hazardous: 20, general: 40 },
  { name: 'T3', recyclable: 140, organic: 95, hazardous: 15, general: 55 },
  { name: 'T4', recyclable: 135, organic: 110, hazardous: 25, general: 45 },
  { name: 'T5', recyclable: 150, organic: 105, hazardous: 30, general: 50 },
  { name: 'T6', recyclable: 115, organic: 100, hazardous: 20, general: 60 },
  { name: 'T7', recyclable: 185, organic: 115, hazardous: 35, general: 40 },
  { name: 'CN', recyclable: 95, organic: 65, hazardous: 10, general: 35 },
];

const StatCard = ({ title, value, subtitle, trend, icon, color, trendColor }) => (
  <div style={{ 
    background: '#111', 
    borderRadius: '16px', 
    padding: '20px', 
    flex: 1,
    minWidth: '200px',
    border: '1px solid #1f1f1f',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{value}</div>
        <div style={{ fontSize: '12px', color: trendColor || '#666' }}>
          {trend ? <span style={{ fontWeight: '600' }}>{trend} </span> : null}
          <span style={{ color: '#666' }}>{subtitle}</span>
        </div>
      </div>
      <div style={{ 
        background: `${color}20`, 
        padding: '10px', 
        borderRadius: '12px',
        color: color 
      }}>
        {icon}
      </div>
    </div>
    {/* Colored line on the side */}
    <div style={{ 
      position: 'absolute', 
      left: 0, 
      top: '20%', 
      bottom: '20%', 
      width: '3px', 
      backgroundColor: color,
      borderRadius: '0 4px 4px 0'
    }} />
  </div>
);

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

export default function AdminOverviewTab() {
    const [stats, setStats] = useState(MOCK_STATS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        // Tạm thời comment API để dùng dữ liệu mock theo yêu cầu của user
        /*
        setLoading(true);
        axiosClient.get('/admin/overview')
            .then(res => {
                if (cancelled) return;
                setStats(res.data);
                setLoading(false);
            })
            .catch(err => {
                if (cancelled) return;
                setError("Không thể tải thông tin tổng quan");
                setLoading(false);
            });
        */
        return () => { cancelled = true; };
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải dữ liệu...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;

    const requestsByStatus = stats?.requestsByStatus || {};
    const totalRequests = stats?.totalRequests || 0;
    const pendingRequests = requestsByStatus['PENDING'] || 0;
    const collectingRequests = (requestsByStatus['ACCEPTED'] || 0) + (requestsByStatus['ASSIGNED'] || 0) + (requestsByStatus['ON_THE_WAY'] || 0);
    const completedRequests = requestsByStatus['COLLECTED'] || 0;

    return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Tổng quan</h1>
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Quản lý hoạt động thu gom rác thải</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        background: '#22c55e', 
                        color: '#000',
                        padding: '8px 16px', 
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}>
                        <Download size={18} />
                        <span>Xuất báo cáo</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <StatCard 
                    title="Tổng yêu cầu" 
                    value={totalRequests.toLocaleString()} 
                    subtitle="Tất cả thời gian" 
                    icon={<FileText size={20} />} 
                    color="#22c55e" 
                />
                <StatCard 
                    title="Chờ xử lý" 
                    value={pendingRequests.toLocaleString()} 
                    subtitle="Chưa được chấp nhận" 
                    icon={<Clock size={20} />} 
                    color="#eab308" 
                />
                <StatCard 
                    title="Đang thu gom" 
                    value={collectingRequests.toLocaleString()} 
                    subtitle="Đang thực hiện" 
                    icon={<Truck size={20} />} 
                    color="#3b82f6" 
                />
                <StatCard 
                    title="Đã hoàn thành" 
                    value={completedRequests.toLocaleString()} 
                    subtitle="Thành công" 
                    icon={<CheckCircle2 size={20} />} 
                    color="#10b981" 
                />
            </div>

            {/* Content Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                {/* Chart */}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>Xu hướng thu gom</h3>
                        <div style={{ fontSize: '13px', color: '#666' }}>7 ngày qua</div>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                                <Bar dataKey="recyclable" name="Tái chế" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={8} />
                                <Bar dataKey="organic" name="Hữu cơ" fill="#eab308" radius={[4, 4, 0, 0]} barSize={8} />
                                <Bar dataKey="hazardous" name="Nguy hại" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f', flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '18px', marginBottom: '20px' }}>Phân bổ người dùng</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
                                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '8px', 
                                        height: '8px', 
                                        borderRadius: '50%', 
                                        backgroundColor: role === 'ADMIN' ? '#ef4444' : (role === 'CITIZEN' ? '#22c55e' : '#3b82f6') 
                                    }} />
                                    <div style={{ flex: 1, fontSize: '14px' }}>{role}</div>
                                    <div style={{ fontWeight: '600' }}>{count.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ background: '#22c55e10', borderRadius: '24px', padding: '24px', border: '1px solid #22c55e20' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <Scale size={20} color="#22c55e" />
                            <h3 style={{ margin: 0, fontSize: '16px', color: '#22c55e' }}>Khiếu nại chưa xử lý</h3>
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>{stats?.openComplaints || 0}</div>
                        <p style={{ margin: '8px 0 0', color: '#666', fontSize: '13px' }}>Cần Admin xử lý ngay để đảm bảo chất lượng dịch vụ</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
