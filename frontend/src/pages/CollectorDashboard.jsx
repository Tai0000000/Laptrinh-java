import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    CheckCircle2,
    Clock3,
    ClipboardList,
    History,
    Leaf,
    LogOut,
    RefreshCcw,
    Truck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../hooks/useAuth';

export default function CollectorDashboard() {
    const [activeTab, setActiveTab] = useState('TASKS');
    const [tasks, setTasks] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadingTaskId, setUploadingTaskId] = useState(null);
    const [taskCompletingId, setTaskCompletingId] = useState(null);
    const proofInputRef = useRef(null);
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const loadData = async () => {
        setLoading(true);
        setError(null);

        const [tasksResult, historyResult] = await Promise.allSettled([
            axiosClient.get('/requests/active-tasks'),
            axiosClient.get('/requests/history'),
        ]);

        if (tasksResult.status === 'fulfilled') {
            setTasks(tasksResult.value?.data || []);
        } else {
            
        }

        if (historyResult.status === 'fulfilled') {
            setHistory(historyResult.value?.data?.content || []);
        } else {
            
        }

        const isCriticalRejected = (result) => {
            if (result.status !== 'rejected') return false;
            const status = result.reason?.response?.status;
            return status !== 400 && status !== 404;
        };

        const tasksFailedCritically = isCriticalRejected(tasksResult);
        const historyFailedCritically = isCriticalRejected(historyResult);

        
        
        if (tasksFailedCritically && historyFailedCritically) {
            setError(
                tasksResult.reason?.response?.data?.message
                || historyResult.reason?.response?.data?.message
                || 'Không tải được toàn bộ dữ liệu nhân viên',
            );
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const completedThisWeek = useMemo(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return history.filter((item) => {
            if (item?.status !== 'COLLECTED') return false;
            const collectedAt = item?.updatedAt || item?.createdAt;
            if (!collectedAt) return false;
            return new Date(collectedAt) >= sevenDaysAgo;
        }).length;
    }, [history]);

    const totalCollected = useMemo(
        () => history.filter((item) => item?.status === 'COLLECTED').length,
        [history],
    );

    const startTask = async (id) => {
        try {
            await axiosClient.post(`/requests/${id}/start`);
            await loadData();
        } catch (requestError) {
            alert(requestError?.response?.data?.message || 'Không thể bắt đầu nhiệm vụ');
        }
    };

    const openProofUpload = (taskId) => {
        setTaskCompletingId(taskId);
        if (proofInputRef.current) {
            proofInputRef.current.value = '';
            proofInputRef.current.click();
        }
    };

    const handleProofFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !taskCompletingId) return;

        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh hợp lệ.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Ảnh minh chứng tối đa 5MB.');
            return;
        }

        
        const proofImageUrl = URL.createObjectURL(file);
        setUploadingTaskId(taskCompletingId);

        try {
            const response = await axiosClient.post(`/requests/${taskCompletingId}/complete`, { proofImageUrl });
            const completedItem = response?.data;

            
            setTasks((prev) => prev.filter((task) => task.id !== taskCompletingId));
            if (completedItem?.id) {
                setHistory((prev) => [completedItem, ...prev.filter((item) => item.id !== completedItem.id)]);
            }
            setActiveTab('HISTORY');

            
            loadData();
        } catch (requestError) {
            alert(requestError?.response?.data?.message || 'Không thể hoàn thành nhiệm vụ');
        } finally {
            URL.revokeObjectURL(proofImageUrl);
            setUploadingTaskId(null);
            setTaskCompletingId(null);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ width: '260px', background: '#0a0a0a', borderRight: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px', padding: '0 8px' }}>
                    <div style={{ background: '#22c55e', padding: '8px', borderRadius: '10px' }}>
                        <Leaf size={24} color="black" fill="black" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>EcoCollect</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Nhân viên thu gom</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                    <button type="button" onClick={() => setActiveTab('TASKS')} style={menuButtonStyle(activeTab === 'TASKS')}>
                        <ClipboardList size={17} /> Nhiệm vụ hôm nay
                    </button>
                    <button type="button" onClick={() => setActiveTab('HISTORY')} style={menuButtonStyle(activeTab === 'HISTORY')}>
                        <History size={17} /> Lịch sử
                    </button>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #1f1f1f', paddingTop: '18px', display: 'grid', gap: '10px' }}>
                    <button type="button" onClick={loadData} style={menuButtonStyle(false)}>
                        <RefreshCcw size={17} /> Làm mới dữ liệu
                    </button>
                    <button type="button" onClick={() => { logout(); navigate('/login'); }} style={menuButtonStyle(false)}>
                        <LogOut size={17} /> Đăng xuất
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '30px' }}>{user?.fullName || user?.username || 'Nhân viên thu gom'}</h1>
                        <p style={{ margin: '8px 0 0', color: '#888' }}>Quản lý nhiệm vụ thu gom theo thời gian thực</p>
                    </div>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', padding: '14px 16px', borderRadius: '12px' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <StatCard
                        icon={<Clock3 size={18} color="#fb923c" />}
                        title="Đang thực hiện"
                        value={tasks.length}
                        accent="#fb923c"
                    />
                    <StatCard
                        icon={<CheckCircle2 size={18} color="#22c55e" />}
                        title="Hoàn thành (7 ngày)"
                        value={completedThisWeek}
                        accent="#22c55e"
                    />
                    <StatCard
                        icon={<Truck size={18} color="#60a5fa" />}
                        title="Đã thu gom (tổng đơn)"
                        value={totalCollected}
                        accent="#60a5fa"
                    />
                </div>

                {activeTab === 'TASKS' ? (
                    <div style={{ background: '#111', borderRadius: '20px', border: '1px solid #1f1f1f', padding: '20px', display: 'grid', gap: '12px' }}>
                        <input
                            ref={proofInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleProofFileChange}
                            style={{ display: 'none' }}
                        />
                        <h2 style={{ margin: 0, fontSize: '22px' }}>Công việc hôm nay</h2>
                        {loading && <div style={{ color: '#888' }}>Đang tải nhiệm vụ...</div>}
                        {!loading && tasks.length === 0 && <div style={{ color: '#666' }}>Không có nhiệm vụ nào đang hoạt động.</div>}
                        {!loading && tasks.map((task) => (
                            <div key={task.id} style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '14px 16px', display: 'grid', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: '700' }}>Yêu cầu #{task.id} · {task.wasteType}</div>
                                    <span style={taskStatusStyle(task.status)}>
                                        {task.status === 'ASSIGNED' ? 'Đã phân công' : 'Đang thực hiện'}
                                    </span>
                                </div>
                                <div style={{ color: '#888', fontSize: '13px' }}>{task.addressText || 'Chưa có địa chỉ chi tiết'}</div>
                                <div style={{ color: '#666', fontSize: '12px' }}>
                                    {task.createdAt ? new Date(task.createdAt).toLocaleString('vi-VN') : 'Không rõ thời gian'}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {task.status === 'ASSIGNED' && (
                                        <button type="button" onClick={() => startTask(task.id)} style={actionButton('#f97316', '#000')}>
                                            Bắt đầu
                                        </button>
                                    )}
                                    {task.status === 'ON_THE_WAY' && (
                                        <button
                                            type="button"
                                            onClick={() => openProofUpload(task.id)}
                                            disabled={uploadingTaskId === task.id}
                                            style={actionButton('#22c55e', '#000')}
                                        >
                                            {uploadingTaskId === task.id ? 'Đang tải ảnh...' : 'Upload ảnh & Hoàn thành'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: '#111', borderRadius: '20px', border: '1px solid #1f1f1f', padding: '20px', display: 'grid', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '22px' }}>Lịch sử thu gom</h2>
                        {loading && <div style={{ color: '#888' }}>Đang tải lịch sử...</div>}
                        {!loading && history.length === 0 && <div style={{ color: '#666' }}>Chưa có lịch sử nào.</div>}
                        {!loading && history.map((item) => (
                            <div key={item.id} style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '14px 16px', display: 'grid', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: '700' }}>Yêu cầu #{item.id} · {item.wasteType}</div>
                                    <span style={taskStatusStyle(item.status)}>{item.status}</span>
                                </div>
                                <div style={{ color: '#888', fontSize: '13px' }}>{item.addressText || 'Chưa có địa chỉ chi tiết'}</div>
                                <div style={{ color: '#666', fontSize: '12px' }}>
                                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString('vi-VN') : new Date(item.createdAt).toLocaleString('vi-VN')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, title, value, accent }) {
    return (
        <div style={{ background: '#111', borderRadius: '16px', border: `1px solid ${accent}30`, padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>{title}</span>
                {icon}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800' }}>{value}</div>
        </div>
    );
}

const menuButtonStyle = (active) => ({
    background: active ? '#1a1a1a' : 'transparent',
    color: active ? '#22c55e' : '#999',
    border: `1px solid ${active ? '#22c55e33' : '#1f1f1f'}`,
    borderRadius: '10px',
    padding: '11px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontWeight: active ? '700' : '500',
    textAlign: 'left',
});

const taskStatusStyle = (status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '700',
    background: status === 'ASSIGNED' ? '#f9731620' : status === 'ON_THE_WAY' ? '#3b82f620' : '#22c55e20',
    color: status === 'ASSIGNED' ? '#fdba74' : status === 'ON_THE_WAY' ? '#93c5fd' : '#86efac',
});

const actionButton = (background, color) => ({
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    background,
    color,
    fontWeight: '700',
    cursor: 'pointer',
});
