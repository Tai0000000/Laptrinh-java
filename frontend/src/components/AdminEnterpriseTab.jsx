import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Search, Building2 } from 'lucide-react';

export default function AdminEnterpriseTab() {
    const [enterprises, setEnterprises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchEnterprises = () => {
        setLoading(true);
        setError(null);

        const params = {
            page: page,
            size: 10,
            search: search || undefined
        };

        axiosClient
            .get('/admin/enterprises', { params })
            .then((res) => {
                const data = res?.data?.content || [];
                setEnterprises(data);
                setTotalPages(res?.data?.totalPages || 0);
            })
            .catch((e) => {
                setError(e?.response?.data?.message || "Không tải được danh sách doanh nghiệp");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchEnterprises();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page]);

    const handleReject = (enterpriseId) => {
        if (window.confirm("Bạn có chắc chắn muốn từ chối doanh nghiệp này không?")) {
            
            alert("Tính năng này đã được cập nhật.");
        }
    };

    return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Building2 size={28} color="#22c55e" />
                    Quản lý Doanh nghiệp
                </h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={18} />
                        <input
                            placeholder="Tìm kiếm doanh nghiệp..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 16px 10px 40px', color: '#fff', width: '280px' }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                    <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #1f1f1f', color: '#ffffff', fontSize: '13px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '20px 24px' }}>Doanh nghiệp</th>
                        <th style={{ padding: '20px 24px' }}>Dịch vụ</th>
                        <th style={{ padding: '20px 24px' }}>Địa chỉ</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải danh sách...</td></tr>}
                    {!loading && error && <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</td></tr>}
                    {!loading && enterprises.length === 0 && !error && <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Không tìm thấy doanh nghiệp nào.</td></tr>}

                    {enterprises.map((e) => (
                        <tr key={e.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontWeight: '600', color: '#fff' }}>{e.companyName}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>ID: {e.id} | MST: {e.licenseNumber || 'Chưa cập nhật'}</div>
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {(e.acceptedWasteTypes || '').split(',').filter(Boolean).map(type => (
                                        <span key={type} style={{ background: '#1a1a1a', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#ccc' }}>{type.trim()}</span>
                                    ))}
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '13px', color: '#888' }}>
                                {e.address || 'Chưa cập nhật'}
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
