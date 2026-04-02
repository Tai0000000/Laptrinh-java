import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  FileText,
  Leaf,
  LogOut,
  RefreshCcw,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../hooks/useAuth';

const sectionStyle = {
  background: '#111',
  borderRadius: '20px',
  border: '1px solid #1f1f1f',
  padding: '24px'
};

const cardStyle = {
  background: '#111',
  borderRadius: '16px',
  border: '1px solid #1f1f1f',
  padding: '20px'
};

export default function EnterpriseDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [enterprise, setEnterprise] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    const [enterpriseResult, collectorsResult, statsResult, pendingResult, acceptedResult] = await Promise.allSettled([
      axiosClient.get('/enterprise/me'),
      axiosClient.get('/enterprise/collectors'),
      axiosClient.get('/enterprise/stats'),
      axiosClient.get('/requests/pending'),
      axiosClient.get('/requests/accepted')
    ]);

    if (enterpriseResult.status === 'fulfilled') {
      setEnterprise(enterpriseResult.value.data);
    } else {
      setEnterprise(null);
    }

    if (collectorsResult.status === 'fulfilled') {
      setCollectors(collectorsResult.value.data || []);
    } else {
      setCollectors([]);
    }

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value.data);
    } else {
      setStats(null);
    }

    if (pendingResult.status === 'fulfilled') {
      setPendingRequests(pendingResult.value.data || []);
    } else {
      setPendingRequests([]);
    }

    if (acceptedResult.status === 'fulfilled') {
      setAcceptedRequests(acceptedResult.value.data || []);
    } else {
      setAcceptedRequests([]);
    }

    const firstRejected = [
      enterpriseResult,
      collectorsResult,
      statsResult,
      pendingResult,
      acceptedResult
    ].find((result) => result.status === 'rejected');

    if (firstRejected) {
      setError(firstRejected.reason?.response?.data?.message || 'Không tải được toàn bộ dữ liệu doanh nghiệp');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    try {
      await axiosClient.post(`/requests/${requestId}/accept`);
      await loadDashboard();
    } catch (requestError) {
      alert(requestError?.response?.data?.message || 'Không thể nhận yêu cầu này');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const statusCount = stats?.byStatus || {};

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{
        width: '260px',
        background: '#0a0a0a',
        borderRight: '1px solid #1f1f1f',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ background: '#22c55e', padding: '8px', borderRadius: '10px' }}>
            <Leaf size={24} color="black" fill="black" />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>EcoCollect</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Doanh nghiệp</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ ...cardStyle, padding: '16px' }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '6px' }}>Tài khoản</div>
            <div style={{ fontWeight: '600' }}>{user?.username || user?.email || 'Doanh nghiệp'}</div>
            <div style={{ color: '#888', fontSize: '13px', marginTop: '6px' }}>{user?.email || 'Chưa có email'}</div>
          </div>
          <div style={{ ...cardStyle, padding: '16px' }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '6px' }}>Doanh nghiệp</div>
            <div style={{ fontWeight: '600' }}>{enterprise?.companyName || 'Chưa đăng ký hồ sơ doanh nghiệp'}</div>
            <div style={{ color: enterprise?.verified ? '#22c55e' : '#f59e0b', fontSize: '13px', marginTop: '6px' }}>
              {enterprise?.verified ? 'Đã xác minh' : 'Chưa xác minh'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #1f1f1f', paddingTop: '24px', display: 'grid', gap: '12px' }}>
          <button
            type="button"
            onClick={loadDashboard}
            style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <RefreshCcw size={18} />
            <span>Làm mới dữ liệu</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            style={{ background: 'transparent', color: '#888', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px' }}>Bảng điều khiển doanh nghiệp</h1>
            <p style={{ margin: '8px 0 0', color: '#888' }}>
              Theo dõi yêu cầu thu gom, đội thu gom và trạng thái hồ sơ doanh nghiệp.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', padding: '14px 16px', borderRadius: '12px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#888' }}>Yêu cầu chờ nhận</span>
              <FileText size={18} color="#22c55e" />
            </div>
            <div style={{ fontSize: '30px', fontWeight: '700' }}>{pendingRequests.length}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#888' }}>Yêu cầu đã nhận</span>
              <CheckCircle2 size={18} color="#22c55e" />
            </div>
            <div style={{ fontSize: '30px', fontWeight: '700' }}>{acceptedRequests.length}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#888' }}>Nhân viên thu gom</span>
              <Users size={18} color="#22c55e" />
            </div>
            <div style={{ fontSize: '30px', fontWeight: '700' }}>{collectors.length}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#888' }}>Đơn đã thu gom</span>
              <Building2 size={18} color="#22c55e" />
            </div>
            <div style={{ fontSize: '30px', fontWeight: '700' }}>{statusCount.COLLECTED || 0}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          <div style={{ ...sectionStyle, minHeight: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Yêu cầu đang chờ</h2>
              {loading && <span style={{ color: '#888', fontSize: '14px' }}>Đang tải...</span>}
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {pendingRequests.length === 0 && (
                <div style={{ color: '#666' }}>Hiện chưa có yêu cầu nào cần tiếp nhận.</div>
              )}
              {pendingRequests.map((request) => (
                <div key={request.id} style={{ border: '1px solid #1f1f1f', borderRadius: '14px', padding: '16px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>Yêu cầu #{request.id}</div>
                      <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{request.addressText || 'Chưa có địa chỉ'}</div>
                    </div>
                    <span style={{ color: '#22c55e', fontSize: '13px' }}>{request.wasteType}</span>
                  </div>
                  <div style={{ color: '#bbb', fontSize: '14px' }}>{request.description || 'Không có mô tả thêm'}</div>
                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(request.id)}
                    style={{ width: 'fit-content', background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '10px 14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Nhận yêu cầu
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={sectionStyle}>
              <h2 style={{ margin: '0 0 20px', fontSize: '20px' }}>Nhân viên thu gom</h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {collectors.length === 0 && (
                  <div style={{ color: '#666' }}>Doanh nghiệp chưa có nhân viên thu gom nào.</div>
                )}
                {collectors.map((collector) => (
                  <div key={collector.id} style={{ border: '1px solid #1f1f1f', borderRadius: '12px', padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600' }}>{collector.fullName || collector.username}</div>
                    <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{collector.email || 'Chưa có email'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ margin: '0 0 20px', fontSize: '20px' }}>Yêu cầu đã nhận</h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {acceptedRequests.length === 0 && (
                  <div style={{ color: '#666' }}>Chưa có yêu cầu nào đã được doanh nghiệp tiếp nhận.</div>
                )}
                {acceptedRequests.slice(0, 5).map((request) => (
                  <div key={request.id} style={{ border: '1px solid #1f1f1f', borderRadius: '12px', padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600' }}>#{request.id} · {request.wasteType}</div>
                    <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{request.addressText || 'Chưa có địa chỉ'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
