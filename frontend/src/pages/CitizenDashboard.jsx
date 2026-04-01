import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useParams } from 'react-router-dom';
import StatusTimeline from '../components/StatusTimeline';
import AICheck from '../components/AICheck';

export default function CitizenDashboard() {
  const { userId } = useParams();

  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    axiosClient
      .get(`/citizen/requests/${userId}`)
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res?.data) ? res.data : [];
        setRequests(data);

        if (!selectedRequestId && data.length > 0) {
          setSelectedRequestId(data[0].id);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.message || 'Không thể tải danh sách yêu cầu.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedRequestId) return;

    let cancelled = false;
    setError(null);

    axiosClient
      .get(`/citizen/requests/${selectedRequestId}/status-history`)
      .then((res) => {
        if (cancelled) return;
        setStatusHistory(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.message || 'Không thể tải lịch sử trạng thái.');
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRequestId]);

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  return (
    <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Citizen Dashboard</h2>
        <div style={{ marginBottom: 12, color: '#475569', fontSize: 13 }}>User ID: {userId}</div>

        <AICheck />

        {loading ? <div>Đang tải...</div> : null}
        {error ? (
          <div style={{ color: '#b91c1c', background: '#fee2e2', padding: 10, borderRadius: 6 }}>{error}</div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {requests.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRequestId(r.id)}
              style={{
                textAlign: 'left',
                border: '1px solid',
                borderColor: r.id === selectedRequestId ? '#2563eb' : '#e2e8f0',
                background: r.id === selectedRequestId ? '#eff6ff' : '#fff',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700 }}>Request #{r.id}</div>
              <div style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>
                Trạng thái: {r.status ?? '-'}
              </div>
              <div style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>
                Loại rác: {r.wasteType ?? '-'}
              </div>
              {r.createdAt ? (
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                  Tạo: {new Date(r.createdAt).toLocaleString('vi-VN')}
                </div>
              ) : null}
            </button>
          ))}

          {requests.length === 0 && !loading ? <div style={{ color: '#64748b' }}>Chưa có yêu cầu.</div> : null}
        </div>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Status Timeline</h3>
        {selectedRequest ? (
          <div style={{ marginBottom: 12, color: '#475569', fontSize: 13 }}>
            Đang xem Request #{selectedRequest.id} - {selectedRequest.status ?? '-'}
          </div>
        ) : (
          <div style={{ marginBottom: 12, color: '#64748b', fontSize: 13 }}>Chọn một request để xem timeline.</div>
        )}

        <StatusTimeline history={statusHistory} />
      </div>
    </div>
  );
}