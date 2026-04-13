import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function CollectorTaskTab() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTasks = () => {
        setLoading(true);
        setError(null);

        axiosClient
            .get('/requests/active-tasks')
            .then((res) => {
                setTasks(res.data || []);
            })
            .catch((e) => {
                
                if (e?.response?.status === 404 || e?.response?.status === 400) {
                    setTasks([]);
                } else {
                    setError(e?.response?.data?.message || "Không tải được danh sách nhiệm vụ");
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleStart = (id) => {
        if (!window.confirm("Xác nhận bắt đầu đi thu gom đơn này?")) return;

        axiosClient.post(`/requests/${id}/start`)
            .then(() => {
                alert("Đã bắt đầu thu gom!");
                fetchTasks();
            })
            .catch((e) => alert(e?.response?.data?.message || "Lỗi khi cập nhật"));
    };

    const handleComplete = (id) => {
        const imgUrl = window.prompt("Nhập link ảnh minh chứng rác đã dọn:");
        if (!imgUrl) return;

        axiosClient.post(`/requests/${id}/complete`, { proofImageUrl: imgUrl })
            .then(() => {
                alert("Đã hoàn thành nhiệm vụ!");
                fetchTasks(); 
            })
            .catch((e) => alert(e?.response?.data?.message || "Lỗi khi cập nhật"));
    };

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Nhiệm vụ của tôi</h2>
            {loading && <p>Đang tải danh sách...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Mã đơn</th>
                    <th style={{ padding: '12px' }}>Loại rác</th>
                    <th style={{ padding: '12px' }}>Ngày tạo</th>
                    <th style={{ padding: '12px' }}>Trạng thái</th>
                    <th style={{ padding: '12px' }}>Hành động</th>
                </tr>
                </thead>
                <tbody>
                {tasks.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>#{t.id}</td>
                        <td style={{ padding: '12px' }}>{t.wasteType}</td>
                        <td style={{ padding: '12px' }}>{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                        <td style={{ padding: '12px' }}>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                    background: t.status === 'ASSIGNED' ? '#fff3e0' : (t.status === 'ON_THE_WAY' ? '#e3f2fd' : '#f8f9fa'),
                                    color: t.status === 'ASSIGNED' ? '#ef6c00' : (t.status === 'ON_THE_WAY' ? '#1565c0' : '#666')
                                }}>
                                    {t.status === 'ASSIGNED' ? 'Đã phân công' : (t.status === 'ON_THE_WAY' ? 'Đang thực hiện' : t.status)}
                                </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                            {t.status === 'ASSIGNED' && (
                                <button onClick={() => handleStart(t.id)} style={{ cursor: 'pointer', padding: '5px 10px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px' }}>
                                    Bắt đầu
                                </button>
                            )}
                            {t.status === 'ON_THE_WAY' && (
                                <button onClick={() => handleComplete(t.id)} style={{ cursor: 'pointer', padding: '5px 10px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px' }}>
                                    Hoàn thành
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                {tasks.length === 0 && !loading && (
                    <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>Không có nhiệm vụ nào!</td></tr>
                )}
                </tbody>
            </table>
        </div>
    );
}