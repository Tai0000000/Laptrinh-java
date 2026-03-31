import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function AdminComplaintTab() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        axiosClient
            .get('/admin/complaints')
            .then((res) => {
                if (cancelled) return;
                const data = res?.data?.content || [];
                setComplaints(data);
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e?.response?.data?.message || "Không tải được danh sách khiếu nại");
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const getStatusStyle = (status) => {
        if (status === 'OPEN') return { bg: '#ffebee', color: '#c62828', text: 'Chưa giải quyết' }; // Đỏ
        if (status === 'RESOLVED') return { bg: '#e8f5e9', color: '#2e7d32', text: 'Đã giải quyết' }; // Xanh lá
        if (status === 'DISMISSED') return { bg: '#eceff1', color: '#455a64', text: 'Bác bỏ' }; // Xám
        return { bg: '#fff3e0', color: '#ef6c00', text: status };
    };

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Quản lý Khiếu nại</h2>
            {loading && <p>Đang tải danh sách...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Tiêu đề</th>
                    <th style={{ padding: '12px' }}>Nội dung</th>
                    <th style={{ padding: '12px' }}>Ngày gửi</th>
                    <th style={{ padding: '12px' }}>Trạng thái</th>
                    <th style={{ padding: '12px' }}>Hành động</th>
                </tr>
                </thead>
                <tbody>
                {complaints.map((c) => {
                    const statusStyle = getStatusStyle(c.status);
                    return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px' }}>#{c.id}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.title}</td>
                            <td style={{ padding: '12px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {c.content}
                            </td>
                            <td style={{ padding: '12px' }}>
                                {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        background: statusStyle.bg,
                                        color: statusStyle.color,
                                        fontWeight: 'bold'
                                    }}>
                                        {statusStyle.text}
                                    </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                                <button
                                    disabled={c.status !== 'OPEN'}
                                    style={{
                                        cursor: c.status === 'OPEN' ? 'pointer' : 'not-allowed',
                                        padding: '5px 10px',
                                        background: c.status === 'OPEN' ? '#3498db' : '#bdc3c7',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px'
                                    }}>
                                    Giải quyết
                                </button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}