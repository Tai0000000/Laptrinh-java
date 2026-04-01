import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';

export default function AICheck() {
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axiosClient.post('/ai/classify', null, {
        params: {
          description: description,
          imageUrl: imageUrl
        }
      });
      setResult(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi phân loại rác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #e2e8f0', 
      borderRadius: '12px', 
      backgroundColor: '#f8fafc',
      marginTop: '20px'
    }}>
      <h3 style={{ marginTop: 0, color: '#1e293b' }}>🔍 Kiểm tra loại rác bằng AI</h3>
      <p style={{ color: '#64748b', fontSize: '14px' }}>Nhập mô tả hoặc dán link ảnh để AI giúp bạn phân loại rác đúng cách.</p>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mô tả rác:</label>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ví dụ: Vỏ chai nhựa, thức ăn thừa..."
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #cbd5e1',
            minHeight: '80px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Link ảnh (tùy chọn):</label>
        <input 
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #cbd5e1'
          }}
        />
      </div>

      <button 
        onClick={handleCheck}
        disabled={loading || (!description && !imageUrl)}
        style={{ 
          backgroundColor: '#2563eb', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontWeight: '600',
          width: '100%'
        }}
      >
        {loading ? 'Đang phân tích...' : 'Phân loại rác'}
      </button>

      {error && (
        <div style={{ color: '#ef4444', marginTop: '15px', fontSize: '14px' }}>{error}</div>
      )}

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          <div style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '16px', marginBottom: '5px' }}>
            Kết quả: {result.wasteType}
          </div>
          <div style={{ fontSize: '14px', color: '#0c4a6e', marginBottom: '5px' }}>
            <strong>Độ tin cậy:</strong> {(parseFloat(result.confidence) * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
            <strong>Giải thích:</strong> {result.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
