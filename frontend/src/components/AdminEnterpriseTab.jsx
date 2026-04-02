import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Search, Building2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminEnterpriseTab() {
    const [enterprises, setEnterprises] = useState([{
        id: 1,
        companyName: "Công ty Môi Trường Xanh",
        licenseNumber: "GPKD-123456",
        verified: false
    },
        {
            id: 2,
            companyName: "Tập đoàn rác thải EcoCollect",
            licenseNumber: "GPKD-999999",
            verified: true
        }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        axiosClient
            .get('/admin/enterprises')
            .then((res) => {
                if (cancelled) return;
                const data = res?.data?.content || [];
                setEnterprises(data);
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e?.response?.data?.message || "Không tải được danh sách doanh nghiệp");
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    // Create verify button
    const handleVerify = (enterpriseId) => {
        setLoading(true);
        axiosClient.patch(`/api/admin/enterprises/${enterpriseId}/verify`)
            .then((res) => {
                setEnterprises(enterprises.map(e =>
                    e.id === enterpriseId ? { ...e, verified: true } : e
                ));
                alert("✅ Duyệt doanh nghiệp thành công!");
            })
            .catch((e) => {
                const errorMsg = e?.response?.data?.message || "Duyệt thất bại, vui lòng thử lại!";
                alert("❌ Lỗi: " + errorMsg);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Create Reject button
    const handleReject = (enterpriseId) => {
        if (window.confirm("Bạn có chắc chắn muốn từ chối doanh nghiệp này không?")) {

            axiosClient.patch(`/api/admin/enterprises/${enterpriseId}/reject`)
                .then(() => {
                    setEnterprises(enterprises.filter(e => e.id !== enterpriseId));
                    alert("🗑️ Đã từ chối doanh nghiệp thành công.");
                })
                .catch((error) => {
                    alert("Lỗi: Không thể từ chối!");
                });
        }
    };
    return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Building2 size={28} color="#22c55e" />
                    Quản lý Doanh nghiệp
                </h1>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={18} />
                    <input
                        placeholder="Tìm kiếm doanh nghiệp..."
                        style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 16px 10px 40px', color: '#fff', width: '280px' }}
                    />
                </div>
            </div>

            {/* Bảng Dữ liệu */}
            <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                    <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #1f1f1f', color: '#ffffff', fontSize: '13px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '20px 24px' }}>Tên Doanh Nghiệp</th>
                        <th style={{ padding: '20px 24px' }}>Mã Số Thuế</th>
                        <th style={{ padding: '20px 24px' }}>Trạng thái</th>
                        <th style={{ padding: '20px 24px' }}>Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải danh sách...</td></tr>}
                    {error && <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</td></tr>}
                    {!loading && enterprises.length === 0 && <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Chưa có dữ liệu doanh nghiệp</td></tr>}

                    {enterprises.map((e) => (
                        <tr key={e.id} style={{ borderBottom: '1px solid #1f1f1f', transition: 'background 0.2s' }}>
                            <td style={{ padding: '16px 24px', fontWeight: '600' }}>
                                {/* LƯU Ý: Đổi e.companyName thành e.name nếu backend đặt tên khác */}
                                {e.companyName || 'Công ty TNHH ABC'}
                            </td>
                            <td style={{ padding: '16px 24px', color: '#aaa' }}>
                                {e.licenseNumber || 'Chưa cập nhật'}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                {/* LƯU Ý: Đổi e.verified thành e.isVerified nếu backend đặt tên khác */}
                                {e.verified ? (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#22c55e20', color: '#22c55e', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                        <ShieldCheck size={14} /> Đã xác thực
                                    </div>
                                ) : (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f59e0b20', color: '#f59e0b', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                        <AlertCircle size={14} /> Chờ duyệt
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', gap: '50px', alignItems: 'center' }}>
                                    {e.verified ? (
                                        /* TRƯỜNG HỢP 1: ĐÃ DUYỆT -> Chỉ hiện chữ, không hiện nút Từ chối */
                                        <span style={{ color: '#666', fontSize: '14px', fontWeight: '600', fontStyle: 'italic' }}>
                ✓ Đã xử lý xong
            </span>
                                    ) : (
                                        /* TRƯỜNG HỢP 2: CHƯA DUYỆT -> Hiện đủ 2 nút */
                                        <>
                                            <button
                                                onClick={() => handleVerify(e.id)}
                                                style={{
                                                    background: '#22c55e', color: '#000', border: 'none',
                                                    padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                                                }}
                                            >
                                                Duyệt (Verify)
                                            </button>

                                            <button
                                                onClick={() => handleReject(e.id)} // Đã sửa từ handleAction(c.id) thành handleReject(e.id)
                                                style={{
                                                    background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444',
                                                    padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                                                }}
                                            >
                                                Từ chối
                                            </button>
                                        </>
                                    )}
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