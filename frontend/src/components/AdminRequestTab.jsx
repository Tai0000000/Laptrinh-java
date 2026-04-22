import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import StatusTimeline from './StatusTimeline';
import { Search, Filter, Calendar, MapPin, Tag, User as UserIcon, FileText, Image as ImageIcon } from 'lucide-react';

export default function AdminRequestTab() {
    const [requests, setRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWasteType, setSelectedWasteType] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const fetchRequests = async () => {
            setLoading(true);
            try {
                const response = await axiosClient.get('/admin/requests');

                if (!cancelled) {
                    const data = response.data.data || response.data;
                    const dataList = data.content || data;
                    setRequests(Array.isArray(dataList) ? dataList : []);
                }
            } catch (err) {
                console.error("Lỗi gọi API:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchRequests();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!selectedRequestId) return;

        let cancelled = false;

        const fetchHistory = async () => {
            try {
                const response = await axiosClient.get(`/requests/${selectedRequestId}/history`);
                if (!cancelled) {
                    const historyList = response.data.data || response.data || [];
                    setStatusHistory(Array.isArray(historyList) ? historyList : []);
                }
            } catch (err) {
                console.error("Lỗi gọi API lịch sử:", err);
            }
        };

        fetchHistory();

        return () => { cancelled = true; };
    }, [selectedRequestId]);

    const selectedRequest = requests.find((r) => r.id === selectedRequestId);

    const getStatusStyle = (status) => {
        if (status === 'PENDING') return { bg: '#f59e0b20', color: '#f59e0b', text: 'Đang chờ' };
        if (status === 'COLLECTING') return { bg: '#3b82f620', color: '#3b82f6', text: 'Đang đi gom' };
        if (status === 'COMPLETED') return { bg: '#22c55e20', color: '#22c55e', text: 'Đã hoàn thành' };
        return { bg: '#333', color: '#888', text: status };
    };

        // Tìm kiếm yêu cầu
    const filteredRequests = requests.filter(request => {
        // 1. Kiểm tra xem ID
        const matchId = !searchTerm || request.id.toString().includes(searchTerm.trim());

        // 2. Kiểm tra xem loại rác (Nếu chọn 'ALL' thì cho qua hết)
        const matchType = selectedWasteType === 'ALL' || request.wasteType === selectedWasteType;

        // Phải thỏa mãn cả 2 điều kiện thì mới giữ lại
        return matchId && matchType;
    });

    const handleCancelRequest = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy yêu cầu này không?")) return;

        try {
            // Gọi API đổi trạng thái sang CANCELLED
            await axiosClient.put(`/admin/requests/${id}/status`, {
                status: 'CANCELLED',
                note: 'Admin đã hủy yêu cầu này'
            });

            
            setRequests(prev => prev.map(req =>
                req.id === id ? { ...req, status: 'CANCELLED' } : req
            ));

            alert("Đã hủy yêu cầu thành công!");
        } catch (err) {
            console.error("Lỗi khi hủy yêu cầu:", err);
            alert("Không thể hủy yêu cầu. Vui lòng kiểm tra lại!");
        }
    };

    return (
        <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Yêu cầu thu gom</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={18} />
                        <input
                            placeholder="Tìm kiếm mã yêu cầu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 16px 10px 40px', color: '#fff', width: '240px' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '0 12px' }}>
                    <Filter size={18} style={{ color: '#666', marginRight: '8px' }} />
                    <select
                        value={selectedWasteType}
                        onChange={(e) => setSelectedWasteType(e.target.value)}
                        style={{
                            background: 'transparent', border: 'none', color: '#fff',
                            padding: '10px 4px', outline: 'none', cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        <option value="ALL" style={{ color: '#000' }}>Tất cả loại rác</option>
                        <option value="ORGANIC" style={{ color: '#000' }}>Rác hữu cơ (Organic)</option>
                        <option value="GENERAL" style={{ color: '#000' }}>Rác sinh hoạt (General)</option>
                        <option value="RECYCLABLE" style={{ color: '#000' }}>Rác tái chế (Recyclable)</option>
                        <option value="HAZARDOUS" style={{ color: '#000' }}>Rác độc hại (Hazardous)</option>
                        <option value="ELECTRONIC" style={{ color: '#000' }}>Rác điện tử (Electronic)</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
                <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #1f1f1f' }}>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>Danh sách báo cáo</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredRequests.map((item) => {
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
                                        {/* CHỐNG LỖI TRẮNG TRANG */}
                                        <span style={{ fontWeight: '700', fontSize: '15px', color: isSelected ? '#22c55e' : '#fff' }}>
                                            {item.citizen?.fullName|| 'Người ẩn danh'}
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

                <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', padding: '32px', overflowY: 'auto' }}>
                    {selectedRequest ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

                            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
                                <h4 style={{ margin: '0 0 12px', color: '#888', fontSize: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={14} /> Mô tả rác thải
                                </h4>
                                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#ddd' }}>{selectedRequest.description}</div>
                            </div>

                            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
                                <h4 style={{ margin: '0 0 16px', color: '#888', fontSize: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ImageIcon size={14} /> Ảnh đính kèm
                                </h4>
                                {selectedRequest.photoUrl ? (
                                    <div style={{ position: 'relative', width: 'fit-content' }}>
                                        <img
                                            src={selectedRequest.photoUrl.startsWith('http')
                                                ? selectedRequest.photoUrl
                                                : `http://localhost:8081${selectedRequest.photoUrl}`}
                                            alt="Rác đính kèm"
                                            style={{ 
                                                maxWidth: '400px', 
                                                width: '100%', 
                                                borderRadius: '12px', 
                                                border: '1px solid #333',
                                                cursor: 'zoom-in',
                                                display: 'block'
                                            }}
                                            onClick={() => window.open(selectedRequest.photoUrl.startsWith('http') ? selectedRequest.photoUrl : `http://localhost:8081${selectedRequest.photoUrl}`, '_blank')}
                                        />
                                        <div style={{ 
                                            position: 'absolute', 
                                            bottom: '12px', 
                                            right: '12px', 
                                            background: 'rgba(0,0,0,0.6)', 
                                            padding: '4px 8px', 
                                            borderRadius: '6px', 
                                            fontSize: '11px', 
                                            backdropFilter: 'blur(4px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Search size={12} /> Xem ảnh lớn
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', color: '#666', fontStyle: 'italic', background: '#222', borderRadius: '12px', textAlign: 'center' }}>
                                        Không có ảnh đính kèm
                                    </div>
                                )}
                            </div>

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
                {selectedRequest?.status === 'PENDING' && (
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => handleCancelRequest(selectedRequest.id)}
                            style={{
                                background: '#ef444420',
                                color: '#ef4444',
                                border: '1px solid #ef4444',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#ef4444'}
                            onMouseOut={(e) => e.target.style.background = '#ef444420'}
                        >
                            Hủy yêu cầu thu gom
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}