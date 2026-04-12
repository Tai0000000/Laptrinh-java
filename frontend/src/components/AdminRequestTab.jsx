import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import StatusTimeline from './StatusTimeline';
import { Search, Filter, Calendar, MapPin, Tag, User as UserIcon, FileText, Image as ImageIcon } from 'lucide-react';

const MOCK_REQUESTS = [
    {
        id: 1,
        citizen: { fullName: "Nguyễn Văn A", phone: "090111222" },
        enterprise: null,
        assignedCollector: null,
        status: "PENDING",
        wasteType: "ORGANIC",
        description: "Rác sinh hoạt gia đình, khoảng 2 túi nilon to.",
        addressText: "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
        latitude: 10.7769,
        longitude: 106.7009,
        photoUrl: "https://placehold.co/400x300/1a1a1a/22c55e?text=Anh+Rac+Sinh+Hoat",
        createdAt: "2026-04-02T08:30:00"
    },
    {
        id: 2,
        citizen: { fullName: "Trần Thị B", phone: "0988777666" },
        enterprise: { companyName: "Công ty Môi Trường Xanh" },
        assignedCollector: { fullName: "Nguyễn Văn Tài" },
        status: "COLLECTING",
        wasteType: "RECYCLABLE",
        description: "Nhiều thùng carton và vỏ chai nhựa văn phòng.",
        addressText: "Tòa nhà Bitexco, Quận 1, TP.HCM",
        latitude: 10.7715,
        longitude: 106.7042,
        photoUrl: "https://placehold.co/400x300/1a1a1a/3b82f6?text=Anh+Giay+Thung",
        createdAt: "2026-04-03T09:15:00"
    },
    {
        id: 3,
        citizen: { fullName: "Cửa hàng tiện lợi X", phone: "028333444" },
        enterprise: { companyName: "Tập đoàn EcoCollect" },
        assignedCollector: { fullName: "Võ Minh Khang" },
        status: "COMPLETED",
        wasteType: "HAZARDOUS",
        description: "2 thùng pin cũ và bóng đèn huỳnh quang hỏng.",
        addressText: "456 Nguyễn Thị Minh Khai, Quận 3, TP.HCM",
        latitude: 10.7738,
        longitude: 106.6896,
        photoUrl: "https://placehold.co/400x300/1a1a1a/ef4444?text=Anh+Pin+Cu",
        proofImageUrl: "https://placehold.co/400x300/1a1a1a/22c55e?text=Anh+Da+Gom+Xong",
        createdAt: "2026-04-01T14:00:00"
    }
];

