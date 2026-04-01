import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import StatusTimeline from './StatusTimeline';
import { Search, Filter, Calendar, MapPin, Tag } from 'lucide-react';

export default function AdminRequestTab() {
    const [requests, setRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
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
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!selectedRequestId) return;
        let cancelled = false;
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
        return () => { cancelled = true; };
    }, [selectedRequestId]);

    const selectedRequest = requests.find((r) => r.id === selectedRequestId);

    return (
        <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                    <button style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '8px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} />
                        <span>Bộ lọc</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
                {/* List */}
                <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #1f1f1f' }}>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>Danh sách báo cáo</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                        {loading && <p style={{ color: '#666', textAlign: 'center' }}>Đang tải...</p>}
                        {error && <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>}
                        {requests.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedRequestId(item.id)}
                                style={{
                                    padding: '16px',
                                    marginBottom: '8px',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: selectedRequestId === item.id ? '#1a1a1a' : 'transparent',
                                    border: `1px solid ${selectedRequestId === item.id ? '#22c55e40' : 'transparent'}`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: '700', color: selectedRequestId === item.id ? '#22c55e' : '#fff' }}>#{item.id}</span>
                                    <span style={{ fontSize: '12px', color: '#666' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#888' }}>
                                    <Tag size={14} />
                                    <span>{item.wasteType}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details */}
                <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', padding: '32px', overflowY: 'auto' }}>
                    {selectedRequest ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ margin: '0 0 8px', fontSize: '24px' }}>Chi tiết báo cáo #{selectedRequest.id}</h2>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#888' }}>
                                            <Calendar size={16} />
                                            <span>{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#888' }}>
                                            <Tag size={16} />
                                            <span>{selectedRequest.wasteType}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ background: '#22c55e20', color: '#22c55e', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                                    {selectedRequest.status || 'Đang xử lý'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '16px', border: '1px solid #1f1f1f' }}>
                                    <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>Vị trí thu gom</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={18} color="#22c55e" />
                                        <span>{selectedRequest.addressText || 'Tọa độ: ' + selectedRequest.latitude + ', ' + selectedRequest.longitude}</span>
                                    </div>
                                </div>
                                <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '16px', border: '1px solid #1f1f1f' }}>
                                    <h4 style={{ margin: '0 0 12px', color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>Người báo cáo</h4>
                                    <span>{selectedRequest.citizen?.fullName || 'Người dùng ẩn danh'}</span>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Lịch sử xử lý</h3>
                                <div style={{ background: '#0a0a0a', padding: '24px', borderRadius: '16px', border: '1px solid #1f1f1f' }}>
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
