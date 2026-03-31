import React, {useState,useEffect} from 'react';
import axiosClient from '../api/axiosClient';

export default function AdminUserTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect (() =>{
        let cancelled = false;
        setLoading(true);
        setError(null);

        axiosClient
            .get('/admin/users')
            .then((res) =>{
                if (cancelled) return;
                const data = res?.data?.content || [];
                setUsers(data);
            })
            .catch((e)=>{
                if (cancelled) return;
                setError(e?.response?.data?.message || " Không tải được danh sách người dùng ");
            })
            .finally (() =>{
                if (cancelled) return;
                setLoading(false);
            })
        return () => {
            cancelled = true;
        };

    }, []);

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Quản lý Người dùng</h2>
            {loading && <p>Đang tải danh sách...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Tên đăng nhập</th>
                    <th style={{ padding: '12px' }}>Vai trò</th>
                    <th style={{ padding: '12px' }}>Trạng thái</th>
                    <th style={{ padding: '12px' }}>Hành động</th>
                </tr>
                </thead>
                <tbody>
                {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>#{u.id}</td>
                        <td style={{ padding: '12px' }}>{u.username}</td>
                        <td style={{ padding: '12px' }}>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                    background: u.role === 'CITIZEN' ? '#e1f5fe' : '#fff3e0',
                                    color: u.role === 'CITIZEN' ? '#0288d1' : '#f57c00'
                                }}>
                                    {u.role === 'CITIZEN' ? 'Người dân' : 'Doanh nghiệp'}
                                </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                            {u.active ? <span style={{ color: 'green' }}>Hoạt động</span> : <span style={{ color: 'red' }}>Đã khóa</span>}
                        </td>
                        <td style={{ padding: '12px' }}>
                            <button style={{ cursor: 'pointer', padding: '5px 10px' }}>{u.active ? 'Khóa' : 'Mở khóa'}</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );

}