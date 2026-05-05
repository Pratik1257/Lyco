import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Shield, CheckCircle, Mail, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import lycoLogoImg from '../../assets/LycoLogo.png';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

const LycoLogo = () => (
  <div className="flex items-center">
    <img src={lycoLogoImg} alt="Lyco Designs" className="h-12 w-auto object-contain" />
  </div>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetEmail, setShowResetEmail] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleForgotPassword = async () => {
    if (!form.username) {
      setFieldErrors({ username: 'Please enter your username first' });
      toast.error('Enter your username to reset password');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.forgotPassword(form.username);
      setRecoveryEmail(result.email);
      setShowResetEmail(true);
    } catch (error: any) {
      console.error('Forgot password error details:', error.response);
      const data = error.response?.data;
      const status = error.response?.status;
      
      const msg = data?.Message || data?.message || (data?.errors ? Object.values(data.errors).flat()[0] : null);
      
      if (msg) {
        toast.error(msg as string);
      } else if (status === 404) {
        toast.error('Server endpoint not found (404). Please contact support.');
      } else {
        toast.error(`Unexpected Error (${status || 'Unknown'}): Please check console logs.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('lyco_remembered_user');
    if (saved) {
      try {
        const { username, password } = JSON.parse(saved);
        setForm({ username, password });
        setRemember(true);
      } catch (e) {
        // Fallback for old simple username storage
        setForm(p => ({ ...p, username: saved }));
        setRemember(true);
      }
    }
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.username.trim()) errors.username = 'Username is required';
    if (!form.password.trim()) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    const loadingToast = toast.loading('Signing in...');
    try {
      const userData = await authApi.login(form);
      login(userData);
      
      if (remember) {
        localStorage.setItem('lyco_remembered_user', JSON.stringify({
          username: form.username,
          password: form.password
        }));
      } else {
        localStorage.removeItem('lyco_remembered_user');
      }

      toast.dismiss(loadingToast);
      toast.success('Welcome back, ' + userData.fullname);
      navigate('/');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inp = (hasError: boolean) => `w-full pl-10 pr-4 py-2.5 border ${hasError ? 'border-red-400 ring-2 ring-red-400/20' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 bg-white text-gray-800 placeholder:text-gray-400 transition-all`;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdf4 50%, #fafafa 75%, #f5f3ff 100%)' }}>
      <div className="flex w-full max-w-3xl min-h-[550px] rounded-2xl shadow-2xl overflow-hidden bg-white">

        {/* ── Left dark panel ── */}
        <div className="hidden md:flex flex-col justify-between w-[40%] bg-slate-900 p-10 text-white flex-shrink-0">
          <div>
            <LycoLogo />
            <div className="mt-10">
              <h2 className="text-xl font-black leading-tight mb-2 flex items-center gap-2 whitespace-nowrap">
                Welcome back! <span className="text-lg">👋</span>
              </h2>
              <p className="text-slate-400 text-xs">Sign in to your dashboard</p>
            </div>
            <ul className="mt-8 space-y-4">
              {['Secure and reliable platform', 'Manage your business with ease', 'Real-time insights and analytics'].map(t => (
                <li key={t} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle size={16} className="text-cyan-400" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <Shield size={20} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-bold text-xs">Your data is 100% secure</p>
              <p className="text-[10px]">and protected</p>
            </div>
          </div>
        </div>

        {/* ── Right white form panel ── */}
        <div className="flex-1 w-[60%] bg-white p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-2xl font-black text-slate-900 mb-1">Sign In</h1>
            <p className="text-slate-400 text-[11px] mb-6">Enter your credentials to access your account</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Username <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className={inp(!!fieldErrors.username)}
                    placeholder="Username"
                    value={form.username}
                    onChange={e => {
                      setForm(p => ({ ...p, username: e.target.value.replace(/\s/g, '') }));
                      if (fieldErrors.username) setFieldErrors(p => { const n = { ...p }; delete n.username; return n; });
                    }}
                  />
                </div>
                {fieldErrors.username && <p className="text-[11px] font-medium text-red-500 mt-1">{fieldErrors.username}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className={`${inp(!!fieldErrors.password)} pr-10`} type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••" value={form.password}
                    onChange={e => {
                      setForm(p => ({ ...p, password: e.target.value }));
                      if (fieldErrors.password) setFieldErrors(p => { const n = { ...p }; delete n.password; return n; });
                    }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-[11px] font-medium text-red-500 mt-1">{fieldErrors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-cyan-500" />
                  <span className="text-xs text-slate-600">Remember me</span>
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {showResetEmail && (
                <div className="fixed bottom-6 right-6 w-[380px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-right-10 duration-500">
                  <div className="p-4 bg-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center">
                        <Mail size={14} className="text-white" />
                      </div>
                      <span className="text-[11px] font-black text-white uppercase tracking-wider">Simulated Inbox</span>
                    </div>
                    <button onClick={() => setShowResetEmail(false)} className="text-slate-400 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-black text-slate-900 mb-1">Reset Your Password</h3>
                      <p className="text-slate-500 text-[11px] font-bold">To: <span className="text-slate-900">{recoveryEmail}</span></p>
                    </div>
                    
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-6">
                      Hello {form.username},<br/><br/>
                      A password reset was requested for your account. Please click the button below to set a new password. This link will expire in 1 hour.
                    </p>

                    <button 
                      onClick={() => {
                        setShowResetEmail(false);
                        navigate(`/reset-password?username=${form.username}&token=simulated-token-${Date.now()}`);
                      }}
                      className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-100 transition-all mb-6"
                    >
                      Reset Password
                    </button>

                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-[9px] text-slate-400 mb-2 leading-relaxed">
                        If the button above doesn't work, copy and paste this link into your browser:
                      </p>
                      <p className="text-[9px] text-indigo-500 break-all font-mono leading-tight">
                        http://localhost:5173/reset-password?username={form.username}&token=e72851ecefff4930a5864dab8bb13458
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-cyan-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-widest">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-slate-400 font-bold">OR</span></div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an account?{' '}
                  <button onClick={() => navigate('/register')}
                    className="font-bold text-cyan-600 hover:text-cyan-700 transition-colors">
                    Create one
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
