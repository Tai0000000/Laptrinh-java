import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import StatusTimeline from './StatusTimeline';

export default function AdminRequestTab() {
    const [requests, setRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // auto call API when admin access web ( default : REQUESTS )
    useEffect (() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        axiosClient
            .get(`/admin/requests`)
            .then((res) => {
                if (cancelled) return;
                const data = res?.data?.content || [];
                setRequests(data);

                if (!selectedRequestId && data.length > 0) { //admin doesn't click on requests list and list has data
                    setSelectedRequestId(data[0].id);
                }
            })
            .catch((e) => {
                if (cancelled) return;
                setError (e?.response?.data?.message || "Không tải được danh sách yêu cầu");
            })
            .finally(() =>{
                if (cancelled) return;
                setLoading(false);
            })
        return () => {
            cancelled = true;
        };
    }, []);

    // auto call API when Admin click on one of requests
    useEffect (() => {
        if (!selectedRequestId) return;
        let cancelled = false;
        setError (null);

        axiosClient
            .get(`/requests/${selectedRequestId}/history`)
            .then((res)=>{
                if (cancelled) return;
                setStatusHistory(Array.isArray(res?.data) ? res.data : []);
            })
            .catch((e) =>{
                if (cancelled) return;
                setError(e?.response?.data?.message || "Không thể tải lịch sử trạng thái")
            })
        return () => {
            cancelled = true;
        };
    }, [selectedRequestId]);

    // find id of requests, which like id admin just click
    const selectedRequest = requests.find((r) => r.id === selectedRequestId);

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '20px' }}>
            <div style={{ width: '400px', border: '1px solid #ccc', padding: '10px', overflowY: 'auto', background: 'white' }}>
                <h2>Danh sách báo cáo rác</h2>
                {loading && <p>Đang tải...</p>}
                {error && <p style={{color: 'red' }}>{error}</p>}
                {requests.map((item) => (
                    <div key={item.id} onClick={() => setSelectedRequestId(item.id)}
                         style={{
                             padding:'10px', margin:'5px 0', border:'1px solid #eee', cursor:'pointer',
                             backgroundColor: selectedRequestId === item.id ? '#e3f2fd' : 'white'
                         }}>
                        <strong>Mã: #{item.id}</strong> - {item.wasteType}
                    </div>
                ))}
            </div>
            <div style={{ flex: 1, border: '1px solid #ccc', padding: '20px', background: 'white' }}>
                <h2>Chi tiết báo cáo</h2>
                {selectedRequest ? (
                    <div>
                        <p><strong>Loại rác:</strong> {selectedRequest.wasteType}</p>
                        <p><strong>Ngày gửi:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                        <hr/>
                        <h3>Lịch sử xử lý:</h3>
                        <StatusTimeline history={statusHistory} />
                    </div>
                ) : <p>Vui lòng chọn yêu cầu.</p>}
            </div>
        </div>
    );
}