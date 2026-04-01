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

export default function AdminOverviewTab() {
    const [loading, setLoading] = useState(false);

    return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Tổng quan</h1>
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Quản lý hoạt động thu gom rác thải</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        background: '#111', 
                        padding: '8px 16px', 
                        borderRadius: '10px',
                        border: '1px solid #1f1f1f',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}>
                        <span>Tất cả trạng thái</span>
                        <ChevronDown size={16} color="#666" />
                    </div>
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
                    value="1.456" 
                    subtitle="Tất cả thời gian" 
                    icon={<FileText size={20} />} 
                    color="#22c55e" 
                />
                <StatCard 
                    title="Chờ xử lý" 
                    value="23" 
                    trend="12%" 
                    subtitle="so với hôm qua" 
                    icon={<Clock size={20} />} 
                    color="#eab308" 
                    trendColor="#ef4444"
                />
                <StatCard 
                    title="Đang thu gom" 
                    value="12" 
                    subtitle="Đang thực hiện" 
                    icon={<Truck size={20} />} 
                    color="#3b82f6" 
                />
                <StatCard 
                    title="Hoàn thành hôm nay" 
                    value="47" 
                    trend="+8%" 
                    subtitle="so với hôm qua" 
                    icon={<CheckCircle2 size={20} />} 
                    color="#22c55e" 
                    trendColor="#22c55e"
                />
                <StatCard 
                    title="Tổng khối lượng" 
                    value="2.340 kg" 
                    subtitle="Tháng này" 
                    icon={<Scale size={20} />} 
                    color="#22c55e" 
                />
                <StatCard 
                    title="Tỷ lệ tái chế" 
                    value="68%" 
                    trend="+3%" 
                    subtitle="so với hôm qua" 
                    icon={<Recycle size={20} />} 
                    color="#22c55e" 
                    trendColor="#22c55e"
                />
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', height: '400px' }}>
                {/* Bar Chart */}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 24px', fontSize: '16px', fontWeight: '600' }}>Thu gom theo loại rác (tuần)</h3>
                    <div style={{ flex: 1, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#666', fontSize: 12 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#666', fontSize: 12 }} 
                                />
                                <Tooltip 
                                    contentStyle={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    align="center" 
                                    iconType="circle" 
                                    iconSize={8}
                                    wrapperStyle={{ paddingTop: '20px' }}
                                />
                                <Bar dataKey="recyclable" name="Tái chế" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="organic" name="Hữu cơ" fill="#f97316" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="hazardous" name="Nguy hại" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="general" name="Thông thường" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Map Placeholder */}
                <div style={{ 
                    background: '#111', 
                    borderRadius: '24px', 
                    padding: '24px', 
                    border: '1px solid #1f1f1f', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Bản đồ thu gom</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ padding: '6px', background: '#1a1a1a', borderRadius: '8px', cursor: 'pointer' }}><Search size={16} color="#666" /></div>
                            <div style={{ padding: '6px', background: '#1a1a1a', borderRadius: '8px', cursor: 'pointer' }}><ZoomIn size={16} color="#666" /></div>
                            <div style={{ padding: '6px', background: '#1a1a1a', borderRadius: '8px', cursor: 'pointer' }}><ZoomOut size={16} color="#666" /></div>
                            <div style={{ padding: '6px', background: '#1a1a1a', borderRadius: '8px', cursor: 'pointer' }}><Layers size={16} color="#666" /></div>
                        </div>
                    </div>
                    
                    <div style={{ 
                        flex: 1, 
                        background: '#0a0a0a', 
                        borderRadius: '16px', 
                        border: '1px solid #1f1f1f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        backgroundImage: 'radial-gradient(#1f1f1f 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}>
                        <div style={{ fontSize: '48px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '4px' }}>TP.HCM</div>
                        
                        {/* Mock Map Markers */}
                        <div style={{ position: 'absolute', top: '30%', left: '40%', color: '#22c55e' }}><MapIcon size={24} fill="currentColor" /></div>
                        <div style={{ position: 'absolute', top: '50%', left: '60%', color: '#eab308' }}><MapIcon size={24} fill="currentColor" /></div>
                        <div style={{ position: 'absolute', top: '70%', left: '30%', color: '#3b82f6' }}><MapIcon size={24} fill="currentColor" /></div>
                        <div style={{ position: 'absolute', top: '40%', left: '70%', color: '#22c55e' }}><MapIcon size={24} fill="currentColor" /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