export default function AdminRequestTab() {
    const [requests, setRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [statusHistory, setStatusHistory] = useState([
        { status: 'PENDING', updatedAt: '2026-04-01T08:30:00', note: 'Người dân đã gửi yêu cầu lên hệ thống.' },
        { status: 'COLLECTING', updatedAt: '2026-04-02T09:00:00', note: 'Nhân viên Tài đang di chuyển đến điểm thu gom.' },
        { status: 'COMPLETED', updatedAt: '2026-04-02T10:30:00', note: 'Đã thu gom thành công rác thải.' }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        /*
        setLoading(true);
        setError(null);

        axiosClient
            .get(`/admin/requests`)
            .then((res) => {
                if (cancelled) return;
                const data = res?.data?.content || [];
                setRequests(data);
                if (!selectedRequestId && data.length > 0) {
                    setSelectedRequestId(data[0].id);
                }
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e?.response?.data?.message || "Không tải được danh sách yêu cầu");
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            })
        */
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!selectedRequestId || selectedRequestId > 3) return; // Chỉ mock history cho 3 id đầu
        let cancelled = false;
        /*
        setError(null);

        axiosClient
            .get(`/requests/${selectedRequestId}/history`)
            .then((res) => {
                if (cancelled) return;
                setStatusHistory(Array.isArray(res?.data) ? res.data : []);
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e?.response?.data?.message || "Không thể tải lịch sử trạng thái")
            })
        */
        return () => { cancelled = true; };
    }, [selectedRequestId]);

    const selectedRequest = requests.find((r) => r.id === selectedRequestId);
    const getStatusStyle = (status) => {
        if (status === 'PENDING') return { bg: '#f59e0b20', color: '#f59e0b', text: 'Đang chờ' };
        if (status === 'COLLECTING') return { bg: '#3b82f620', color: '#3b82f6', text: 'Đang đi gom' };
        if (status === 'COMPLETED') return { bg: '#22c55e20', color: '#22c55e', text: 'Đã hoàn thành' };
        return { bg: '#333', color: '#888', text: status };
    };

    return (
        <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', color: '#fff' }}>
            {/* --- HEADER --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Yêu cầu thu gom</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={18} />
                        <input
                            placeholder="Tìm kiếm mã yêu cầu..."
                            style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 16px 10px 40px', color: '#fff', width: '240px' }}
                        />
                    </div>
                    <button style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '8px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Filter size={18} />
                        <span>Bộ lọc</span>
                    </button>
                </div>
            </div>

            {/* --- MASTER-DETAIL LAYOUT --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>

                {/* 1. CỘT TRÁI: Danh sách yêu cầu */}
                <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #1f1f1f' }}>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>Danh sách báo cáo</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {requests.map((item) => {
                            const statusStyle = getStatusStyle(item.status);
                            const isSelected = selectedRequestId === item.id;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedRequestId(item.id)}
                                    style={{
                                        padding: '16px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
                                        backgroundColor: isSelected ? '#22c55e15' : '#1a1a1a',
                                        border: `1px solid ${isSelected ? '#22c55e' : '#222'}`
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '700', fontSize: '15px', color: isSelected ? '#22c55e' : '#fff' }}>
                                            {item.citizen.fullName}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#666' }}>#{item.id}</span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item.addressText}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: statusStyle.bg, color: statusStyle.color, fontWeight: 'bold' }}>
                                            {statusStyle.text}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
                                            <Tag size={12} /> {item.wasteType}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. CỘT PHẢI: Chi tiết */}
                <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', padding: '32px', overflowY: 'auto' }}>
                    {selectedRequest ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Header Chi tiết */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1f1f1f', paddingBottom: '20px' }}>
                                <div>
                                    <h2 style={{ margin: '0 0 12px', fontSize: '24px' }}>Chi tiết báo cáo #{selectedRequest.id}</h2>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#888' }}>
                                            <Calendar size={16} /> <span>{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#888' }}>
                                            <Tag size={16} /> <span>{selectedRequest.wasteType}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ background: getStatusStyle(selectedRequest.status).bg, color: getStatusStyle(selectedRequest.status).color, padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                                    {getStatusStyle(selectedRequest.status).text}
                                </div>
                            </div>

                            {/* Grid 2 cột: Vị trí & Người gửi */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
                                    <h4 style={{ margin: '0 0 12px', color: '#888', fontSize: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={14} /> Vị trí thu gom
                                    </h4>
                                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{selectedRequest.addressText}</div>
                                </div>
                                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
                                    <h4 style={{ margin: '0 0 12px', color: '#888', fontSize: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <UserIcon size={14} /> Người báo cáo
                                    </h4>
                                    <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>{selectedRequest.citizen?.fullName}</div>
                                    <div style={{ fontSize: '14px', color: '#aaa' }}>SĐT: {selectedRequest.citizen?.phone}</div>
                                </div>
                            </div>

                            {/* Mô tả */}
                            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
                                <h4 style={{ margin: '0 0 12px', color: '#888', fontSize: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={14} /> Mô tả rác thải
                                </h4>
                                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ddd' }}>{selectedRequest.description}</div>
                            </div>

                            {/* Hình ảnh đính kèm */}
                            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
                                <h4 style={{ margin: '0 0 16px', color: '#888', fontSize: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ImageIcon size={14} /> Ảnh đính kèm
                                </h4>
                                <img
                                    src={selectedRequest.photoUrl}
                                    alt="Rác đính kèm"
                                    style={{ maxWidth: '300px', width: '100%', borderRadius: '12px', border: '1px solid #333' }}
                                />
                            </div>
                            {/* Lich su xu ly */}
                             <div>
                                <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Lịch sử xử lý</h3>
                                <div style={{ background: '#1a1a1a', padding: '24px', borderRadius: '16px', border: '1px solid #222' }}>
                                    <StatusTimeline history={statusHistory} dark />
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                            <p>Vui lòng chọn một yêu cầu để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
