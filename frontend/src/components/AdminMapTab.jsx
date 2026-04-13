import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, ZoomIn, ZoomOut, Layers, Filter, Info, Navigation, CheckCircle, Clock } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const DEFAULT_BOUNDS = {
    minLat: 10.70,
    maxLat: 10.90,
    minLng: 106.60,
    maxLng: 106.85
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const isFiniteNumber = (value) => Number.isFinite(value) && !Number.isNaN(value);

const normalizeLatLng = (value) => {
    const n = typeof value === 'string' ? Number(String(value).replace(',', '.')) : Number(value);
    return Number.isFinite(n) ? n : null;
};

const computeBounds = (rows) => {
    const points = rows
        .map((r) => ({
            lat: normalizeLatLng(r.latitude),
            lng: normalizeLatLng(r.longitude)
        }))
        .filter((p) => isFiniteNumber(p.lat) && isFiniteNumber(p.lng));

    if (points.length === 0) {
        return DEFAULT_BOUNDS;
    }

    let minLat = points[0].lat;
    let maxLat = points[0].lat;
    let minLng = points[0].lng;
    let maxLng = points[0].lng;

    for (const p of points) {
        minLat = Math.min(minLat, p.lat);
        maxLat = Math.max(maxLat, p.lat);
        minLng = Math.min(minLng, p.lng);
        maxLng = Math.max(maxLng, p.lng);
    }

    const latPad = Math.max((maxLat - minLat) * 0.15, 0.01);
    const lngPad = Math.max((maxLng - minLng) * 0.15, 0.01);

    return {
        minLat: minLat - latPad,
        maxLat: maxLat + latPad,
        minLng: minLng - lngPad,
        maxLng: maxLng + lngPad
    };
};

export default function AdminMapTab() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [wasteFilter, setWasteFilter] = useState("ALL");
    const [bounds, setBounds] = useState(DEFAULT_BOUNDS);
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [drag, setDrag] = useState({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const [myLocation, setMyLocation] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const mapRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        setLoadError(null);
        axiosClient.get('/admin/requests', { params: { page: 0, size: 500 } })
            .then(res => {
                const rows = res.data.content || [];
                setRequests(Array.isArray(rows) ? rows : []);
            })
            .catch((e) => {
                setRequests([]);
                setLoadError(e?.response?.data?.message || 'Không tải được dữ liệu bản đồ');
            })
            .finally(() => setLoading(false));
    }, []);

    const wasteTypes = useMemo(() => {
        const set = new Set();
        for (const r of requests) {
            if (r?.wasteType) {
                set.add(String(r.wasteType));
            }
        }
        return Array.from(set).sort();
    }, [requests]);

    const filteredRequests = useMemo(() => {
        const q = search.trim().toLowerCase();
        return requests.filter((r) => {
            const matchesSearch = !q
                || String(r?.id ?? '').includes(q)
                || String(r?.addressText ?? '').toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'ALL' || r?.status === statusFilter;
            const matchesWaste = wasteFilter === 'ALL' || r?.wasteType === wasteFilter;
            return matchesSearch && matchesStatus && matchesWaste;
        });
    }, [requests, search, statusFilter, wasteFilter]);

    useEffect(() => {
        const nextBounds = computeBounds(filteredRequests);
        setBounds(nextBounds);
        setTransform({ scale: 1, x: 0, y: 0 });
        setHistory([]);
        setHistoryError(null);
        setHistoryLoading(false);

        setSelectedRequest((current) => {
            if (!current) {
                return null;
            }
            const stillExists = filteredRequests.some((r) => r?.id === current?.id);
            return stillExists ? current : null;
        });
    }, [filteredRequests]);

    const getPoint = (latValue, lngValue) => {
        const container = mapRef.current;
        if (!container) {
            return null;
        }

        const width = container.clientWidth;
        const height = container.clientHeight;
        if (!width || !height) {
            return null;
        }

        const lat = normalizeLatLng(latValue);
        const lng = normalizeLatLng(lngValue);
        if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
            return null;
        }

        const xRatio = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
        const yRatio = (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat);
        const x = xRatio * width;
        const y = yRatio * height;

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return null;
        }

        return { x, y };
    };

    const getStatusColor = (status) => {
        if (status === 'PENDING') return '#f59e0b';
        if (status === 'ACCEPTED' || status === 'ASSIGNED' || status === 'ON_THE_WAY') return '#3b82f6';
        if (status === 'COLLECTED') return '#22c55e';
        if (status === 'REJECTED' || status === 'CANCELLED') return '#9ca3af';
        return '#666';
    };

    const handleZoom = (direction) => {
        setTransform((current) => {
            const nextScale = clamp(current.scale + direction * 0.2, 0.8, 4);
            return { ...current, scale: nextScale };
        });
    };

    const resetView = () => {
        setTransform({ scale: 1, x: 0, y: 0 });
        setBounds(computeBounds(filteredRequests));
    };

    const handleMouseDown = (event) => {
        if (event.button !== 0) {
            return;
        }
        setDrag({ active: true, startX: event.clientX, startY: event.clientY, originX: transform.x, originY: transform.y });
    };

    const handleMouseMove = (event) => {
        if (!drag.active) {
            return;
        }
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        setTransform((current) => ({ ...current, x: drag.originX + dx, y: drag.originY + dy }));
    };

    const handleMouseUp = () => {
        if (drag.active) {
            setDrag((current) => ({ ...current, active: false }));
        }
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [drag.active]);

    const requestMyLocation = () => {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setMyLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                });
            },
            () => {
                setMyLocation(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    const loadHistory = async () => {
        if (!selectedRequest?.id) {
            return;
        }

        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const res = await axiosClient.get(`/requests/${selectedRequest.id}/history`);
            const rows = Array.isArray(res.data) ? res.data : [];
            setHistory(rows);
        } catch (e) {
            setHistory([]);
            setHistoryError(e?.response?.data?.message || 'Không tải được lịch sử trạng thái');
        } finally {
            setHistoryLoading(false);
        }
    };

    return (
        <div style={{ padding: '32px', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '24px', color: '#fff' }}>
            {}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '8px 12px' }}>
                        <Filter size={18} color="#888" />
                        <select
                            value={wasteFilter}
                            onChange={(e) => setWasteFilter(e.target.value)}
                            style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '13px' }}
                        >
                            <option value="ALL">Tất cả rác</option>
                            {wasteTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <span style={{ width: '1px', height: '18px', background: '#1f1f1f' }} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '13px' }}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="PENDING">PENDING</option>
                            <option value="ACCEPTED">ACCEPTED</option>
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="ON_THE_WAY">ON_THE_WAY</option>
                            <option value="COLLECTED">COLLECTED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', flex: 1, minHeight: 0 }}>
                {}
                <div style={{ 
                    background: '#111', 
                    borderRadius: '24px', 
                    border: '1px solid #1f1f1f', 
                    position: 'relative', 
                    overflow: 'hidden',
                    backgroundImage: 'radial-gradient(#1f1f1f 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
                    {}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '12px', color: '#444', fontWeight: 'bold' }}>TP. HỒ CHÍ MINH - REALTIME VIEW</div>
                    
                    {}
                    {loading ? (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate( -50%, -50% )', color: '#666' }}>Đang nạp dữ liệu bản đồ...</div>
                    ) : (
                        <div
                            ref={mapRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            style={{ position: 'absolute', inset: 0, cursor: drag.active ? 'grabbing' : 'grab' }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                                    transformOrigin: 'center center'
                                }}
                            >
                                {myLocation ? (() => {
                                    const p = getPoint(myLocation.latitude, myLocation.longitude);
                                    if (!p) return null;
                                    return (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: p.x,
                                                top: p.y,
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 2
                                            }}
                                        >
                                            <div style={{ width: 12, height: 12, borderRadius: 999, background: '#60a5fa', boxShadow: '0 0 0 6px rgba(96,165,250,0.18)' }} />
                                        </div>
                                    );
                                })() : null}

                                {filteredRequests.map((req) => {
                                    const p = getPoint(req.latitude, req.longitude);
                                    if (!p) {
                                        return null;
                                    }

                                    const isSelected = selectedRequest?.id === req.id;
                                    return (
                                        <div 
                                            key={req.id}
                                            onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); setHistory([]); setHistoryError(null); }}
                                            style={{
                                                position: 'absolute',
                                                left: p.x,
                                                top: p.y,
                                                transform: 'translate(-50%, -100%)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                zIndex: isSelected ? 10 : 1
                                            }}
                                        >
                                            <div style={{ 
                                                color: getStatusColor(req.status), 
                                                filter: isSelected ? 'drop-shadow(0 0 8px currentColor)' : 'none'
                                            }}>
                                                <MapPin size={isSelected ? 32 : 24} fill="currentColor" fillOpacity={0.2} />
                                            </div>
                                            {isSelected && (
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
                                })}
                            </div>
                        </div>
                    )}
                    {!loading && loadError && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', padding: '20px', textAlign: 'center' }}>
                            {loadError}
                        </div>
                    )}

                    {}
                    <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button type="button" onClick={() => handleZoom(1)} style={{ padding: '10px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', cursor: 'pointer', color: '#fff' }}><ZoomIn size={20} /></button>
                        <button type="button" onClick={() => handleZoom(-1)} style={{ padding: '10px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', cursor: 'pointer', color: '#fff' }}><ZoomOut size={20} /></button>
                        <button type="button" onClick={resetView} style={{ padding: '10px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', cursor: 'pointer', color: '#fff', marginTop: '12px' }}><Layers size={20} /></button>
                    </div>

                    {}
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

                {}
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
                                    <button
                                        type="button"
                                        onClick={loadHistory}
                                        disabled={historyLoading}
                                        style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: historyLoading ? 'not-allowed' : 'pointer', opacity: historyLoading ? 0.7 : 1 }}
                                    >
                                        {historyLoading ? 'Đang tải...' : 'Xem lịch sử'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={requestMyLocation}
                                        style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        Vị trí của tôi
                                    </button>
                                </div>

                                {historyError ? (
                                    <div style={{ color: '#ef4444', fontSize: '13px' }}>{historyError}</div>
                                ) : null}
                                {history.length > 0 ? (
                                    <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '12px', display: 'grid', gap: '10px' }}>
                                        {history.map((h) => (
                                            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                                <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                                                    {(h.fromStatus || 'START') + ' → ' + (h.toStatus || 'UNKNOWN')}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '12px' }}>
                                                    {h.changedAt ? new Date(h.changedAt).toLocaleString('vi-VN') : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
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
