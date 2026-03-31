import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function CollectorHistoryTab() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        axiosClient
            .get('/requests/history')
            .then((res) => {
                if (cancelled) return;
                const data = res?.data?.content || [];
                setHistory(data);
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e?.response?.data?.message || "Không tải được lịch sử");
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Lịch sử thu gom</h2>
            {loading && <p>Đang tải dữ liệu...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Mã đơn</th>
                    <th style={{ padding: '12px' }}>Loại rác</th>
                    <th style={{ padding: '12px' }}>Ngày gửi</th>
                    <th style={{ padding: '12px' }}>Trạng thái</th>
                    <th style={{ padding: '12px' }}>Ảnh minh chứng</th>
                </tr>
                </thead>
                <tbody>
                {history.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>#{h.id}</td>
                        <td style={{ padding: '12px' }}>{h.wasteType}</td>
                        <td style={{ padding: '12px' }}>{new Date(h.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td style={{ padding: '12px' }}>
                            <span style={{ color: 'green', fontWeight: 'bold' }}>{h.status}</span>
                        </td>
                        <td style={{ padding: '12px' }}>
                            {h.proofImageUrl ? (
                                <a href={h.proofImageUrl} target="_blank" rel="noreferrer" style={{ color: '#3498db' }}>Xem ảnh</a>
                            ) : 'Không có'}
                        </td>
                    </tr>
                ))}
                {history.length === 0 && !loading && (
                    <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>Chưa có lịch sử nào!</td></tr>
                )}
                </tbody>
            </table>
        </div>
    );
}