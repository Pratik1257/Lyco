import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const username = searchParams.get('username');

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validation Logic
  const getRequirements = () => [
    { label: '8-100 characters', met: (passwords.newPassword?.length || 0) >= 8 && (passwords.newPassword?.length || 0) <= 100 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(passwords.newPassword || '') },
    { label: 'One number', met: /[0-9]/.test(passwords.newPassword || '') },
    { label: 'One special char (@#$%^&*)', met: /[@#$%^&*]/.test(passwords.newPassword || '') }
  ];

  const requirements = getRequirements();
  const allMet = requirements.every(r => r.met);
  const showRequirements = isFocused || (touched && !allMet);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!username) {
      toast.error('Invalid password reset session. Please try again from the login page.');
      return;
    }

    if (!allMet) {
      toast.error('Please meet all password requirements');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Updating password...');

    try {
      await authApi.resetPassword({
        Username: username,
        NewPassword: passwords.newPassword
      });

      toast.dismiss(loadingToast);
      setSuccess(true);
      toast.success('Password updated successfully!');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.Message || error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
            <CheckCircle2 size={42} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Password Updated!</h2>
          <p className="text-slate-400 text-sm mb-8">Your security credentials have been refreshed. You can now log in with your new password.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdf4 50%, #fafafa 75%, #f5f3ff 100%)' }}>
      <div className="flex w-full max-w-lg min-h-[500px] rounded-2xl shadow-2xl overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-cyan-600 mb-1">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Security Protocol</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Set New Password</h1>
            <p className="text-slate-400 text-[11px]">Updating credentials for account: <span className="text-slate-900 font-bold">{username || 'Unknown'}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-••••••••"
                  placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    setIsFocused(false);
                    setTouched(true);
                  }}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Requirements UI - Animated and Conditional */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showRequirements ? 'max-h-[200px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100 shadow-inner">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Complexity Check</p>
                  {requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 transform transition-transform duration-300 translate-x-0">
                      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${req.met ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] scale-125' : 'bg-slate-300'}`} />
                      <span className={`text-[11px] font-medium transition-colors duration-300 ${req.met ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-•••••••• ${passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword
                      ? 'border-red-200 focus:border-red-400 focus:ring-red-500/5'
                      : 'border-slate-200'
                    }`}
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
                {passwords.confirmPassword && passwords.newPassword === passwords.confirmPassword && (
                  <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in duration-300" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !allMet}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Securing Account...' : (
                <>
                  Update Security Credentials <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {!token && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start">
              <AlertCircle className="text-amber-500 shrink-0" size={18} />
              <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                <span className="font-bold block mb-1">Session Note</span>
                Please ensure you are resetting the password for the correct account listed above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
