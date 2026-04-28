import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Camera,
  CheckCircle,
  ChevronDown,
  FileText,
  Leaf,
  LogOut,
  Mail,
  MapPin,
  Plus,
  RefreshCcw,
  Star,
  Trophy,
  Upload,
  X
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../hooks/useAuth';

const SidebarItem = ({ id, label, icon, active, onClick }) => (
  <li
    onClick={() => onClick(id)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      cursor: 'pointer',
      borderRadius: '12px',
      transition: 'all 0.2s',
      backgroundColor: active ? '#1a1a1a' : 'transparent',
      color: active ? '#22c55e' : '#888',
      fontWeight: active ? '600' : '400'
    }}
  >
    {icon}
    <span className="sidebar-text" style={{ fontSize: '14px' }}>{label}</span>
  </li>
);

const SummaryCard = ({ label, value, accent }) => (
  <div
    style={{
      background: '#111',
      border: '1px solid #1f1f1f',
      borderRadius: '18px',
      padding: '20px'
    }}
  >
    <div style={{ color: '#888', fontSize: '13px', marginBottom: '10px' }}>{label}</div>
    <div style={{ color: accent || '#fff', fontSize: '28px', fontWeight: '700' }}>{value}</div>
  </div>
);

const statusColors = {
  PENDING: { background: '#f59e0b20', color: '#fbbf24' },
  ACCEPTED: { background: '#3b82f620', color: '#60a5fa' },
  REJECTED: { background: '#ef444420', color: '#f87171' },
  ASSIGNED: { background: '#8b5cf620', color: '#a78bfa' },
  ON_THE_WAY: { background: '#06b6d420', color: '#22d3ee' },
  COLLECTED: { background: '#22c55e20', color: '#4ade80' },
  CANCELLED: { background: '#6b728020', color: '#9ca3af' },
  OPEN: { background: '#f59e0b20', color: '#fbbf24' },
  RESOLVED: { background: '#22c55e20', color: '#4ade80' },
  DISMISSED: { background: '#6b728020', color: '#9ca3af' }
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Chưa có dữ liệu';
  }

  return new Date(value).toLocaleString('vi-VN');
};

const formatStatus = (status) => {
  const mapping = {
    PENDING: 'Chờ tiếp nhận',
    ACCEPTED: 'Đã tiếp nhận',
    REJECTED: 'Bị từ chối',
    ASSIGNED: 'Đã phân công',
    ON_THE_WAY: 'Đang đến lấy',
    COLLECTED: 'Đã thu gom',
    CANCELLED: 'Đã hủy',
    OPEN: 'Đang mở',
    RESOLVED: 'Đã xử lý',
    DISMISSED: 'Đã từ chối'
  };

  return mapping[status] || status || 'Không xác định';
};

const formatWasteType = (wasteType) => {
  const mapping = {
    ORGANIC: 'Hữu cơ',
    RECYCLABLE: 'Tái chế',
    HAZARDOUS: 'Nguy hại',
    GENERAL: 'Rác sinh hoạt',
    ELECTRONIC: 'Điện tử'
  };

  return mapping[wasteType] || wasteType || 'Chưa phân loại';
};

const getBadgeStyle = (status) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '600',
  background: statusColors[status]?.background || '#1f293720',
  color: statusColors[status]?.color || '#d1d5db'
});

