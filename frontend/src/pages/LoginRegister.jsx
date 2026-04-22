import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  ChevronDown,
  AlertCircle,
  Leaf
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

export default function LoginRegister() {
    const [isLogin, setIsLogin] = useState(true);
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
                maxWidth: '1100px', 
                backgroundColor: '#111', 
                borderRadius: '32px', 
                display: 'flex', 
                overflow: 'hidden',
                border: '1px solid #1f1f1f',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                minHeight: '650px'
            }}>
                {/* Left Side - Image and Branding */}
                <div style={{ 
                    flex: 1.2, 
                    position: 'relative',
                    display: 'flex'
                }} className="hidden-mobile">
                    <img 
                        src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop" 
                        alt="Waste Management" 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover'
                        }}
                    />
                    <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        padding: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(34,197,94,0.4) 100%)',
                        backdropFilter: 'blur(2px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                                backgroundColor: '#22c55e', 
                                padding: '12px', 
                                borderRadius: '16px',
                                boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
                            }}>
                                <Leaf size={28} color="#000" />
                            </div>
                            <span style={{ 
                                color: '#fff', 
                                fontSize: '28px', 
                                fontWeight: '900',
                                letterSpacing: '-1px'
                            }}>EcoWaste</span>
                        </div>

                        <div style={{ transform: 'translateY(-20px)' }}>
                            <h2 style={{ 
                                color: '#fff', 
                                fontSize: '42px', 
                                fontWeight: '800', 
                                marginBottom: '20px',
                                lineHeight: '1.1',
                                letterSpacing: '-1px'
                            }}>
                                Vì một môi trường <br />
                                <span style={{ 
                                    color: '#22c55e',
                                    textShadow: '0 0 30px rgba(34, 197, 94, 0.5)'
                                }}>Xanh - Sạch - Đẹp</span>
                            </h2>
                            <p style={{ 
                                color: '#aaa', 
                                fontSize: '18px', 
                                lineHeight: '1.6', 
                                maxWidth: '420px',
                                fontWeight: '400'
                            }}>
                                Tham gia cùng chúng tôi để kiến tạo giải pháp quản lý rác thải thông minh và bền vững cho tương lai.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div style={{ color: '#fff' }}>
                                <div style={{ fontSize: '24px', fontWeight: '700' }}>10k+</div>
                                <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Thành viên</div>
                            </div>
                            <div style={{ color: '#fff' }}>
                                <div style={{ fontSize: '24px', fontWeight: '700' }}>50+</div>
                                <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Khu vực</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div style={{ 
                    flex: 1, 
                    padding: '48px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backgroundColor: '#111'
                }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                            {isLogin ? 'Chào mừng trở lại!' : 'Bắt đầu hành trình'}
                        </h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            {isLogin ? 'Vui lòng đăng nhập để tiếp tục quản lý' : 'Đăng ký tài khoản để tham gia bảo vệ môi trường'}
                        </p>
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        backgroundColor: '#1a1a1a', 
                        borderRadius: '14px', 
                        padding: '4px',
                        marginBottom: '32px',
                        border: '1px solid #262626'
                    }}>
                        <button 
                            type="button"
                            onClick={() => setIsLogin(true)}
                            style={{ 
                                flex: 1, 
                                padding: '12px', 
                                borderRadius: '10px', 
                                border: 'none',
                                backgroundColor: isLogin ? '#262626' : 'transparent',
                                color: isLogin ? '#22c55e' : '#666', 
                                fontWeight: '600', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            Đăng nhập
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsLogin(false)}
                            style={{ 
                                flex: 1, 
                                padding: '12px', 
                                borderRadius: '10px', 
                                border: 'none',
                                backgroundColor: !isLogin ? '#262626' : 'transparent',
                                color: !isLogin ? '#22c55e' : '#666',
                                fontWeight: '600',
                                cursor: 'pointer', 
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            Đăng ký
                        </button>
                    </div>

                    {error && (
                        <div style={{ 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.2)', 
                            borderRadius: '12px', 
                            padding: '14px 16px', 
                            color: '#ef4444', 
                            fontSize: '14px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both'
                        }}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form 
                        onSubmit={handleSubmit} 
                        style={{ 
                            maxHeight: '450px', 
                            overflowY: 'auto', 
                            paddingRight: '12px',
                            marginRight: '-12px'
                        }}
                        className="custom-scrollbar"
                    >
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
                                            color: '#22c55e',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            <User size={18} />
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
                                borderRadius: '14px', 
                                padding: '16px', 
                                fontSize: '16px', 
                                fontWeight: '700', 
                                marginTop: '24px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 10px 20px -5px rgba(34, 197, 94, 0.3)'
                            }}
                        >
                            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '32px', color: '#666', fontSize: '14px' }}>
                        {isLogin ? (
                            <p>Chưa có tài khoản? <span onClick={() => setIsLogin(false)} style={{ color: '#22c55e', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>Đăng ký ngay</span></p>
                        ) : (
                            <p>Đã có tài khoản? <span onClick={() => setIsLogin(true)} style={{ color: '#22c55e', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>Đăng nhập</span></p>
                        )}
                    </div>
                </div>
            </div>
            
            <style>
                {`
                    @media (max-width: 768px) {
                        .hidden-mobile {
                            display: none !important;
                        }
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 5px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #333;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #444;
                    }
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                `}
            </style>
        </div>
    );
}
