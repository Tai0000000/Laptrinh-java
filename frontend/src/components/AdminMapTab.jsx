import React, { useState, useEffect } from 'react';
import { Search, MapPin, ZoomIn, ZoomOut, Layers, Filter, Info, Navigation, CheckCircle, Clock } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const MOCK_REQUESTS = [
    { id: 1, latitude: 10.7769, longitude: 106.7009, status: 'PENDING', wasteType: 'ORGANIC', addressText: '123 Lê Lợi, Quận 1', createdAt: new Date().toISOString() },
    { id: 2, latitude: 10.7715, longitude: 106.7042, status: 'COLLECTING', wasteType: 'RECYCLABLE', addressText: 'Tòa nhà Bitexco, Quận 1', createdAt: new Date().toISOString() },
    { id: 3, latitude: 10.7738, longitude: 106.6896, status: 'COMPLETED', wasteType: 'HAZARDOUS', addressText: '456 Nguyễn Thị Minh Khai, Quận 3', createdAt: new Date().toISOString() },
    { id: 4, latitude: 10.7825, longitude: 106.6950, status: 'PENDING', wasteType: 'ELECTRONIC', addressText: 'Dinh Độc Lập, Quận 1', createdAt: new Date().toISOString() },
    { id: 5, latitude: 10.7620, longitude: 106.6820, status: 'ON_THE_WAY', wasteType: 'GENERAL', addressText: 'Chợ An Đông, Quận 5', createdAt: new Date().toISOString() },
];

export default function AdminMapTab() {
    const [requests, setRequests] = useState(MOCK_REQUESTS);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        /*
        axiosClient.get('/admin/requests', { params: { size: 100 } })
            .then(res => {
                setRequests(res.data.content || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        */
    }, []);

    // Simple coordinate normalization for visualization
    // We'll assume a bounding box around TP.HCM for this mock visualization
    const minLat = 10.7;
    const maxLat = 10.9;
    const minLng = 106.6;
    const maxLng = 106.8;

    const getX = (lng) => ((lng - minLng) / (maxLng - minLng)) * 100;
    const getY = (lat) => 100 - (((lat - minLat) / (maxLat - minLat)) * 100);

    const filteredRequests = requests.filter(r => 
        r.id.toString().includes(search) || 
        r.addressText?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status) => {
        if (status === 'PENDING') return '#f59e0b';
        if (status === 'COLLECTING' || status === 'ON_THE_WAY') return '#3b82f6';
        if (status === 'COMPLETED' || status === 'COLLECTED') return '#22c55e';
        return '#666';
    };

    return (
        <div style={{ padding: '32px', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '24px', color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Bản đồ trực tuyến</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={18} />
                        <input
                            placeholder="Tìm địa chỉ hoặc mã yêu cầu..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '10px 16px 10px 40px', color: '#fff', width: '320px' }}
                        />
                    </div>
                    <button style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '8px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Filter size={18} />
                        <span>Lọc theo rác</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', flex: 1, minHeight: 0 }}>
                {/* Map Area */}
                <div style={{ 
                    background: '#111', 
                    borderRadius: '24px', 
                    border: '1px solid #1f1f1f', 
                    position: 'relative', 
                    overflow: 'hidden',
                    backgroundImage: 'radial-gradient(#1f1f1f 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
                    {/* Grid labels */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '12px', color: '#444', fontWeight: 'bold' }}>TP. HỒ CHÍ MINH - REALTIME VIEW</div>
                    
                    {/* Markers */}
                    {loading ? (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate( -50%, -50% )', color: '#666' }}>Đang nạp dữ liệu bản đồ...</div>
                    ) : (
                        filteredRequests.map(req => {
                            const x = getX(req.longitude);
                            const y = getY(req.latitude);
                            // Only show if within our mock bounds
                            if (x < 0 || x > 100 || y < 0 || y > 100) return null;

                            return (
                                <div 
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    style={{
                                        position: 'absolute',
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        transform: 'translate(-50%, -100%)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        zIndex: selectedRequest?.id === req.id ? 10 : 1
                                    }}
                                >
                                    <div style={{ 
                                        color: getStatusColor(req.status), 
                                        filter: selectedRequest?.id === req.id ? 'drop-shadow(0 0 8px currentColor)' : 'none'
                                    }}>
                                        <MapPin size={selectedRequest?.id === req.id ? 32 : 24} fill="currentColor" fillOpacity={0.2} />
                                    </div>
                                    {selectedRequest?.id === req.id && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            bottom: '100%', 
                                            left: '50%', 
                                            transform: 'translateX(-50%)',
                                            background: '#fff',
                                            color: '#000',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap',
                                            marginBottom: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                        }}>
                                            #{req.id} - {req.wasteType}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Map Controls */}
                    <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ padding: '10px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', cursor: 'pointer' }}><ZoomIn size={20} /></div>
                        <div style={{ padding: '10px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', cursor: 'pointer' }}><ZoomOut size={20} /></div>
                        <div style={{ padding: '10px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', cursor: 'pointer', marginTop: '12px' }}><Layers size={20} /></div>
                    </div>

                    {/* Legend */}
                    <div style={{ position: 'absolute', bottom: '24px', left: '24px', background: '#111111aa', backdropFilter: 'blur(8px)', padding: '16px', borderRadius: '16px', border: '1px solid #1f1f1f', display: 'flex', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                            <span>Chờ xử lý</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                            <span>Đang thực hiện</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                            <span>Đã hoàn thành</span>
                        </div>
                    </div>
                </div>

                {/* Info Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: '#111', borderRadius: '24px', border: '1px solid #1f1f1f', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Info size={20} color="#22c55e" />
                            Chi tiết điểm thu gom
                        </h3>

                        {selectedRequest ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden' }}>
                                    <img 
                                        src={selectedRequest.photoUrl || 'https://placehold.co/400x300/1a1a1a/22c55e?text=No+Photo'} 
                                        style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                                        alt="Rác"
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ 
                                            padding: '4px 12px', 
                                            borderRadius: '20px', 
                                            fontSize: '11px', 
                                            fontWeight: 'bold',
                                            background: getStatusColor(selectedRequest.status) + '20',
                                            color: getStatusColor(selectedRequest.status)
                                        }}>
                                            {selectedRequest.status}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#666' }}>ID: #{selectedRequest.id}</span>
                                    </div>

                                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{selectedRequest.wasteType}</div>
                                    
                                    <div style={{ display: 'flex', gap: '10px', color: '#888', fontSize: '13px' }}>
                                        <Navigation size={16} style={{ flexShrink: 0 }} />
                                        <span>{selectedRequest.addressText}</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', color: '#888', fontSize: '13px' }}>
                                        <Clock size={16} style={{ flexShrink: 0 }} />
                                        <span>Gửi lúc: {new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                        Xem lịch sử
                                    </button>
                                    <button style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                        Điều phối
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#444', gap: '16px' }}>
                                <MapPin size={48} strokeWidth={1} />
                                <p style={{ fontSize: '14px' }}>Chọn một điểm trên bản đồ để xem chi tiết</p>
                            </div>
                        )}
                    </div>

                    <div style={{ background: '#22c55e10', borderRadius: '24px', padding: '24px', border: '1px solid #22c55e20' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <CheckCircle size={18} color="#22c55e" />
                            <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: '600' }}>Thông số nhanh</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#888' }}>{filteredRequests.length} yêu cầu được hiển thị trong khu vực này.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}