export default function CitizenDashboard() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const resolvedUserId = useMemo(() => user?.id ?? Number(userId), [user?.id, userId]);
  const [activeTab, setActiveTab] = useState('MY_REPORTS');
  const [reports, setReports] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState(null);
  const [historiesByRequest, setHistoriesByRequest] = useState({});
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [uploadedAiImage, setUploadedAiImage] = useState(null);
  const [formStep, setFormStep] = useState(1); // 1: AI/Image, 2: Location/Details, 3: Confirm
  const fileInputRef = useRef(null);

  const [newReport, setNewReport] = useState({
    wasteType: 'ORGANIC',
    latitude: '10.7769',
    longitude: '106.7009',
    addressText: '123 Nguyễn Huệ, Q.1',
    description: '',
    photoUrl: ''
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewReport(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
      },
      (err) => {
        setError('Không thể lấy vị trí: ' + err.message);
      }
    );
  };

  const [complaintForm, setComplaintForm] = useState({
    requestId: '',
    title: '',
    content: ''
  });

  const menuItems = [
    { id: 'MY_REPORTS', label: 'Báo cáo của tôi', icon: <FileText size={20} /> },
    { id: 'CREATE_NEW', label: 'Tạo mới', icon: <Plus size={20} /> },
    { id: 'POINTS', label: 'Điểm thưởng', icon: <Star size={20} /> },
    { id: 'LEADERBOARD', label: 'Bảng xếp hạng', icon: <Trophy size={20} /> },
    { id: 'COMPLAINTS', label: 'Khiếu nại', icon: <AlertTriangle size={20} /> }
  ];

  const refreshDashboard = async () => {
    setLoading(true);
    setError(''); 

    try {
      const [summaryRes, requestsRes, pointHistoryRes, leaderboardRes, complaintsRes] = await Promise.all([
        axiosClient.get('/citizen/me/summary'),
        axiosClient.get('/citizen/me/requests'),
        axiosClient.get('/citizen/me/point-history'),
        axiosClient.get('/citizen/leaderboard'),
        axiosClient.get('/citizen/me/complaints')
      ]);

      setSummary(summaryRes.data);
      setReports(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      setPointHistory(Array.isArray(pointHistoryRes.data) ? pointHistoryRes.data : []);
      setLeaderboard(Array.isArray(leaderboardRes.data) ? leaderboardRes.data : []);
      setComplaints(Array.isArray(complaintsRes.data) ? complaintsRes.data : []);
    } catch (requestError) {
      
      
      setError(requestError?.response?.data?.message || 'Không tải được dữ liệu mục người dân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshDashboard();
    }
  }, [user]);

  const handleCreateReport = async (event) => {
    event.preventDefault();
    setSubmittingReport(true);
    setError('');

    const latitude = Number(String(newReport.latitude).replace(',', '.'));
    const longitude = Number(String(newReport.longitude).replace(',', '.'));

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setError('Vĩ độ không hợp lệ. Vui lòng nhập trong khoảng -90 đến 90.');
      setSubmittingReport(false);
      return;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError('Kinh độ không hợp lệ. Vui lòng nhập trong khoảng -180 đến 180.');
      setSubmittingReport(false);
      return;
    }

    if (newReport.photoUrl && newReport.photoUrl.length > 255) {
      setError('URL ảnh quá dài. Vui lòng dùng link ngắn hơn.');
      setSubmittingReport(false);
      return;
    }

    try {
      let finalPhotoUrl = newReport.photoUrl;

      // Nếu có file ảnh được chọn từ máy, upload lên server trước
      if (uploadedAiImage && uploadedAiImage.file) {
        const formData = new FormData();
        formData.append('file', uploadedAiImage.file);
        
        try {
          const uploadRes = await axiosClient.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          finalPhotoUrl = uploadRes.data.url;
        } catch (uploadErr) {
          console.error("Lỗi upload ảnh:", uploadErr);
          // Vẫn tiếp tục nếu upload lỗi nhưng có description? 
          // Hoặc dừng lại báo lỗi? Thường nên dừng lại.
          throw new Error("Không thể tải ảnh lên hệ thống. Vui lòng thử lại.");
        }
      }

      await axiosClient.post('/requests', {
        wasteType: newReport.wasteType,
        latitude,
        longitude,
        addressText: newReport.addressText,
        description: newReport.description,
        photoUrl: finalPhotoUrl
      });

      alert("✅ Gửi yêu cầu thu gom thành công!");
      setNewReport({
        wasteType: 'ORGANIC',
        latitude: '10.7769',
        longitude: '106.7009',
        addressText: '',
        description: '',
        photoUrl: ''
      });
      setAiResult(null);
      setUploadedAiImage(null);
      setFormStep(1);
      await refreshDashboard();
      setActiveTab('MY_REPORTS');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không thể tạo yêu cầu thu gom');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleAIClassify = async () => {
    setAiLoading(true);
    setError('');

    try {
      if (!newReport.description.trim() && !uploadedAiImage?.dataUrl && !newReport.photoUrl.trim()) {
        throw new Error('Hãy nhập mô tả hoặc chọn ảnh để AI phân tích');
      }

      const response = await axiosClient.post('/ai/classify', {
        description: newReport.description || 'Rác sinh hoạt thông thường',
        imageData: uploadedAiImage?.dataUrl || newReport.photoUrl || ''
      });
      setAiResult(response.data);
      if (response.data?.wasteType) {
        setNewReport((previous) => ({
          ...previous,
          wasteType: response.data.wasteType
        }));
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không thể gọi AI phân loại');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Chỉ hỗ trợ tệp hình ảnh cho AI phân tích');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh tải lên phải nhỏ hơn hoặc bằng 5MB');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedAiImage({
        name: file.name,
        dataUrl: reader.result,
        file: file // Lưu file gốc để upload
      });
      setError('');
    };
    reader.onerror = () => {
      setError('Không thể đọc ảnh đã chọn');
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedAiImage = () => {
    setUploadedAiImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleHistory = async (requestId) => {
    if (expandedRequestId === requestId) {
      setExpandedRequestId(null);
      return;
    }

    setExpandedRequestId(requestId);

    if (historiesByRequest[requestId]) {
      return;
    }

    try {
      const response = await axiosClient.get(`/citizen/requests/${requestId}/status-history`);
      setHistoriesByRequest((previous) => ({
        ...previous,
        [requestId]: response.data
      }));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không tải được lịch sử trạng thái');
    }
  };

  const openComplaintForm = (requestId) => {
    setComplaintForm((previous) => ({
      ...previous,
      requestId: String(requestId)
    }));
    setActiveTab('COMPLAINTS');
  };

  const handleSubmitComplaint = async (event) => {
    event.preventDefault();
    setSubmittingComplaint(true);
    setError('');

    try {
      await axiosClient.post('/citizen/complaints', {
        requestId: Number(complaintForm.requestId),
        title: complaintForm.title,
        content: complaintForm.content
      });

      setComplaintForm({
        requestId: '',
        title: '',
        content: ''
      });
      await refreshDashboard();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không thể gửi khiếu nại');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const reportOptions = reports.map((report) => ({
    value: String(report.id),
    label: `#${report.id} - ${formatWasteType(report.wasteType)} - ${formatStatus(report.status)}`
  }));

  const contentTitle = {
    MY_REPORTS: 'Báo cáo của tôi',
    CREATE_NEW: 'Tạo yêu cầu thu gom',
    POINTS: 'Điểm thưởng',
    LEADERBOARD: 'Bảng xếp hạng người dân',
    COMPLAINTS: 'Khiếu nại'
  }[activeTab];

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @media (max-width: 1024px) {
            .sidebar {
              width: 80px !important;
              padding: 24px 8px !important;
            }
            .sidebar-text {
               display: none;
             }
            .sidebar-user-info {
              display: none !important;
            }
          }
          @media (max-width: 768px) {
            .dashboard-container {
              flex-direction: column !important;
            }
            .sidebar {
              width: 100% !important;
              height: auto !important;
              border-right: none !important;
              border-bottom: 1px solid #1f1f1f !important;
              flex-direction: row !important;
              padding: 12px !important;
              overflow-x: auto;
            }
            .sidebar nav {
              flex: none !important;
            }
            .sidebar ul {
              flex-direction: row !important;
              gap: 8px !important;
            }
            .sidebar-logo {
              margin-bottom: 0 !important;
              margin-right: 20px;
            }
            .main-content {
              padding: 20px !important;
            }
            .summary-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
          @media (max-width: 480px) {
            .summary-grid {
              grid-template-columns: 1fr !important;
            }
            .form-step-container {
               padding: 24px !important;
             }
             .location-grid {
               grid-template-columns: 1fr !important;
             }
          }
        `}
      </style>
      <div
        className="sidebar"
        style={{
          width: '260px',
          background: '#0a0a0a',
          borderRight: '1px solid #1f1f1f',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          transition: 'all 0.3s ease'
        }}
      >
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ background: '#22c55e', padding: '8px', borderRadius: '10px' }}>
            <Leaf size={24} color="black" fill="black" />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>EcoCollect</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Người dân</div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                {...item}
                active={activeTab === item.id}
                onClick={setActiveTab}
              />
            ))}
          </ul>
        </nav>

        <div className="sidebar-user-info" style={{ marginTop: 'auto', borderTop: '1px solid #1f1f1f', paddingTop: '24px' }}>
          <div style={{ padding: '0 16px 16px', color: '#888', fontSize: '13px' }}>
            <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>{summary?.fullName || user?.email || 'Người dùng'}</div>
            <div>{summary?.email || user?.username || ''}</div>
            <div>{summary?.city || 'Chưa cập nhật khu vực'}</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              cursor: 'pointer',
              color: '#888',
              fontSize: '14px'
            }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </div>
        </div>
      </div>

      <div className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px' }}>{contentTitle}</h1>
            <div style={{ color: '#888', marginTop: '8px', fontSize: '14px' }}>
              {resolvedUserId ? `Mã người dùng #${resolvedUserId}` : 'Đang tải thông tin người dùng'}
            </div>
          </div>
          <button
            onClick={refreshDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: '1px solid #22c55e',
              color: '#22c55e',
              padding: '10px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <RefreshCcw size={16} />
            Làm mới dữ liệu
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#3b1212',
              border: '1px solid #7f1d1d',
              borderRadius: '12px',
              padding: '14px 16px',
              color: '#ef4444',
              fontSize: '14px',
              marginBottom: '24px'
            }}
          >
            {error}
          </div>
        )}

        <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <SummaryCard label="Tổng báo cáo" value={summary?.totalRequests ?? reports.length} accent="#22c55e" />
          <SummaryCard label="Điểm tích lũy" value={summary?.totalPoints ?? 0} accent="#fbbf24" />
          <SummaryCard label="Khiếu nại đang mở" value={summary?.openComplaints ?? complaints.filter((item) => item.status === 'OPEN').length} accent="#f87171" />
          <SummaryCard label="Vị trí" value={summary?.city || 'Chưa cập nhật'} accent="#60a5fa" />
        </div>

        {loading ? (
          <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '18px', padding: '40px', color: '#888' }}>
            Đang tải dữ liệu người dân...
          </div>
        ) : null}

        {!loading && activeTab === 'MY_REPORTS' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {reports.length === 0 ? (
              <div
                style={{
                  minHeight: '220px',
                  background: '#111',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  border: '1px solid #1f1f1f'
                }}
              >
                <Mail size={32} style={{ marginBottom: '16px' }} />
                <span>Chưa có báo cáo nào. Hãy tạo yêu cầu thu gom mới.</span>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} style={{ background: '#111', borderRadius: '18px', border: '1px solid #1f1f1f', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '18px' }}>Yêu cầu #{report.id}</span>
                        <span style={getBadgeStyle(report.status)}>{formatStatus(report.status)}</span>
                      </div>
                      <div style={{ color: '#d1d5db' }}>{formatWasteType(report.wasteType)}</div>
                      <div style={{ color: '#888', fontSize: '14px' }}>{report.description || 'Không có mô tả thêm'}</div>
                      <div style={{ color: '#666', fontSize: '13px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>{formatDateTime(report.createdAt)}</span>
                        {report.enterpriseId ? <span>Đơn vị xử lý #{report.enterpriseId}</span> : null}
                        {report.collectorId ? <span>Nhân viên #{report.collectorId}</span> : null}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleHistory(report.id)}
                        style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer' }}
                      >
                        {expandedRequestId === report.id ? 'Ẩn lịch sử' : 'Xem lịch sử'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openComplaintForm(report.id)}
                        style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontWeight: '700' }}
                      >
                        Khiếu nại
                      </button>
                    </div>
                  </div>

                  {report.photoUrl ? (
                    <div style={{ marginTop: '16px' }}>
                      <img
                        src={report.photoUrl}
                        alt={`report-${report.id}`}
                        style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '14px', border: '1px solid #1f1f1f' }}
                      />
                    </div>
                  ) : null}

                  {expandedRequestId === report.id && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1f1f1f', display: 'grid', gap: '12px' }}>
                      {(historiesByRequest[report.id] || []).length === 0 ? (
                        <div style={{ color: '#888', fontSize: '14px' }}>Chưa có lịch sử thay đổi trạng thái.</div>
                      ) : (
                        historiesByRequest[report.id].map((history, index) => (
                          <div key={`${report.id}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ color: '#fff', fontWeight: '600' }}>{formatStatus(history.toStatus)}</div>
                              <div style={{ color: '#888', fontSize: '13px' }}>
                                {history.changedByName ? `Cập nhật bởi ${history.changedByName}` : 'Hệ thống cập nhật'}
                              </div>
                            </div>
                            <div style={{ color: '#666', fontSize: '13px' }}>{formatDateTime(history.changedAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'CREATE_NEW' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Progress Bar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '48px', 
              position: 'relative', 
              padding: '0 40px' 
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '20px', 
                left: '60px', 
                right: '60px', 
                height: '4px', 
                background: '#1a1a1a', 
                borderRadius: '2px',
                zIndex: 0 
              }}>
                <div style={{ 
                  width: `${((formStep - 1) / 2) * 100}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #22c55e, #4ade80)', 
                  borderRadius: '2px',
                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                }}></div>
              </div>
              
              {[
                { step: 1, label: 'Hình ảnh', icon: <Camera size={18} /> },
                { step: 2, label: 'Vị trí', icon: <MapPin size={18} /> },
                { step: 3, label: 'Hoàn tất', icon: <CheckCircle size={18} /> }
              ].map((item) => (
                <div key={item.step} style={{ 
                  position: 'relative', 
                  zIndex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '12px' 
                }}>
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '14px', 
                    background: formStep >= item.step ? '#22c55e' : '#111', 
                    color: formStep >= item.step ? '#000' : '#444',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: formStep >= item.step ? 'none' : '2px solid #1f1f1f',
                    transform: formStep === item.step ? 'scale(1.1) rotate(0deg)' : 'scale(1)',
                    boxShadow: formStep === item.step ? '0 0 20px rgba(34, 197, 94, 0.3)' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}>
                    {formStep > item.step ? <CheckCircle size={22} /> : item.icon}
                  </div>
                  <span style={{ 
                    fontSize: '13px', 
                    color: formStep >= item.step ? '#fff' : '#444', 
                    fontWeight: formStep >= item.step ? '700' : '500',
                    transition: 'all 0.3s ease'
                  }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateReport} style={{ display: 'grid', gap: '24px' }}>
              {/* Step 1: AI Analysis & Image */}
              {formStep === 1 && (
                <div className="form-step-container" style={{ 
                  animation: 'fadeIn 0.5s ease-out',
                  background: 'linear-gradient(165deg, #111 0%, #0a0a0a 100%)', 
                  borderRadius: '28px', 
                  padding: '36px', 
                  border: '1px solid #1f1f1f',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '12px' }}>
                        <BrainCircuit size={28} color="#22c55e" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#fff' }}>AI Phân tích rác thải</h3>
                        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Sử dụng trí tuệ nhân tạo để tự động nhận diện</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '28px' }}>
                    {/* Upload Image Area */}
                    {!uploadedAiImage ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.background = '#0a150e'; }}
                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#1d3521'; e.currentTarget.style.background = '#050505'; }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            const event = { target: { files: [file] } };
                            handleAiImageChange(event);
                          }
                        }}
                        style={{
                          background: '#050505',
                          border: '2px dashed #1d3521',
                          borderRadius: '24px',
                          padding: '60px 20px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAiImageChange}
                          style={{ display: 'none' }}
                        />
                        <div style={{ 
                          width: '80px', 
                          height: '80px', 
                          borderRadius: '24px', 
                          background: 'rgba(34, 197, 94, 0.1)', 
                          color: '#22c55e', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          margin: '0 auto 24px',
                          transform: 'rotate(-5deg)',
                          transition: 'all 0.3s ease'
                        }}>
                          <Upload size={36} />
                        </div>
                        <div style={{ color: '#fff', fontWeight: '800', fontSize: '20px', marginBottom: '10px' }}>Tải ảnh rác thải lên</div>
                        <div style={{ color: '#666', fontSize: '15px', maxWidth: '300px', margin: '0 auto' }}>Kéo thả ảnh vào đây hoặc nhấn để chọn file từ thiết bị</div>
                      </div>
                    ) : (
                      <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid #1f1f1f', boxShadow: '0 15px 40px rgba(0,0,0,0.5)' }}>
                        <img 
                          src={uploadedAiImage.dataUrl} 
                          alt="ai-upload" 
                          style={{ width: '100%', maxHeight: '450px', objectFit: 'cover', display: 'block' }} 
                        />
                        <div style={{ 
                          position: 'absolute', 
                          top: '20px', 
                          right: '20px', 
                          display: 'flex', 
                          gap: '10px' 
                        }}>
                          <button
                            type="button"
                            onClick={clearUploadedAiImage}
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.95)', 
                              backdropFilter: 'blur(10px)',
                              border: 'none', 
                              color: '#fff', 
                              padding: '12px', 
                              borderRadius: '14px', 
                              cursor: 'pointer',
                              boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <X size={22} />
                          </button>
                        </div>
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          padding: '30px 20px 20px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          Đã chọn: {uploadedAiImage.file.name}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} color="#22c55e" />
                        <label style={{ color: '#888', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Mô tả chi tiết</label>
                      </div>
                      <textarea
                        value={newReport.description}
                        onChange={(event) => setNewReport((previous) => ({ ...previous, description: event.target.value }))}
                        placeholder="Mô tả cụ thể về rác thải, khối lượng hoặc tình trạng... (VD: 3 bao tải rác xây dựng tràn ra vỉa hè)"
                        style={{ 
                          width: '100%', 
                          background: '#050505', 
                          border: '1px solid #1f1f1f', 
                          color: '#fff', 
                          padding: '20px', 
                          borderRadius: '20px', 
                          minHeight: '140px',
                          outline: 'none',
                          fontSize: '16px',
                          lineHeight: '1.6',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => { 
                          e.target.style.borderColor = '#22c55e'; 
                          e.target.style.background = '#0a0a0a';
                          e.target.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.1)'; 
                        }}
                        onBlur={(e) => { 
                          e.target.style.borderColor = '#1f1f1f'; 
                          e.target.style.background = '#050505';
                          e.target.style.boxShadow = 'none'; 
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <button
                        type="button"
                        onClick={handleAIClassify}
                        disabled={aiLoading || !uploadedAiImage}
                        style={{ 
                          background: aiLoading ? '#1a1a1a' : (uploadedAiImage ? '#22c55e' : '#1a1a1a'), 
                          color: aiLoading ? '#444' : (uploadedAiImage ? '#000' : '#444'), 
                          border: 'none', 
                          padding: '20px 30px', 
                          borderRadius: '20px', 
                          fontWeight: '900', 
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          cursor: (aiLoading || !uploadedAiImage) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: (uploadedAiImage && !aiLoading) ? '0 10px 25px rgba(34, 197, 94, 0.3)' : 'none'
                        }}
                        onMouseEnter={(e) => { if(!aiLoading && uploadedAiImage) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(34, 197, 94, 0.4)'; } }}
                        onMouseLeave={(e) => { if(!aiLoading && uploadedAiImage) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(34, 197, 94, 0.3)'; } }}
                      >
                        {aiLoading ? <RefreshCcw size={24} className="animate-spin" /> : <BrainCircuit size={24} />}
                        {aiLoading ? 'Đang phân tích...' : 'Phân tích loại rác ngay'}
                      </button>

                      {aiResult && (
                        <div style={{ 
                          background: 'rgba(34, 197, 94, 0.05)', 
                          border: '1px solid rgba(34, 197, 94, 0.2)', 
                          borderRadius: '24px', 
                          padding: '28px',
                          animation: 'slideUp 0.5s ease-out'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ background: '#22c55e', color: '#000', padding: '8px', borderRadius: '10px' }}>
                                <CheckCircle size={20} />
                              </div>
                              <div>
                                <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Kết quả dự đoán</div>
                                <div style={{ color: '#22c55e', fontWeight: '900', fontSize: '20px' }}>{formatWasteType(aiResult.wasteType)}</div>
                              </div>
                            </div>
                            <div style={{ 
                              background: '#10331b', 
                              color: '#22c55e', 
                              padding: '8px 16px', 
                              borderRadius: '12px', 
                              fontSize: '14px', 
                              fontWeight: '800',
                              border: '1px solid rgba(34, 197, 94, 0.2)'
                            }}>
                              Độ tin cậy: {Math.round((parseFloat(aiResult.confidence) || 0) * 100)}%
                            </div>
                          </div>
                          <div style={{ 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '16px', 
                            borderRadius: '16px', 
                            color: '#d1d5db', 
                            fontSize: '15px', 
                            lineHeight: '1.6',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}>
                            {aiResult.explanation}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        disabled={!uploadedAiImage}
                        style={{
                          background: uploadedAiImage ? '#1a1a1a' : '#0a0a0a',
                          color: uploadedAiImage ? '#fff' : '#333',
                          border: '1px solid #333',
                          borderRadius: '16px',
                          padding: '16px 32px',
                          fontWeight: '700',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: uploadedAiImage ? 'pointer' : 'not-allowed',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { if(uploadedAiImage) { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.color = '#22c55e'; } }}
                        onMouseLeave={(e) => { if(uploadedAiImage) { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#fff'; } }}
                      >
                        Tiếp theo: Vị trí
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location & Details */}
              {formStep === 2 && (
                <div className="form-step-container" style={{ 
                  animation: 'fadeIn 0.5s ease-out',
                  background: 'linear-gradient(165deg, #111 0%, #0a0a0a 100%)', 
                  borderRadius: '28px', 
                  padding: '36px', 
                  border: '1px solid #1f1f1f',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                  display: 'grid', 
                  gap: '32px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '12px' }}>
                      <MapPin size={28} color="#22c55e" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#fff' }}>Thông tin địa điểm</h3>
                      <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Cung cấp vị trí chính xác để nhân viên đến thu gom</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '32px' }}>
                    {/* Waste Type Selection */}
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <label style={{ color: '#888', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Loại rác thải</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={newReport.wasteType}
                          onChange={(event) => setNewReport((previous) => ({ ...previous, wasteType: event.target.value }))}
                          style={{
                            width: '100%',
                            background: '#050505',
                            border: '1px solid #1f1f1f',
                            color: '#fff',
                            padding: '20px',
                            borderRadius: '20px',
                            appearance: 'none',
                            outline: 'none',
                            fontSize: '16px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#22c55e'; e.target.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#1f1f1f'; e.target.style.boxShadow = 'none'; }}
                        >
                          <option value="ORGANIC">🥬 Hữu cơ (Thức ăn thừa, rau củ...)</option>
                          <option value="RECYCLABLE">♻️ Tái chế (Chai lọ, giấy, kim loại...)</option>
                          <option value="HAZARDOUS">⚠️ Nguy hại (Pin, bóng đèn, hóa chất...)</option>
                          <option value="GENERAL">🗑️ Rác sinh hoạt khác</option>
                          <option value="ELECTRONIC">💻 Điện tử (Máy tính, điện thoại...)</option>
                        </select>
                        <ChevronDown size={20} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* Location Details */}
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ color: '#888', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Vị trí thu gom</label>
                        <button 
                          type="button" 
                          onClick={getCurrentLocation}
                          style={{ 
                            background: 'rgba(34, 197, 94, 0.1)', 
                            color: '#22c55e', 
                            border: '1px solid rgba(34, 197, 94, 0.2)', 
                            padding: '10px 18px', 
                            borderRadius: '14px', 
                            fontSize: '13px', 
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          <MapPin size={16} />
                          Lấy vị trí hiện tại
                        </button>
                      </div>

                      <div className="location-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            placeholder="Vĩ độ (Latitude)"
                            value={newReport.latitude}
                            onChange={(event) => setNewReport((previous) => ({ ...previous, latitude: event.target.value }))}
                            style={{ 
                              width: '100%', 
                              background: '#050505', 
                              border: '1px solid #1f1f1f', 
                              color: '#fff', 
                              padding: '20px', 
                              borderRadius: '20px', 
                              outline: 'none',
                              fontSize: '16px',
                              transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = '#22c55e'; e.target.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.1)'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#1f1f1f'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input
                            placeholder="Kinh độ (Longitude)"
                            value={newReport.longitude}
                            onChange={(event) => setNewReport((previous) => ({ ...previous, longitude: event.target.value }))}
                            style={{ 
                              width: '100%', 
                              background: '#050505', 
                              border: '1px solid #1f1f1f', 
                              color: '#fff', 
                              padding: '20px', 
                              borderRadius: '20px', 
                              outline: 'none',
                              fontSize: '16px',
                              transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = '#22c55e'; e.target.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.1)'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#1f1f1f'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <textarea
                          value={newReport.addressText}
                          onChange={(event) => setNewReport((previous) => ({ ...previous, addressText: event.target.value }))}
                          placeholder="Nhập địa chỉ cụ thể hoặc mô tả điểm đánh dấu (VD: Đầu ngõ 123, cạnh cột điện...)"
                          style={{ 
                            width: '100%', 
                            background: '#050505', 
                            border: '1px solid #1f1f1f', 
                            color: '#fff', 
                            padding: '20px', 
                            borderRadius: '20px', 
                            outline: 'none', 
                            fontSize: '16px',
                            minHeight: '100px',
                            lineHeight: '1.6',
                            transition: 'all 0.3s ease'
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#22c55e'; e.target.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#1f1f1f'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: '#888',
                        border: '1px solid #333',
                        borderRadius: '20px',
                        padding: '18px 24px',
                        fontWeight: '700',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
                    >
                      <ArrowLeft size={20} />
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep(3)}
                      style={{
                        flex: 2,
                        background: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid #333',
                        borderRadius: '20px',
                        padding: '18px 32px',
                        fontWeight: '800',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.color = '#22c55e'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      Kiểm tra tóm tắt
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {formStep === 3 && (
                <div className="form-step-container" style={{ 
                  animation: 'fadeIn 0.5s ease-out',
                  background: 'linear-gradient(165deg, #111 0%, #0a0a0a 100%)', 
                  borderRadius: '28px', 
                  padding: '36px', 
                  border: '1px solid #1f1f1f',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                  display: 'grid', 
                  gap: '32px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '12px' }}>
                      <CheckCircle size={28} color="#22c55e" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#fff' }}>Xác nhận thông tin</h3>
                      <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Vui lòng kiểm tra kỹ trước khi gửi yêu cầu</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '24px' }}>
                    <div style={{ 
                      background: '#050505', 
                      borderRadius: '24px', 
                      padding: '28px', 
                      border: '1px solid #1f1f1f',
                      display: 'grid',
                      gap: '24px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Loại rác thải</div>
                          <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            width: 'fit-content'
                          }}>
                            {newReport.wasteType === 'ORGANIC' && '🥬'}
                            {newReport.wasteType === 'RECYCLABLE' && '♻️'}
                            {newReport.wasteType === 'HAZARDOUS' && '⚠️'}
                            {newReport.wasteType === 'GENERAL' && '🗑️'}
                            {newReport.wasteType === 'ELECTRONIC' && '💻'}
                            {formatWasteType(newReport.wasteType)}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gap: '8px' }}>
                          <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Tọa độ</div>
                          <div style={{ color: '#fff', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={16} color="#666" />
                            {newReport.latitude}, {newReport.longitude}
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '24px', display: 'grid', gap: '24px' }}>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Địa chỉ chi tiết</div>
                          <div style={{ color: '#fff', fontSize: '16px', lineHeight: '1.6', fontWeight: '500' }}>
                            {newReport.addressText || 'Chưa cung cấp địa chỉ cụ thể'}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gap: '8px' }}>
                          <div style={{ color: '#888', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Mô tả bổ sung</div>
                          <div style={{ color: '#aaa', fontSize: '15px', lineHeight: '1.6', fontStyle: newReport.description ? 'normal' : 'italic' }}>
                            {newReport.description || 'Không có mô tả thêm'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(uploadedAiImage || newReport.photoUrl) && (
                      <div style={{ 
                        borderRadius: '24px', 
                        overflow: 'hidden', 
                        border: '1px solid #1f1f1f',
                        position: 'relative',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}>
                        <img 
                          src={uploadedAiImage?.dataUrl || newReport.photoUrl} 
                          alt="preview" 
                          style={{ width: '100%', maxHeight: '250px', objectFit: 'cover' }} 
                        />
                        <div style={{ 
                          position: 'absolute', 
                          top: '16px', 
                          left: '16px', 
                          background: 'rgba(0,0,0,0.6)', 
                          backdropFilter: 'blur(8px)',
                          padding: '8px 14px', 
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          Hình ảnh hiện trường
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                    <button
                      type="submit"
                      disabled={submittingReport}
                      style={{
                        background: '#22c55e',
                        color: '#000',
                        border: 'none',
                        borderRadius: '22px',
                        padding: '22px',
                        fontSize: '18px',
                        fontWeight: '900',
                        cursor: submittingReport ? 'not-allowed' : 'pointer',
                        boxShadow: '0 12px 30px rgba(34, 197, 94, 0.3)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                      }}
                      onMouseEnter={(e) => { 
                        if (!submittingReport) {
                          e.currentTarget.style.transform = 'translateY(-4px)'; 
                          e.currentTarget.style.boxShadow = '0 15px 40px rgba(34, 197, 94, 0.4)';
                          e.currentTarget.style.background = '#2ae06d';
                        }
                      }}
                      onMouseLeave={(e) => { 
                        if (!submittingReport) {
                          e.currentTarget.style.transform = 'translateY(0)'; 
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(34, 197, 94, 0.3)';
                          e.currentTarget.style.background = '#22c55e';
                        }
                      }}
                    >
                      {submittingReport ? (
                        <>
                          <RefreshCcw size={24} className="animate-spin" />
                          Đang xử lý dữ liệu...
                        </>
                      ) : (
                        <>
                          Xác nhận & Gửi yêu cầu ngay
                          <ArrowRight size={22} />
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      style={{
                        background: 'transparent',
                        color: '#666',
                        border: 'none',
                        padding: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '15px',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; }}
                    >
                      <ArrowLeft size={16} />
                      Quay lại chỉnh sửa thông tin
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {!loading && activeTab === 'POINTS' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '18px', padding: '24px' }}>
              <div style={{ color: '#888', marginBottom: '8px' }}>Điểm hiện tại</div>
              <div style={{ color: '#fbbf24', fontSize: '36px', fontWeight: '800' }}>{summary?.totalPoints ?? 0}</div>
            </div>

            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '18px', padding: '24px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Lịch sử cộng điểm</h2>
              {pointHistory.length === 0 ? (
                <div style={{ color: '#888' }}>Bạn chưa có giao dịch điểm nào.</div>
              ) : (
                <div style={{ display: 'grid', gap: '14px' }}>
                  {pointHistory.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', paddingBottom: '14px', borderBottom: '1px solid #1f1f1f' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '600' }}>{item.reason || 'Cộng điểm cho hoạt động thu gom'}</div>
                        <div style={{ color: '#888', fontSize: '13px' }}>
                          {item.requestId ? `Yêu cầu #${item.requestId}` : 'Không gắn với yêu cầu cụ thể'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#22c55e', fontWeight: '700' }}>+{item.points}</div>
                        <div style={{ color: '#666', fontSize: '13px' }}>{formatDateTime(item.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === 'LEADERBOARD' && (
          <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '18px', padding: '24px', display: 'grid', gap: '14px' }}>
            {leaderboard.length === 0 ? (
              <div style={{ color: '#888' }}>Chưa có dữ liệu bảng xếp hạng.</div>
            ) : (
              leaderboard.map((item) => {
                const isCurrentUser = item.userId === user?.id;
                return (
                  <div
                    key={item.userId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap',
                      padding: '16px',
                      borderRadius: '14px',
                      border: isCurrentUser ? '1px solid #22c55e' : '1px solid #1f1f1f',
                      background: isCurrentUser ? '#0f1f14' : '#0a0a0a'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '999px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontWeight: '700' }}>
                        #{item.rank}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700' }}>{item.fullName}</div>
                        <div style={{ color: '#888', fontSize: '13px' }}>{item.city || 'Chưa cập nhật khu vực'}</div>
                      </div>
                    </div>
                    <div style={{ color: '#22c55e', fontWeight: '800', fontSize: '22px' }}>{item.totalPoints}</div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {!loading && activeTab === 'COMPLAINTS' && (
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)' }}>
            <form onSubmit={handleSubmitComplaint} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '18px', padding: '24px', display: 'grid', gap: '16px', alignSelf: 'start' }}>
              <h2 style={{ margin: 0 }}>Tạo khiếu nại</h2>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Chọn yêu cầu</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={complaintForm.requestId}
                    onChange={(event) => setComplaintForm((previous) => ({ ...previous, requestId: event.target.value }))}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px', appearance: 'none' }}
                    required
                  >
                    <option value="">Chọn yêu cầu để khiếu nại</option>
                    {reportOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Tiêu đề</label>
                <input
                  value={complaintForm.title}
                  onChange={(event) => setComplaintForm((previous) => ({ ...previous, title: event.target.value }))}
                  placeholder="Ví dụ: Nhân viên đến muộn"
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Nội dung</label>
                <textarea
                  value={complaintForm.content}
                  onChange={(event) => setComplaintForm((previous) => ({ ...previous, content: event.target.value }))}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải"
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px', minHeight: '140px' }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingComplaint}
                style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '12px', padding: '14px 16px', fontWeight: '700', cursor: 'pointer' }}
              >
                {submittingComplaint ? 'Đang gửi...' : 'Gửi khiếu nại'}
              </button>
            </form>

            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '18px', padding: '24px', display: 'grid', gap: '16px' }}>
              <h2 style={{ margin: 0 }}>Danh sách khiếu nại</h2>
              {complaints.length === 0 ? (
                <div style={{ color: '#888' }}>Bạn chưa gửi khiếu nại nào.</div>
              ) : (
                complaints.map((complaint) => (
                  <div key={complaint.id} style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '18px', display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: '700' }}>{complaint.title}</div>
                        <div style={{ color: '#888', fontSize: '13px' }}>
                          Yêu cầu #{complaint.requestId} • {complaint.requestStatus ? formatStatus(complaint.requestStatus) : 'Chưa có trạng thái'}
                        </div>
                      </div>
                      <span style={getBadgeStyle(complaint.status)}>{formatStatus(complaint.status)}</span>
                    </div>
                    <div style={{ color: '#d1d5db', lineHeight: 1.6 }}>{complaint.content}</div>
                    {complaint.resolution ? (
                      <div style={{ background: '#101a11', border: '1px solid #1d3521', borderRadius: '12px', padding: '12px 14px', color: '#9ae6b4' }}>
                        Phản hồi: {complaint.resolution}
                      </div>
                    ) : null}
                    <div style={{ color: '#666', fontSize: '13px' }}>
                      Gửi lúc {formatDateTime(complaint.createdAt)}
                      {complaint.resolvedAt ? ` • Xử lý lúc ${formatDateTime(complaint.resolvedAt)}` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
