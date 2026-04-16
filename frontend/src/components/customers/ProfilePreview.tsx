import { useMemo } from 'react';
import { User, Building2, Mail, Globe, Hash } from 'lucide-react';

interface ProfilePreviewProps {
  firstname: string;
  lastname: string;
  companyname: string;
  email: string;
  website: string;
  isActive: string;
  username: string;
}

export default function ProfilePreview({
  firstname,
  lastname,
  companyname,
  email,
  website,
  isActive,
  username
}: ProfilePreviewProps) {
  
  const initials = useMemo(() => {
    const f = firstname?.charAt(0) || '';
    const l = lastname?.charAt(0) || '';
    return (f + l).toUpperCase() || '?';
  }, [firstname, lastname]);

  const activeColor = isActive === 'Y' ? 'from-emerald-500 to-teal-600' : 'from-slate-400 to-slate-600';

  return (
    <div className="relative w-full group animate-in zoom-in-95 duration-700">
      {/* Dynamic Background Glow */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${activeColor} rounded-[32px] blur opacity-20 group-hover:opacity-30 transition duration-1000`}></div>
      
      <div className="relative bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-2xl overflow-hidden p-8 space-y-8">
        
        {/* Header: Avatar & Status */}
        <div className="flex justify-between items-start">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${activeColor} flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-cyan-500/20 ring-4 ring-white`}>
            {initials}
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            isActive === 'Y' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : 'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
            {isActive === 'Y' ? 'Active Account' : 'Limited Access'}
          </div>
        </div>

        {/* Identity Details */}
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate">
            {firstname || lastname ? `${firstname} ${lastname}` : 'Customer Identity'}
          </h3>
          <div className="flex items-center gap-2 text-cyan-600 font-bold text-sm tracking-tight opacity-80">
            <Building2 size={14} />
            <span className="truncate">{companyname || 'Entity Not Assigned'}</span>
          </div>
        </div>

        <div className="h-px bg-slate-100/50" />

        {/* Data Rows */}
        <div className="space-y-5">
          <div className="flex items-center gap-4 group/row">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/row:bg-cyan-50 group-hover/row:text-cyan-600 transition-colors border border-slate-100/50">
              <Hash size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">System Alias</p>
              <p className="text-sm font-bold text-slate-700 truncate">{username || 'unassigned_alias'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 group/row">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/row:bg-violet-50 group-hover/row:text-violet-600 transition-colors border border-slate-100/50">
              <Mail size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Communication</p>
              <p className="text-sm font-bold text-slate-700 truncate">{email || 'no-email@registry.sys'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 group/row">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/row:bg-amber-50 group-hover/row:text-amber-600 transition-colors border border-slate-100/50">
              <Globe size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Digital Portal</p>
              <p className="text-sm font-bold text-slate-700 truncate">{website || 'https://domain.local'}</p>
            </div>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] rotate-[-15deg] pointer-events-none">
           <User size={180} />
        </div>

      </div>
    </div>
  );
}
