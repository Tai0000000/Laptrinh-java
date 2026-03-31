import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function AdminOverviewTab() {
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        axiosClient.get('/admin/overview')
            .then((res) => {
                if (cancelled) return;
                setOverviewData(res.data);
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e?.response?.data?.message || "Không tải được dữ liệu tổng quan");
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
            <h2>Thống kê Tổng quan Hệ thống</h2>
            {loading && <p>Đang tải số liệu...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                {overviewData && Object.entries(overviewData).map(([key, value]) => (
                    <div key={key} style={{
                        flex: '1 1 200px',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: '#f8f9fa',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#555' }}>
                            {key.toUpperCase()}
                        </h3>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#2980b9' }}>
                            {value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}