import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  Camera,
  ChevronDown,
  FileText,
  Leaf,
  LogOut,
  Mail,
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
    <span style={{ fontSize: '14px' }}>{label}</span>
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
  const fileInputRef = useRef(null);

  const [newReport, setNewReport] = useState({
    wasteType: 'ORGANIC',
    latitude: '10.7769',
    longitude: '106.7009',
    addressText: '123 Nguyễn Huệ, Q.1',
    description: '',
    photoUrl: ''
  });

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

    try {
      await axiosClient.post('/requests', {
        wasteType: newReport.wasteType,
        latitude: newReport.latitude,
        longitude: newReport.longitude,
        addressText: newReport.addressText,
        description: newReport.description,
        photoUrl: newReport.photoUrl
      });

      setNewReport({
        wasteType: 'ORGANIC',
        latitude: '10.7769',
        longitude: '106.7009',
        addressText: '',
        description: '',
        photoUrl: ''
      });
      setAiResult(null);
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
        dataUrl: reader.result
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div
        style={{
          width: '260px',
          background: '#0a0a0a',
          borderRight: '1px solid #1f1f1f',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
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

        <div style={{ marginTop: 'auto', borderTop: '1px solid #1f1f1f', paddingTop: '24px' }}>
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
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
          <div style={{ maxWidth: '760px' }}>
            <form onSubmit={handleCreateReport} style={{ display: 'grid', gap: '24px' }}>
              <div style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1f1f1f' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#22c55e', fontSize: '14px', fontWeight: '600' }}>
                  <BrainCircuit size={18} />
                  AI hỗ trợ phân loại rác
                </div>
                <div style={{ display: 'grid', gap: '14px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleAiImageChange}
                    style={{ display: 'none' }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: '#0a0a0a',
                      border: '1px dashed #22c55e50',
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#10331b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                        <Upload size={18} />
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '600' }}>
                          {uploadedAiImage?.name || 'Tải ảnh rác lên để AI phân tích'}
                        </div>
                        <div style={{ color: '#888', fontSize: '13px' }}>PNG, JPG, JPEG, WebP tối đa 5MB</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{ background: 'transparent', border: '1px solid #22c55e', color: '#22c55e', padding: '8px 14px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Chọn ảnh
                    </button>
                  </div>
                  {uploadedAiImage ? (
                    <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ color: '#22c55e', fontWeight: '700' }}>Ảnh dùng cho AI phân tích</div>
                        <button
                          type="button"
                          onClick={clearUploadedAiImage}
                          style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <X size={16} />
                          Bỏ ảnh
                        </button>
                      </div>
                      <img src={uploadedAiImage.dataUrl} alt="ai-upload" style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '12px' }} />
                    </div>
                  ) : null}
                  <textarea
                    value={newReport.description}
                    onChange={(event) => setNewReport((previous) => ({ ...previous, description: event.target.value }))}
                    placeholder="Mô tả loại rác, số lượng, tình trạng..."
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px', minHeight: '100px' }}
                  />
                  <input
                    value={newReport.photoUrl}
                    onChange={(event) => setNewReport((previous) => ({ ...previous, photoUrl: event.target.value }))}
                    placeholder="Hoặc dán URL ảnh để lưu cùng báo cáo"
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAIClassify}
                    disabled={aiLoading}
                    style={{ background: 'transparent', border: '1px solid #22c55e', color: '#22c55e', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', width: 'fit-content', cursor: 'pointer' }}
                  >
                    {aiLoading ? 'Đang phân tích...' : 'Gợi ý bằng AI'}
                  </button>
                  {aiResult ? (
                    <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ color: '#22c55e', fontWeight: '700', marginBottom: '8px' }}>
                        Gợi ý: {formatWasteType(aiResult.wasteType)}
                      </div>
                      <div style={{ color: '#d1d5db', fontSize: '14px', marginBottom: '6px' }}>
                        Độ tin cậy: {aiResult.confidence || '0'}
                      </div>
                      <div style={{ color: '#888', fontSize: '14px' }}>{aiResult.explanation}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1f1f1f', display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Loại rác</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={newReport.wasteType}
                      onChange={(event) => setNewReport((previous) => ({ ...previous, wasteType: event.target.value }))}
                      style={{
                        width: '100%',
                        background: '#0a0a0a',
                        border: '1px solid #1f1f1f',
                        color: '#fff',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        appearance: 'none'
                      }}
                    >
                      <option value="ORGANIC">Hữu cơ</option>
                      <option value="RECYCLABLE">Tái chế</option>
                      <option value="HAZARDOUS">Nguy hại</option>
                      <option value="GENERAL">Rác sinh hoạt</option>
                      <option value="ELECTRONIC">Điện tử</option>
                    </select>
                    <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Vĩ độ</label>
                    <input
                      value={newReport.latitude}
                      onChange={(event) => setNewReport((previous) => ({ ...previous, latitude: event.target.value }))}
                      style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Kinh độ</label>
                    <input
                      value={newReport.longitude}
                      onChange={(event) => setNewReport((previous) => ({ ...previous, longitude: event.target.value }))}
                      style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Địa chỉ chi tiết</label>
                  <input
                    value={newReport.addressText}
                    onChange={(event) => setNewReport((previous) => ({ ...previous, addressText: event.target.value }))}
                    placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1"
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px' }}
                  />
                </div>

                {newReport.photoUrl ? (
                  <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', marginBottom: '10px' }}>
                      <Camera size={16} />
                      Ảnh xem trước
                    </div>
                    <img src={newReport.photoUrl} alt="preview" style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '12px' }} />
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submittingReport}
                  style={{
                    background: '#22c55e',
                    color: '#000',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {submittingReport ? 'Đang gửi...' : 'Gửi yêu cầu thu gom'}
                </button>
              </div>
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
