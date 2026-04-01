import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Search, UserPlus, MoreVertical, Shield, ShieldAlert } from 'lucide-react';

export default function AdminUserTab() {
    const [users, setUsers] = useState([]);
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
        axiosClient.post(`/admin/users/${userId}/toggle-active`)
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
                        <tr style={{ borderBottom: '1px solid #1f1f1f', color: '#666', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <th style={{ padding: '20px 24px' }}>Người dùng</th>
                            <th style={{ padding: '20px 24px' }}>Vai trò</th>
                            <th style={{ padding: '20px 24px' }}>Trạng thái</th>
                            <th style={{ padding: '20px 24px' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải danh sách...</td></tr>}
                        {error && <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</td></tr>}
                        {!loading && users.length === 0 && <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Không có người dùng nào</td></tr>}
                        {users.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #1f1f1f', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{u.fullName || u.username}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{u.email || u.username + '@gmail.com'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: u.role === 'ADMIN' ? '#ef4444' : '#fff' }}>
                                        {u.role === 'ADMIN' ? <ShieldAlert size={16} /> : <Shield size={16} color="#666" />}
                                        <span>{u.role === 'CITIZEN' ? 'Người dân' : u.role === 'ENTERPRISE' ? 'Doanh nghiệp' : u.role}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '6px', 
                                        padding: '4px 12px', 
                                        borderRadius: '20px', 
                                        fontSize: '12px', 
                                        fontWeight: '600',
                                        background: u.active ? '#22c55e15' : '#ef444415',
                                        color: u.active ? '#22c55e' : '#ef4444'
                                    }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                        {u.active ? 'Hoạt động' : 'Đã khóa'}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => toggleActive(u.id)}
                                            style={{ 
                                                background: u.active ? '#ef444415' : '#22c55e15', 
                                                color: u.active ? '#ef4444' : '#22c55e',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {u.active ? 'Khóa' : 'Mở khóa'}
                                        </button>
                                        <button style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}>
                                            <MoreVertical size={18} />
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
