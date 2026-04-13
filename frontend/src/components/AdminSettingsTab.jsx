import React, { useState } from 'react';
import { Save, Shield, Bell, Database, Globe, Lock, Trash2, RefreshCw } from 'lucide-react';

export default function AdminSettingsTab() {
    const [settings, setSettings] = useState({
        systemName: "EcoCollect System",
        adminEmail: "admin@ecocollect.com",
        maintenanceMode: false,
        allowNewRegistrations: true,
        pointExchangeRate: 1000, 
        aiAutoClassification: true,
        notificationEnabled: true
    });

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        alert("✅ Đã lưu cấu hình hệ thống thành công!");
    };

    return (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', color: '#fff' }}>
            {}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Cài đặt hệ thống</h1>
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>Cấu hình các tham số vận hành toàn cục</p>
                </div>
                <button 
                    onClick={handleSave}
                    style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                    <Save size={18} />
                    <span>Lưu thay đổi</span>
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                {}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {}
                    <section style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Globe size={20} color="#22c55e" />
                            Cấu hình chung
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', color: '#888' }}>Tên hệ thống</label>
                                <input 
                                    value={settings.systemName}
                                    onChange={(e) => handleChange('systemName', e.target.value)}
                                    style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '12px', color: '#fff' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', color: '#888' }}>Email quản trị</label>
                                <input 
                                    value={settings.adminEmail}
                                    onChange={(e) => handleChange('adminEmail', e.target.value)}
                                    style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '12px', color: '#fff' }}
                                />
                            </div>
                        </div>
                    </section>

                    {}
                    <section style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Shield size={20} color="#3b82f6" />
                            Vận hành & Bảo mật
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <SettingToggle 
                                label="Chế độ bảo trì" 
                                description="Tạm dừng tất cả các hoạt động của người dùng để bảo trì hệ thống."
                                active={settings.maintenanceMode}
                                onToggle={() => handleToggle('maintenanceMode')}
                            />
                            <SettingToggle 
                                label="Cho phép đăng ký mới" 
                                description="Mở/Khóa tính năng tạo tài khoản mới cho người dân và doanh nghiệp."
                                active={settings.allowNewRegistrations}
                                onToggle={() => handleToggle('allowNewRegistrations')}
                            />
                            <SettingToggle 
                                label="Tự động phân loại rác (AI)" 
                                description="Sử dụng Gemini AI để tự động phân tích ảnh và gợi ý loại rác."
                                active={settings.aiAutoClassification}
                                onToggle={() => handleToggle('aiAutoClassification')}
                            />
                        </div>
                    </section>
                </div>

                {}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: '#111', borderRadius: '24px', padding: '24px', border: '1px solid #1f1f1f' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Database size={18} color="#eab308" />
                            Dữ liệu hệ thống
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <RefreshCw size={16} />
                                Làm mới Cache
                            </button>
                            <button style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444', padding: '12px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                                Xóa Logs cũ (&gt;30 ngày)
                            </button>
                        </div>
                    </div>

                    <div style={{ background: '#22c55e10', borderRadius: '24px', padding: '24px', border: '1px solid #22c55e20' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <Lock size={18} color="#22c55e" />
                            <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: '600' }}>Phiên bản hiện tại</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>v2.4.0-stable</div>
                        <p style={{ margin: '8px 0 0', color: '#666', fontSize: '12px' }}>Cập nhật lần cuối: 2 giờ trước</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingToggle({ label, description, active, onToggle }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid #222' }}>
            <div style={{ flex: 1, paddingRight: '20px' }}>
                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{description}</div>
            </div>
            <div 
                onClick={onToggle}
                style={{ 
                    width: '44px', 
                    height: '24px', 
                    background: active ? '#22c55e' : '#333', 
                    borderRadius: '12px', 
                    position: 'relative', 
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                }}
            >
                <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    background: '#fff', 
                    borderRadius: '50%', 
                    position: 'absolute', 
                    top: '3px', 
                    left: active ? '23px' : '3px',
                    transition: 'all 0.3s'
                }} />
            </div>
        </div>
    );
}
