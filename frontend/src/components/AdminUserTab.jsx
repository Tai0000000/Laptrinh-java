import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Search, UserPlus, Mail, Phone, MapPin } from 'lucide-react';

export default function AdminUserTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchUsers = () => {
        setLoading(true);
        setError(null);

        const params = {
            page: page,
            size: 10,
            search: search || undefined,
            role: roleFilter || undefined
        };

        axiosClient
            .get('/admin/users', { params })
            .then((res) => {
                const data = res?.data?.content || [];
                setUsers(data);
                setTotalPages(res?.data?.totalPages || 0);
            })
            .catch((e) => {
                setError(e?.response?.data?.message || "Không tải được danh sách người dùng");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, roleFilter, page]);

    const toggleActive = (userId) => {
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
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 16px 10px 40px', color: '#fff', width: '280px' }}
                        />
                    </div>
                    <select 
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
                        style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 16px', color: '#fff' }}
                    >
                        <option value="">Tất cả vai trò</option>
                        <option value="CITIZEN">Người dân</option>
                        <option value="COLLECTOR">Nhân viên thu gom</option>
                        <option value="ENTERPRISE">Doanh nghiệp</option>
                        <option value="ADMIN">Quản trị viên</option>
                    </select>
                </div>
            </div>

            <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
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
                    {!loading && error && <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</td></tr>}
                    {!loading && users.length === 0 && !error && <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Không tìm thấy người dùng nào.</td></tr>}

                    {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #1f1f1f', transition: 'background 0.2s' }}>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', fontWeight: 'bold' }}>
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>{u.fullName || u.username}</div>
                                        <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', marginTop: '2px' }}>@{u.username}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '13px' }}>
                                        <Mail size={14} color="#666" />
                                        <span>{u.email}</span>
                                    </div>
                                    {u.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '13px' }}>
                                            <Phone size={14} color="#666" />
                                            <span>{u.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '13px' }}>
                                    <MapPin size={14} color="#666" />
                                    <span>{u.city || 'Chưa cập nhật'}</span>
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontWeight: '700', color: '#22c55e' }}>{u.totalPoints.toLocaleString()}</div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <span style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '8px', 
                                    fontSize: '11px', 
                                    fontWeight: '700',
                                    background: u.role === 'ADMIN' ? '#ef444420' : (u.role === 'COLLECTOR' ? '#3b82f620' : '#22c55e20'),
                                    color: u.role === 'ADMIN' ? '#ef4444' : (u.role === 'COLLECTOR' ? '#3b82f6' : '#22c55e')
                                }}>
                                    {u.role}
                                </span>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.active ? '#22c55e' : '#ef4444' }} />
                                    <span style={{ fontSize: '13px', color: u.active ? '#22c55e' : '#ef4444' }}>{u.active ? 'Hoạt động' : 'Bị khóa'}</span>
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <button 
                                    onClick={() => toggleActive(u.id)}
                                    style={{ 
                                        background: u.active ? '#ef444420' : '#22c55e20', 
                                        color: u.active ? '#ef4444' : '#22c55e', 
                                        border: 'none', 
                                        borderRadius: '8px', 
                                        padding: '6px 12px', 
                                        fontSize: '12px', 
                                        fontWeight: '600', 
                                        cursor: 'pointer' 
                                    }}
                                >
                                    {u.active ? 'Khóa' : 'Mở khóa'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                    <button 
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                        style={{ background: '#111', border: '1px solid #1f1f1f', color: '#fff', padding: '8px 16px', borderRadius: '10px', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}
                    >
                        Trước
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '14px', color: '#888' }}>
                        Trang {page + 1} / {totalPages}
                    </span>
                    <button 
                        disabled={page === totalPages - 1}
                        onClick={() => setPage(page + 1)}
                        style={{ background: '#111', border: '1px solid #1f1f1f', color: '#fff', padding: '8px 16px', borderRadius: '10px', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.5 : 1 }}
                    >
                        Tiếp
                    </button>
                </div>
            )}
        </div>
    );
}
