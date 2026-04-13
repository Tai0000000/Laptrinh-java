import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  FileText,
  Leaf,
  LogOut,
  RefreshCcw,
  Users,
  AlertTriangle,
  MessageSquare,
  CheckCircle
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

const statusColors = {
  OPEN: { background: '#f59e0b20', color: '#fbbf24' },
  RESOLVED: { background: '#22c55e20', color: '#4ade80' },
  DISMISSED: { background: '#6b728020', color: '#9ca3af' }
};

const getBadgeStyle = (status) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: '600',
  background: statusColors[status]?.background || '#1f293720',
  color: statusColors[status]?.color || '#d1d5db'
});

const formatComplaintStatus = (status) => {
  if (status === 'OPEN') return 'Mới';
  if (status === 'RESOLVED') return 'Đã xử lý';
  if (status === 'DISMISSED') return 'Đã đóng';
  return status || 'Không rõ';
};

export default function EnterpriseDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [enterprise, setEnterprise] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    const [enterpriseResult, collectorsResult, statsResult, pendingResult, acceptedResult, complaintsResult] = await Promise.allSettled([
      axiosClient.get('/enterprise/me'),
      axiosClient.get('/enterprise/collectors'),
      axiosClient.get('/enterprise/stats'),
      axiosClient.get('/requests/pending'),
      axiosClient.get('/requests/accepted'),
      axiosClient.get('/enterprise/complaints')
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

    if (complaintsResult.status === 'fulfilled') {
      setComplaints(complaintsResult.value.data?.content || []);
    } else {
      setComplaints([]);
    }

    const firstRejected = [
      enterpriseResult,
      collectorsResult,
      statsResult,
      pendingResult,
      acceptedResult
    ].find((result) => {
        if (result.status === 'rejected') {
            const status = result.reason?.response?.status;
            const url = result.reason?.config?.url;
            
            
            
            const isNoEnterprise = enterpriseResult.status === 'rejected' && enterpriseResult.reason?.response?.status === 404;
            
            if (isNoEnterprise && status === 404) {
                return false; 
            }
            
            
            const isMe404 = status === 404 && url?.includes('/enterprise/me');
            return !isMe404;
        }
        return false;
    });

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

  const handleResolveComplaint = async (complaintId) => {
    const resolution = window.prompt("Nhập nội dung phản hồi khiếu nại:");
    if (!resolution) return;

    try {
      await axiosClient.post(`/enterprise/complaints/${complaintId}/resolve`, { resolution });
      alert("Đã gửi phản hồi khiếu nại thành công");
      await loadDashboard();
    } catch (requestError) {
      alert(requestError?.response?.data?.message || 'Không thể xử lý khiếu nại');
    }
  };

  const handleAssignCollector = async (requestId, collectorId) => {
    if (!collectorId) return;
    try {
      await axiosClient.post(`/requests/${requestId}/assign`, { collectorId: Number(collectorId) });
      alert("Đã phân công nhân viên thành công");
      await loadDashboard();
    } catch (requestError) {
      alert(requestError?.response?.data?.message || 'Không thể phân công nhân viên');
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
              Theo dõi yêu cầu thu gom và quản lý đội ngũ nhân viên.
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600' }}>#{request.id} · {request.wasteType}</div>
                        <span style={{ fontSize: '12px', color: '#22c55e' }}>Đã tiếp nhận</span>
                    </div>
                    <div style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>{request.addressText || 'Chưa có địa chỉ'}</div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                            onChange={(e) => handleAssignCollector(request.id, e.target.value)}
                            defaultValue=""
                            style={{ 
                                flex: 1,
                                background: '#1a1a1a', 
                                color: '#fff', 
                                border: '1px solid #333', 
                                borderRadius: '8px', 
                                padding: '8px',
                                fontSize: '13px'
                            }}
                        >
                            <option value="" disabled>Chọn nhân viên phân công...</option>
                            {collectors.map(c => (
                                <option key={c.id} value={c.id}>{c.fullName || c.username}</option>
                            ))}
                        </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Khiếu nại khách hàng</h2>
                <AlertTriangle size={20} color="#f59e0b" />
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {complaints.length === 0 && (
                  <div style={{ color: '#666' }}>Chưa có khiếu nại nào từ khách hàng.</div>
                )}
                {complaints.map((complaint) => (
                  <div key={complaint.id} style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '16px', display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{complaint.title}</div>
                        <div style={{ color: '#888', fontSize: '12px' }}>
                          Yêu cầu #{complaint.requestId} • {complaint.citizenFullName || 'Không rõ người gửi'}
                        </div>
                      </div>
                      <span style={getBadgeStyle(complaint.status)}>{formatComplaintStatus(complaint.status)}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.5' }}>{complaint.content}</div>
                    {complaint.status === 'OPEN' ? (
                      <button
                        onClick={() => handleResolveComplaint(complaint.id)}
                        style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content', marginTop: '4px' }}
                      >
                        <MessageSquare size={14} />
                        Phản hồi ngay
                      </button>
                    ) : (
                      <div style={{ background: '#101a11', border: '1px solid #1d3521', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: '#9ae6b4', marginTop: '4px' }}>
                        <b>Phản hồi:</b> {complaint.resolution}
                      </div>
                    )}
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
