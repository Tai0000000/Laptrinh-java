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
  Map as MapIcon,ChevronLeft, ChevronRight
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
    {}
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
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(),calendarDate.getMonth() + 1, 1));


    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        axiosClient.get('/admin/overview')
            .then(res => {
                if (cancelled) return;
                // Xử lý linh hoạt nếu dữ liệu bị bọc trong res.data.data
                const data = res.data.data || res.data;
                console.log("Overview data:", data); // Log để kiểm tra structure
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                if (cancelled) return;
                console.error("Lỗi tải overview:", err);
                setError("Không thể tải thông tin tổng quan");
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải dữ liệu...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
    if (!stats) return null;

    const requestsByStatus = stats?.requestsByStatus || {};
    const totalRequests = stats?.totalRequests || 0;
    const pendingRequests = requestsByStatus['PENDING'] || 0;
    const collectingRequests = (requestsByStatus['ACCEPTED'] || 0) + (requestsByStatus['ASSIGNED'] || 0) + (requestsByStatus['ON_THE_WAY'] || 0);
    const completedRequests = requestsByStatus['COLLECTED'] || 0;


    const wasteWeekData = Array.isArray(stats.wasteByWeekdayLast7Days) && stats.wasteByWeekdayLast7Days.length > 0
        ? stats.wasteByWeekdayLast7Days
        : [{ name: '—', recyclable: 0, organic: 0, hazardous: 0, general: 0, electronic: 0 }];

    const exportReport = () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            window.print();
        } finally {
            setIsExporting(false);
        }
    };

    // Lịch báo cáo
    const requestMap = {};
    if (stats?.last7DaysTrend) {
        stats.last7DaysTrend.forEach(item => {
            if (item.date) {
                const [day, month] = item.date.split('/');
                const currentYear = new Date().getFullYear();
                const key = `${currentYear}-${month}-${day}`;
                requestMap[key] = item.requests || 0;
            }
        });
    }

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 là Chủ Nhật
    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

    let monthlyTotal = 0;
    for (let i = 1; i <= daysInMonth; i++) {
        const d = i < 10 ? `0${i}` : `${i}`;
        const m = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
        const key = `${year}-${m}-${d}`;
        if (requestMap[key]) monthlyTotal += requestMap[key];
    }


    return (
        <div id="report-container" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Tổng quan</h1>
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Quản lý hoạt động thu gom rác thải</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={exportReport}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        disabled={isExporting}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: isHovered ? '#16a34a' : '#22c55e',
                            color: '#000',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: isExporting ? 'wait' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            opacity: isExporting ? 0.7 : 1,
                            transform: isHovered && !isExporting ? 'translateY(-2px)' : 'none', // Nảy lên nhẹ
                            boxShadow: isHovered && !isExporting ? '0 4px 12px rgba(34, 197, 94, 0.3)' : 'none' // Có bóng tỏa ra
                        }}
                    >
                        <Download size={18} />
                        <span>{isExporting ? 'Đang xử lý...' : 'In báo cáo'}</span>
                    </button>
                </div>
            </div>

            {}
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

            {}
            {/* ================= TẦNG 1: BIỂU ĐỒ VÀ LỊCH ================= */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* Cột Trái: Biểu đồ xu hướng (Giữ nguyên) */}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>Xu hướng thu gom</h3>
                        <div style={{ fontSize: '13px', color: '#666' }}>7 ngày qua</div>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={wasteWeekData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }} itemStyle={{ fontSize: '12px' }} />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                                <Bar dataKey="organic" name="Hữu cơ" fill="#eab308" radius={[4, 4, 0, 0]} barSize={8} />
                                <Bar dataKey="hazardous" name="Nguy hại" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={8} />
                                <Bar dataKey="recyclable" name="Tái chế" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={8} />
                                <Bar dataKey="electronic" name="Điện tử" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={8} />
                                <Bar dataKey="general" name="Thông thường" fill="#666" radius={[4, 4, 0, 0]} barSize={8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cột Phải: Cuốn Lịch Mới */}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column' }}>
                    {/* Header chuyển tháng */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={20} /></button>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{monthNames[month]} {year}</h3>
                        <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex' }}><ChevronRight size={20} /></button>
                    </div>

                    {/* Tiêu đề các ngày trong tuần */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center', color: '#666', fontSize: '12px', fontWeight: 'bold' }}>
                        <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
                    </div>

                    {/* Lưới Lịch */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const d = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
                            const m = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
                            const count = requestMap[`${year}-${m}-${d}`] || 0;
                            const hasReq = count > 0;

                            return (
                                <div
                                    key={i}
                                    title={hasReq ? `${count} yêu cầu thu gom` : 'Không có yêu cầu'}
                                    style={{
                                        padding: '6px 0', textAlign: 'center', borderRadius: '6px', fontSize: '13px',
                                        background: hasReq ? '#eab308' : 'transparent',
                                        color: hasReq ? '#000' : '#888',
                                        fontWeight: hasReq ? 'bold' : 'normal',
                                        cursor: hasReq ? 'pointer' : 'default',
                                    }}
                                >
                                    {i + 1}
                                </div>
                            )
                        })}
                    </div>

                    {/* Tổng số đơn cuối lịch */}
                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1f1f1f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#888', fontSize: '14px' }}>Số đơn trong tháng:</span>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#eab308' }}>{monthlyTotal}</span>
                    </div>
                </div>
            </div>

            {/* ================= TẦNG 2: NGƯỜI DÙNG & KHIẾU NẠI ================= */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                {/* Phân bổ người dùng */}
                <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', marginBottom: '20px' }}>Phân bổ người dùng</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
                            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: role === 'ADMIN' ? '#ef4444' : (role === 'CITIZEN' ? '#22c55e' : '#3b82f6') }} />
                                <div style={{ flex: 1, fontSize: '14px' }}>{role}</div>
                                <div style={{ fontWeight: '600' }}>{count.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Khiếu nại */}
                <div style={{ background: '#22c55e10', borderRadius: '24px', padding: '24px', border: '1px solid #22c55e20', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Scale size={20} color="#22c55e" />
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#22c55e' }}>Khiếu nại chưa xử lý</h3>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>{stats?.openComplaints || 0}</div>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '13px' }}>Cần Admin xử lý ngay để đảm bảo chất lượng dịch vụ</p>
                </div>
            </div>
        </div>
    );
}
