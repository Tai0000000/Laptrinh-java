import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Search, Filter, AlertTriangle, MessageSquare } from 'lucide-react';

export default function AdminComplaintTab() {
    const [complaints, setComplaints] = useState([ // data test
        {
            id: 1,
            citizen: { fullName: "Nguyễn Văn A" },
            title: "Nhân viên thu gom đi muộn",
            content: "Lịch hẹn thu gom là 8h sáng nhưng tận 10h trưa mới thấy nhân viên tới. Không những vậy, rác bị rò rỉ nước tùm lum ra sàn gạch nhà tôi gây mùi hôi thối nồng nặc cả ngày. Đề nghị công ty xem xét lại quy trình làm việc.",
            status: "OPEN",
            createdAt: "2026-04-01T08:30:00"
        },
        {
            id: 2,
            citizen: { fullName: "Trần Thị B" },
            title: "Thái độ nhân viên không tốt",
            content: "Nhân viên thu gom có lời lẽ thiếu tôn trọng, hay càu nhàu nhăn nhó khi tôi hỏi về quy trình phân loại rác hữu cơ và vô cơ. Tôi hy vọng ban quản lý sẽ đào tạo lại kỹ năng giao tiếp cho đội ngũ thu gom để giữ gìn hình ảnh chuyên nghiệp.",
            status: "RESOLVED",
            createdAt: "2026-04-02T14:15:00"
        },
        {
            id: 3,
            citizen: { fullName: "Công ty vệ sinh X" },
            title: "Sai sót trong thanh toán",
            content: "Hệ thống app trừ tiền trong tài khoản ngân hàng của tôi tận 2 lần .",
            status: "DISMISSED",
            createdAt: "2026-04-02T16:45:00"
        }

    ]);
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
        if (status === 'OPEN') return { bg: '#ffebee', color: '#c62828', text: 'Chưa giải quyết' }; // Red
        if (status === 'RESOLVED') return { bg: '#e8f5e9', color: '#2e7d32', text: 'Đã giải quyết' }; // Green
        if (status === 'DISMISSED') return { bg: '#eceff1', color: '#455a64', text: 'Bác bỏ' }; // Gray
        return { bg: '#fff3e0', color: '#ef6c00', text: status };
    };

    return (
        <div style={{ background: '#111', color: '#fff', padding: '32px', height: '100%', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <MessageSquare color="#22c55e" />
                    Quản lý Khiếu nại
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#222', color: 'white', border: '1px solid #333', borderRadius: '8px' }}>
                        <Search size={16} /> Tìm kiếm
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#222', color: 'white', border: '1px solid #333', borderRadius: '8px' }}>
                        <Filter size={16} /> Bộ lọc
                    </button>
                </div>
            </div>
            {loading && <p>Đang tải danh sách...</p>}
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', backgroundColor: '#ef444420', padding: '12px 16px', borderRadius: '8px', marginTop: '16px', fontWeight: '500' }}>
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                <tr style={{ background: '#222', borderBottom: '2px solid #333', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Người gửi</th>
                    <th style={{ padding: '12px' }}>Tiêu đề</th>
                    <th style={{ padding: '12px' }}>Nội dung</th>
                    <th style={{ padding: '12px' }}>Ngày gửi</th>
                    <th style={{ padding: '12px' }}>Trạng thái</th>
                    <th style={{ padding: '12px' }}>Hành Động</th>
                </tr>
                </thead>
                <tbody>
                {complaints.map((c) => {
                    const statusStyle = getStatusStyle(c.status);
                    return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px' }}>#{c.id}</td>
                            <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{c.citizen?.fullName}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.title}</td>
                            <td
                                title={c.content}
                                style={{ padding: '16px 12px', maxWidth: '300px' }}
                            >
                                <div style={{
                                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', color: '#aaa'
                                }}>
                                    {c.content}
                                </div>
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