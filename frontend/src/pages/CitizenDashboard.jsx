import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Star, 
  Trophy, 
  AlertTriangle,
  LogOut,
  Leaf,
  RefreshCcw,
  Mail,
  Camera,
  MapPin,
  ChevronDown,
  Upload,
  BrainCircuit
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function CitizenDashboard() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('MY_REPORTS');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state for New Report
  const [newReport, setNewReport] = useState({
    wasteType: 'ORGANIC',
    latitude: '10.7769',
    longitude: '106.7009',
    addressText: '123 Nguyễn Huệ, Q.1',
    description: '',
    photoUrl: ''
  });

  const menuItems = [
    { id: 'MY_REPORTS', label: 'Báo cáo của tôi', icon: <FileText size={20} /> },
    { id: 'CREATE_NEW', label: 'Tao mới', icon: <Plus size={20} /> },
    { id: 'POINTS', label: 'Điểm thưởng', icon: <Star size={20} /> },
    { id: 'LEADERBOARD', label: 'Bảng xếp hạng', icon: <Trophy size={20} /> },
    { id: 'COMPLAINTS', label: 'Khiếu nại', icon: <AlertTriangle size={20} /> },
  ];

  const handleCreateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosClient.post('/citizen/requests', {
        ...newReport,
        userId: userId
      });
      alert('Gửi báo cáo thành công!');
      setActiveTab('MY_REPORTS');
      // Refresh reports logic here
    } catch (error) {
      alert('Lỗi khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleAIClassify = async () => {
    // Logic for AI Classification
    alert("Đang gọi AI phân tích rác...");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '12px 16px', 
            cursor: 'pointer', 
            color: '#888',
            fontSize: '14px'
          }} onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        {activeTab === 'MY_REPORTS' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <span style={{ color: '#888', fontSize: '14px' }}>{reports.length} báo cáo</span>
              <button 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'transparent', 
                  border: '1px solid #22c55e', 
                  color: '#22c55e',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <RefreshCcw size={16} />
                Làm mới
              </button>
            </div>

            {reports.length === 0 ? (
              <div style={{ 
                height: '200px', 
                background: '#111', 
                borderRadius: '16px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#666',
                border: '1px solid #1f1f1f'
              }}>
                <Mail size={32} style={{ marginBottom: '16px' }} />
                <span>Chưa có báo cáo nào.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {/* List of reports would go here */}
              </div>
            )}
          </div>
        )}

        {activeTab === 'CREATE_NEW' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <form onSubmit={handleCreateReport} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* AI Assistant Section */}
              <div style={{ background: '#111', borderRadius: '16px', padding: '20px', border: '1px solid #1f1f1f' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#22c55e', fontSize: '14px', fontWeight: '600' }}>
                  <BrainCircuit size={18} />
                  AI Hỗ trợ phân loại rác (tùy chọn)
                </div>
                <div style={{ 
                  background: '#f0fdf410', 
                  border: '2px dashed #22c55e20', 
                  borderRadius: '12px', 
                  padding: '32px', 
                  textAlign: 'center',
                  cursor: 'pointer'
                }} onClick={handleAIClassify}>
                  <Camera size={32} color="#888" style={{ marginBottom: '12px' }} />
                  <div style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>Upload ảnh rác để AI gợi ý loại phân loại</div>
                  <button type="button" style={{ background: 'transparent', border: '1px solid #22c55e', color: '#22c55e', padding: '6px 20px', borderRadius: '8px', fontWeight: '600' }}>
                    Chọn ảnh
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Loại rác</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={newReport.wasteType}
                    onChange={(e) => setNewReport({...newReport, wasteType: e.target.value})}
                    style={{ 
                      width: '100%', 
                      background: '#111', 
                      border: '1px solid #1f1f1f', 
                      color: '#fff', 
                      padding: '12px 16px', 
                      borderRadius: '10px',
                      appearance: 'none'
                    }}
                  >
                    <option value="ORGANIC">🌿 Hữu cơ</option>
                    <option value="RECYCLABLE">♻️ Tái chế</option>
                    <option value="HAZARDOUS">⚠️ Nguy hại</option>
                  </select>
                  <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Vĩ độ</label>
                  <input 
                    value={newReport.latitude}
                    onChange={(e) => setNewReport({...newReport, latitude: e.target.value})}
                    style={{ width: '100%', background: '#111', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Kinh độ</label>
                  <input 
                    value={newReport.longitude}
                    onChange={(e) => setNewReport({...newReport, longitude: e.target.value})}
                    style={{ width: '100%', background: '#111', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Địa chỉ</label>
                <input 
                  value={newReport.addressText}
                  onChange={(e) => setNewReport({...newReport, addressText: e.target.value})}
                  style={{ width: '100%', background: '#111', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>Mô tả</label>
                <textarea 
                  value={newReport.description}
                  onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                  placeholder="Thêm chi tiết..."
                  style={{ width: '100%', background: '#111', border: '1px solid #1f1f1f', color: '#fff', padding: '12px 16px', borderRadius: '10px', minHeight: '100px' }} 
                />
              </div>

              {/* Photo Upload Section */}
              <div>
                <label style={{ display: 'block', color: '#22c55e', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Ảnh rác đính kèm</label>
                <div style={{ 
                  background: '#f0fdf410', 
                  border: '2px dashed #22c55e20', 
                  borderRadius: '12px', 
                  padding: '32px', 
                  textAlign: 'center'
                }}>
                  <Camera size={32} color="#888" style={{ marginBottom: '12px' }} />
                  <div style={{ color: '#888', fontSize: '14px', marginBottom: '4px' }}>Click hoặc kéo thả ảnh vào đây</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>JPG, PNG, WebP — tối đa 5MB</div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{ 
                  background: '#22c55e', 
                  color: '#000', 
                  border: 'none', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                Gửi báo cáo
              </button>
            </form>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {!['MY_REPORTS', 'CREATE_NEW'].includes(activeTab) && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <h2>Đang phát triển tính năng {menuItems.find(m => m.id === activeTab)?.label}</h2>
          </div>
        )}
      </div>
    </div>
  );
}
