import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Search, Filter, AlertTriangle, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

export default function AdminComplaintTab() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("OPEN");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchComplaints = () => {
        setLoading(true);
        setError(null);

        axiosClient
            .get('/admin/complaints', {
                params: {
                    page: page,
                    size: 10
                }
            })
            .then((res) => {
                const data = res?.data?.content || [];
                setComplaints(data);
                setTotalPages(res?.data?.totalPages || 0);
            })
            .catch((e) => {
                setError(e?.response?.data?.message || "Không tải được danh sách khiếu nại");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchComplaints();
    }, [page]);

    const handleResolve = (complaintId, resolution, dismiss = false) => {
        axiosClient.post(`/admin/complaints/${complaintId}/resolve`, {
            resolution,
            dismiss
        })
        .then(() => {
            alert(dismiss ? "Đã bác bỏ khiếu nại" : "Đã giải quyết khiếu nại thành công");
            fetchComplaints();
        })
        .catch(e => alert("Lỗi khi xử lý khiếu nại: " + (e.response?.data?.message || e.message)));
    };

    const promptResolve = (id) => {
        const resolution = window.prompt("Nhập nội dung giải quyết:");
        if (resolution) {
            handleResolve(id, resolution, false);
        }
    };

    const promptDismiss = (id) => {
        const reason = window.prompt("Nhập lý do bác bỏ:");
        if (reason) {
            handleResolve(id, reason, true);
        }
    };

    const getStatusStyle = (status) => {
        if (status === 'OPEN') return { bg: '#ef444420', color: '#ef4444', text: 'Chưa giải quyết' };
        if (status === 'RESOLVED') return { bg: '#22c55e20', color: '#22c55e', text: 'Đã giải quyết' };
        if (status === 'DISMISSED') return { bg: '#66666620', color: '#888', text: 'Bác bỏ' };
        return { bg: '#333', color: '#888', text: status };
    };

    const filteredComplaints = complaints.filter(c => 
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.citizen?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toString().includes(search)
    );

    return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MessageSquare size={28} color="#22c55e" />
                    Quản lý Khiếu nại
                </h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={18} />
                        <input
                            placeholder="Tìm theo tiêu đề hoặc người gửi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 16px 10px 40px', color: '#fff', width: '320px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                    <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #1f1f1f', color: '#ffffff', fontSize: '13px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '20px 24px' }}>Thông tin khiếu nại</th>
                        <th style={{ padding: '20px 24px' }}>Nội dung</th>
                        <th style={{ padding: '20px 24px' }}>Thời gian</th>
                        <th style={{ padding: '20px 24px' }}>Trạng thái</th>
                        <th style={{ padding: '20px 24px' }}>Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải danh sách...</td></tr>}
                    {!loading && error && <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</td></tr>}
                    {!loading && filteredComplaints.length === 0 && !error && <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Không tìm thấy khiếu nại nào.</td></tr>}

                    {filteredComplaints.map((c) => {
                        const statusStyle = getStatusStyle(c.status);
                        return (
                            <tr key={c.id} style={{ borderBottom: '1px solid #1f1f1f', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontWeight: '600', color: '#fff' }}>{c.title}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>ID: #{c.id} | Từ: {c.citizen?.fullName}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ fontSize: '13px', color: '#ccc', maxWidth: '400px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {c.content}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ fontSize: '13px', color: '#888' }}>
                                        {new Date(c.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '8px', 
                                        fontSize: '11px', 
                                        fontWeight: '700',
                                        background: statusStyle.bg,
                                        color: statusStyle.color
                                    }}>
                                        {statusStyle.text}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    {c.status === 'OPEN' ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => promptResolve(c.id)}
                                                style={{ background: '#22c55e20', color: '#22c55e', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <CheckCircle size={14} /> Giải quyết
                                            </button>
                                            <button 
                                                onClick={() => promptDismiss(c.id)}
                                                style={{ background: '#ef444420', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <XCircle size={14} /> Bác bỏ
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                                            Đã xử lý: {c.resolution}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
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