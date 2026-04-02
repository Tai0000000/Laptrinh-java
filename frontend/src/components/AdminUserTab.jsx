import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Search, UserPlus, Mail, Phone, MapPin } from 'lucide-react';

export default function AdminUserTab() {
    const [users, setUsers] = useState([
        { //Data test
            id: 1, username: "kha.hahoang", email: "kha@gmail.com", fullName: "Hà Hoàng Kha", phone: "0901234567", city: "Hồ Chí Minh", role: "ADMIN", active: true, totalPoints: 9999, createdAt: "2026-01-15T08:30:00"
        },
        {
            id: 2, username: "tai.nguyen", email: "tai.backend@gmail.com", fullName: "Nguyễn Văn Tài", phone: "0987654321", city: "Đà Nẵng", role: "COLLECTOR", active: true, totalPoints: 1500, createdAt: "2026-03-20T14:15:00"
        },
        {
            id: 3, username: "khang.phan", email: "khang.phan@gmail.com", fullName: "Phan Dương Khang", phone: "0912223334", city: "Hà Nội", role: "CITIZEN", active: false, totalPoints: 250, createdAt: "2026-04-01T09:00:00"
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        axiosClient
            .get('/admin/users')
            .then((res) => {
                if (cancelled) return;
                const data = res?.data?.content || [];
                setUsers(data);
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e?.response?.data?.message || "Không tải được danh sách người dùng");
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            })
        return () => { cancelled = true; };
    }, []);

    const toggleActive = (userId) => {
        // Logic to toggle user active status
        axiosClient.patch(`/admin/users/${userId}/toggle-active`)
            .then(() => {
                setUsers(users.map(u => u.id === userId ? { ...u, active: !u.active } : u));
            })
            .catch(e => alert("Lỗi khi thay đổi trạng thái người dùng"));
    };

    return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Quản lý người dùng</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={18} />
                        <input
                            placeholder="Tìm kiếm người dùng..."
                            style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 16px 10px 40px', color: '#fff', width: '280px' }}
                        />
                    </div>
                    <button style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={18} />
                        <span>Thêm mới</span>
                    </button>
                </div>
            </div>

            <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                    {/* ĐÃ THÊM CÁC CỘT MỚI VÀO HEADER */}
                    <tr style={{ borderBottom: '1px solid #1f1f1f', color: '#ffffff', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <th style={{ padding: '20px 24px' }}>Người dùng</th>
                        <th style={{ padding: '20px 24px' }}>Liên hệ</th>
                        <th style={{ padding: '20px 24px' }}>Khu vực</th>
                        <th style={{ padding: '20px 24px' }}>Điểm</th>
                        <th style={{ padding: '20px 24px' }}>Vai trò</th>
                        <th style={{ padding: '20px 24px' }}>Trạng thái</th>
                        <th style={{ padding: '20px 24px' }}>Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải danh sách...</td></tr>}
                    {error && <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</td></tr>}

                    {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #1f1f1f', transition: 'background 0.2s' }}>

                            {/* 1. NGƯỜI DÙNG: fullName in đậm, @username in nghiêng nhỏ */}
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', fontWeight: 'bold' }}>
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>{u.fullName || u.username}</div>
                                        <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', marginTop: '2px' }}>{u.username}</div>
                                    </div>
                                </div>
                            </td>

                            {/* 2. LIÊN HỆ: Gộp Email và Phone */}
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#ffffff' }}>
                                        <Mail size={14} color="#ffffff" /> {u.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#ffffff' }}>
                                        <Phone size={14} color="#ffffff" /> {u.phone || 'Chưa cập nhật'}
                                    </div>
                                </div>
                            </td>

                            {/* 3. KHU VỰC: Hiển thị City */}
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#ffffff' }}>
                                    <MapPin size={14} color="#ffffff" /> {u.city || 'N/A'}
                                </div>
                            </td>

                            {/* 4. ĐIỂM SỐ: Chữ màu xanh nổi bật */}
                            <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 'bold' }}>
                                {u.role === 'CITIZEN' ? (
                                    <span style={{ color: '#22c55e' }}>
                                            {u.totalPoints} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>pts</span>
                                        </span>
                                ) : (
                                    <span style={{ color: '#555', fontWeight: 'normal' }}>-</span>
                                )}
                            </td>
                            {/* 5. VAI TRÒ: Badge 3 màu (Đỏ - Xanh dương - Xanh lá) */}
                            <td style={{ padding: '16px 24px' }}>
                                {u.role === 'ADMIN' && <span style={{ padding: '4px 10px', background: '#ef444420', color: '#ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>ADMIN</span>}
                                {u.role === 'COLLECTOR' && <span style={{ padding: '4px 10px', background: '#3b82f620', color: '#3b82f6', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>NHÂN VIÊN</span>}
                                {u.role === 'CITIZEN' && <span style={{ padding: '4px 10px', background: '#22c55e20', color: '#22c55e', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>NGƯỜI DÂN</span>}
                                {u.role === 'ENTERPRISE' && <span style={{ padding: '4px 10px', background: '#22c55e20', color: '#22c55e', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>DOANH NGHIỆP</span>}
                            </td>

                            {/* 6. TRẠNG THÁI (Giữ nguyên của Kha) */}
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                    background: u.active ? '#22c55e15' : '#ef444415',
                                    color: u.active ? '#22c55e' : '#ef4444'
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                    {u.active ? 'Hoạt động' : 'Đã khóa'}
                                </div>
                            </td>

                            {/* 7. HÀNH ĐỘNG (Giữ nguyên của Kha) */}
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => toggleActive(u.id)}
                                        style={{
                                            background: u.active ? '#ef444415' : '#22c55e15',
                                            color: u.active ? '#ef4444' : '#22c55e',
                                            border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                                        }}
                                    >
                                        {u.active ? 'Khóa' : 'Mở khóa'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
