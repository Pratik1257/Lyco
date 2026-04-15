import { useState, useMemo } from 'react';
import { 
  Lock, CheckCircle2, 
  AlertCircle, Loader2, ChevronRight,
  Shield, Key, Eye, EyeOff
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPasswords, setShowPasswords] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation Rules
  const validations = useMemo(() => [
    { id: 'length', text: 'Minimum 8 characters', isValid: newPassword.length >= 8 },
    { id: 'uppercase', text: 'One uppercase character', isValid: /[A-Z]/.test(newPassword) },
    { id: 'lowercase', text: 'One lowercase character', isValid: /[a-z]/.test(newPassword) },
    { id: 'special', text: 'One special character', isValid: /[^A-Za-z0-9]/.test(newPassword) },
    { id: 'number', text: 'One number', isValid: /[0-9]/.test(newPassword) }
  ], [newPassword]);

  const isPasswordValid = useMemo(() => validations.every(v => v.isValid), [validations]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      setIsSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-0 space-y-8 animate-in fade-in duration-700">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs uppercase tracking-widest">
            <Shield size={14} />
            Security Center
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Access Credentials</h2>
        </div>
        
        {isSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 animate-in slide-in-from-right-4">
            <CheckCircle2 size={16} />
            Password verified & updated
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Main Action Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            {/* Form Section */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              
              <div className="space-y-6">
                {/* Field Group: Current */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[13px] font-bold text-gray-700 tracking-tight">Current Password</label>
                    <span className="text-[11px] font-medium text-gray-400">Required</span>
                  </div>
                  <div className="relative group/field transition-all">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-focus-within/field:bg-cyan-50 group-focus-within/field:text-cyan-600 transition-all duration-300">
                      <Lock size={14} />
                    </div>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-14 pr-12 py-4 bg-gray-50/30 border border-gray-200 rounded-[1.25rem] text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500/50 focus:bg-white transition-all font-medium text-gray-800 placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-600 transition-colors p-1 cursor-pointer"
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

                {/* Field Group: New Password */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[13px] font-bold text-gray-700 tracking-tight">New Password</label>
                  </div>
                  <div className="relative group/field transition-all">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-focus-within/field:bg-cyan-50 group-focus-within/field:text-cyan-600 transition-all duration-300">
                      <Key size={14} />
                    </div>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-14 pr-12 py-4 bg-gray-50/30 border border-gray-200 rounded-[1.25rem] text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500/50 focus:bg-white transition-all font-medium text-gray-800 placeholder:text-gray-300"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                       {isPasswordValid && <CheckCircle2 size={16} className="text-emerald-500" />}
                       <button 
                         type="button"
                         onClick={() => setShowPasswords(!showPasswords)}
                         className="text-gray-400 hover:text-cyan-600 transition-colors p-1 cursor-pointer"
                       >
                         {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                    </div>
                  </div>
                </div>

                {/* Field Group: Confirm Password */}
                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                    <label className="text-[13px] font-bold text-gray-700 tracking-tight">Verify New Password</label>
                  </div>
                  <div className="relative group/field transition-all">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-focus-within/field:bg-cyan-50 group-focus-within/field:text-cyan-600 transition-all duration-300">
                      <Lock size={14} />
                    </div>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-14 pr-12 py-4 bg-gray-50/30 border border-gray-200 rounded-[1.25rem] text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500/50 focus:bg-white transition-all font-medium text-gray-800 placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-600 transition-colors p-1"
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-bold leading-relaxed border border-rose-100 flex items-center gap-3 animate-in shake duration-300">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="unstyled"
                disabled={isPending || !currentPassword || !newPassword || !isPasswordValid}
                className="block w-full relative py-4 rounded-[1.25rem] transition-all duration-300 active:scale-[0.98] shadow-2xl shadow-cyan-200 disabled:opacity-50 group border-0 focus:outline-none cursor-pointer disabled:cursor-not-allowed"
              >
                <div className="relative flex items-center justify-center gap-3">
                  <span className="text-sm font-black text-white uppercase tracking-widest">
                    {isPending ? 'Syncing Security...' : 'Apply Secure Changes'}
                  </span>
                  {isPending ? <Loader2 size={18} className="text-white animate-spin" /> : <ChevronRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />}
                </div>
              </Button>
            </form>
          </div>
          
    
        </div>

        {/* Right: Security Dashboard Context */}
        <div className="lg:col-span-5 space-y-6 animate-in slide-in-from-right-8 duration-700">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-8 space-y-6">
             <div className="flex items-center gap-2 text-gray-900 font-black text-lg tracking-tight">
               <Shield className="text-cyan-600" size={20} />
               Password Requirements
             </div>
             <ul className="space-y-4">
               {validations.map(rule => (
                 <li key={rule.id} className="flex items-center gap-3 transition-opacity">
                   {rule.isValid ? (
                     <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                   ) : (
                     <div className="w-5 h-5 rounded-full border-2 border-gray-100 shrink-0" />
                   )}
                   <span className={`text-[13px] font-bold tracking-tight transition-colors ${rule.isValid ? 'text-gray-900' : 'text-gray-400'}`}>
                     {rule.text}
                   </span>
                 </li>
               ))}
             </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
