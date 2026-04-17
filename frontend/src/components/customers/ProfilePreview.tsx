import { useMemo } from 'react';
import { User, Building2, Mail, Globe, Hash, Phone, ShieldCheck } from 'lucide-react';

interface ProfilePreviewProps {
  firstname: string;
  lastname: string;
  companyname: string;
  email: string;
  website: string;
  telephone: string;
  isActive: string;
  username: string;
}

export default function ProfilePreview({
  firstname,
  lastname,
  companyname,
  email,
  website,
  telephone,
  isActive,
  username
}: ProfilePreviewProps) {
  
  const initials = useMemo(() => {
    const f = firstname?.charAt(0) || '';
    const l = lastname?.charAt(0) || '';
    return (f + l).toUpperCase() || '?';
  }, [firstname, lastname]);

  // Premium Palette: Deep Ocean to Electric Indigo
  const activeGradient = isActive === 'Y' 
    ? 'from-[#0891b2] via-[#0ea5e9] to-[#6366f1]' 
    : 'from-slate-400 via-slate-500 to-slate-600';
    
  const activeShadow = isActive === 'Y' 
    ? 'shadow-cyan-500/25' 
    : 'shadow-slate-500/20';

  return (
    <div className="relative w-full group animate-in slide-in-from-left duration-700">
      {/* Background Animated Glow */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${activeGradient} rounded-[32px] blur-lg opacity-20 group-hover:opacity-40 transition duration-1000`}></div>
      
      <div className="relative bg-white/90 backdrop-blur-2xl border border-white/60 rounded-[30px] shadow-xl overflow-hidden p-5 sm:p-6">
        
        {/* Subtle decorative grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e293b 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />

        {/* Header: Identity & Status */}
        <div className="relative z-10 flex justify-between items-start mb-5">
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${activeGradient} rounded-2xl blur-md opacity-40`} />
            <div className={`relative w-14 h-14 rounded-[18px] bg-gradient-to-br ${activeGradient} flex items-center justify-center text-white text-2xl font-black shadow-xl ring-2 ring-white transition-transform group-hover:scale-105 duration-500`}>
              {initials}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm transition-all ${
            isActive === 'Y' 
              ? 'bg-emerald-50/80 text-emerald-600 border-emerald-100 shadow-emerald-200/20' 
              : 'bg-slate-50/80 text-slate-500 border-slate-200 shadow-slate-200/20'
          }`}>
            <div className={`w-1 h-1 rounded-full ${isActive === 'Y' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isActive === 'Y' ? 'Active' : 'Offline'}
          </div>
        </div>

        {/* Name & Title */}
        <div className="relative z-10 space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[20px] font-black text-slate-900 tracking-tight leading-none truncate">
              {firstname || lastname ? `${firstname} ${lastname}` : 'Customer Identity'}
            </h3>
            {isActive === 'Y' && <ShieldCheck size={18} className="text-cyan-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs tracking-tight">
            <Building2 size={13} className="text-indigo-400/70" />
            <span className="truncate">{companyname || 'Entity Not Assigned'}</span>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent mb-5" />

        {/* High-Density Data Grid */}
        <div className="relative z-10 grid grid-cols-1 gap-2.5">
          
          {/* System Alias */}
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all duration-300 group/row border border-transparent hover:border-slate-100">
            <div className={`w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover/row:bg-cyan-50 group-hover/row:text-cyan-600 transition-colors`}>
              <Hash size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Alias</p>
              <p className="text-[13px] font-bold text-slate-700 truncate">{username || 'unassigned'}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all duration-300 group/row border border-transparent hover:border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover/row:bg-violet-50 group-hover/row:text-violet-600 transition-colors shadow-sm">
              <Mail size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Communication</p>
              <p className="text-[13px] font-bold text-slate-700 truncate">{email || 'no-email@registry.sys'}</p>
            </div>
          </div>

          {/* Telephone */}
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all duration-300 group/row border border-transparent hover:border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover/row:bg-emerald-50 group-hover/row:text-emerald-600 transition-colors shadow-sm">
              <Phone size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Voice Connectivity</p>
              <p className="text-[13px] font-bold text-slate-700 truncate">{telephone || 'No Voice'}</p>
            </div>
          </div>

          {/* Website */}
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all duration-300 group/row border border-transparent hover:border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover/row:bg-amber-50 group-hover/row:text-amber-600 transition-colors shadow-sm">
              <Globe size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Digital Portal</p>
              <p className="text-[13px] font-bold text-slate-700 truncate">{website || 'domain.local'}</p>
            </div>
          </div>

        </div>

        {/* Subtle Watermark Branding */}
        <div className="absolute right-[-15px] bottom-[-15px] opacity-[0.02] rotate-[-15deg] pointer-events-none group-hover:rotate-0 transition-transform duration-1000">
           <User size={160} />
        </div>

      </div>
    </div>
  );
}
