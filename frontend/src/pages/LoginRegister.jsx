import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

export default function LoginRegister() {
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        area: '',
        role: 'CITIZEN',
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const result = await login({ 
                    username: formData.email,
                    password: formData.password 
                });
                if (result.success) {
                    navigate(result.redirectTo);
                } else {
                    setError(result.message);
                }
            } else {
                const response = await authApi.register({
                    fullName: formData.fullName,
                    phone: formData.phoneNumber,
                    city: formData.area,
                    role: formData.role,
                    email: formData.email,
                    password: formData.password,
                    username: formData.email
                });
                if (response.data) {
                    setIsLogin(true);
                    setError(null);
                    alert("Đăng ký thành công! Vui lòng đăng nhập.");
                }
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to fetch");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#fff',
        fontSize: '14px',
        marginTop: '8px',
        outline: 'none',
        transition: 'border-color 0.2s'
    };

    const labelStyle = {
        color: '#888',
        fontSize: '14px',
        fontWeight: '500'
    };

    const formGroupStyle = {
        marginBottom: '16px'
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#0a0a0a', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{ 
                width: '100%', 
                maxWidth: '440px', 
                backgroundColor: '#111', 
                borderRadius: '24px', 
                padding: '32px',
                border: '1px solid #1f1f1f'
            }}>
                {/* Toggle Buttons */}
                <div style={{ 
                    display: 'flex', 
                    backgroundColor: '#1a1a1a', 
                    borderRadius: '12px', 
                    padding: '4px',
                    marginBottom: '32px'
                }}>
                    <button 
                        onClick={() => setIsLogin(true)}
                        style={{ 
                            flex: 1, 
                            padding: '10px', 
                            borderRadius: '8px', 
                            border: 'none',
                            backgroundColor: isLogin ? '#262626' : 'transparent',
                            color: isLogin ? '#22c55e' : '#666',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Đăng nhập
                    </button>
                    <button 
                        onClick={() => setIsLogin(false)}
                        style={{ 
                            flex: 1, 
                            padding: '10px', 
                            borderRadius: '8px', 
                            border: 'none',
                            backgroundColor: !isLogin ? '#262626' : 'transparent',
                            color: !isLogin ? '#22c55e' : '#666',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Đăng ký
                    </button>
                </div>

                {error && (
                    <div style={{ 
                        backgroundColor: '#3b1212', 
                        border: '1px solid #7f1d1d', 
                        borderRadius: '8px', 
                        padding: '12px 16px', 
                        color: '#ef4444', 
                        fontSize: '14px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Họ tên</label>
                                <input 
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Nguyễn Văn A" 
                                    style={inputStyle} 
                                    required
                                />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>SĐT</label>
                                <input 
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="0901234567" 
                                    style={inputStyle} 
                                    required
                                />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Khu vực / Thành phố</label>
                                <input 
                                    name="area"
                                    value={formData.area}
                                    onChange={handleInputChange}
                                    placeholder="VD: Hà Nội, TP.HCM..." 
                                    style={inputStyle} 
                                    required
                                />
                            </div>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Vai trò</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ 
                                        position: 'absolute', 
                                        left: '16px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        color: '#8b5cf6',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <User size={18} fill="currentColor" />
                                    </div>
                                    <select 
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        style={{ 
                                            ...inputStyle, 
                                            paddingLeft: '44px',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="CITIZEN">Người dân</option>
                                        <option value="ENTERPRISE">Doanh nghiệp</option>
                                        <option value="COLLECTOR">Nhân viên thu gom</option>
                                    </select>
                                    <ChevronDown 
                                        size={18} 
                                        style={{ 
                                            position: 'absolute', 
                                            right: '16px', 
                                            top: '50%', 
                                            transform: 'translateY(-50%)', 
                                            color: '#666',
                                            pointerEvents: 'none'
                                        }} 
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Email</label>
                        <input 
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="example@gmail.com" 
                            style={inputStyle} 
                            required
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Mật khẩu</label>
                        <input 
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="••••••" 
                            style={inputStyle} 
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        style={{ 
                            width: '100%', 
                            backgroundColor: '#22c55e', 
                            color: '#000', 
                            border: 'none', 
                            borderRadius: '12px', 
                            padding: '14px', 
                            fontSize: '16px', 
                            fontWeight: '700', 
                            marginTop: '24px',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', color: '#666', fontSize: '14px' }}>
                    {isLogin ? (
                        <p>Chưa có tài khoản? <span onClick={() => setIsLogin(false)} style={{ color: '#22c55e', cursor: 'pointer', fontWeight: '600' }}>Đăng ký ngay</span></p>
                    ) : (
                        <p>Đã có tài khoản? <span onClick={() => setIsLogin(true)} style={{ color: '#22c55e', cursor: 'pointer', fontWeight: '600' }}>Đăng nhập</span></p>
                    )}
                </div>
            </div>
        </div>
    );
}
