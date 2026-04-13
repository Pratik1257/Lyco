import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsRowProps {
  label: string;
  subtext: string;
  onClick?: () => void;
  showChevron?: boolean;
  isDanger?: boolean;
}

const SettingsRow = ({ label, subtext, onClick, showChevron = true, isDanger = false }: SettingsRowProps) => (
  <div 
    onClick={onClick}
    className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border-b border-black/[0.08] last:border-0"
  >
    <div className="flex-1 min-w-0">
      <h4 className={`text-[13px] font-medium leading-tight ${isDanger ? 'text-[#E24B4A]' : 'text-gray-900'}`}>{label}</h4>
      <p className="text-[12px] text-gray-500 mt-0.5 truncate">{subtext}</p>
    </div>
    {showChevron && <ChevronRight size={14} className="text-gray-400 shrink-0 ml-2" />}
  </div>
);

interface ToggleProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  subtext: string;
}

const Toggle = ({ isChecked, onChange, label, subtext }: ToggleProps) => (
  <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.08] last:border-0">
    <div className="flex-1 min-w-0">
      <h4 className="text-[13px] font-medium text-gray-900 leading-tight">{label}</h4>
      <p className="text-[12px] text-gray-500 mt-0.5 truncate">{subtext}</p>
    </div>
    <div 
      onClick={() => onChange(!isChecked)}
      className={`relative w-8 h-4.5 rounded-full cursor-pointer transition-colors duration-200 shrink-0 ml-2 ${
        isChecked ? 'bg-[#1D9E75]' : 'bg-gray-200'
      }`}
      style={{ width: '32px', height: '18px' }}
    >
      <div 
        className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
          isChecked ? 'translate-x-[14px]' : 'translate-x-0'
        }`}
      />
    </div>
  </div>
);

interface SettingsPanelProps {
  isOpen: boolean;
}

export default function SettingsPanel({ isOpen }: SettingsPanelProps) {
  const [emailNotif, setEmailNotif] = useState(true);
  const [quoteAlert, setQuoteAlert] = useState(true);
  const [paymentRemind, setPaymentRemind] = useState(false);

  if (!isOpen) return null;

  return (
    <div 
      className="absolute -right-[10px] sm:right-0 top-[calc(100%+8px)] w-[calc(100vw-32px)] sm:w-[300px] max-w-[300px] bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-black/[0.12] z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.08]">
        <h3 className="text-[13px] font-semibold text-gray-900">Settings</h3>
        <button className="text-[12px] font-medium text-[#1D9E75] hover:underline transition-all">
          Save changes
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[450px] overflow-y-auto overflow-x-hidden">
        {/* PROFILE Section */}
        <div className="bg-gray-50/50 px-4 py-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Profile</span>
        </div>
        <SettingsRow 
          label="My profile"
          subtext="Snehal Patel · Administrator"
        />
        <SettingsRow 
          label="Change password"
          subtext="Last changed 30 days ago"
        />

        {/* NOTIFICATIONS Section */}
        <div className="bg-gray-50/50 px-4 py-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Notifications</span>
        </div>
        <Toggle 
          label="Email notifications"
          subtext="Orders, payments & invoices"
          isChecked={emailNotif}
          onChange={setEmailNotif}
        />
        <Toggle 
          label="Quote alerts"
          subtext="Notify when quote awaits review"
          isChecked={quoteAlert}
          onChange={setQuoteAlert}
        />
        <Toggle 
          label="Payment reminders"
          subtext="Alert on overdue payments"
          isChecked={paymentRemind}
          onChange={setPaymentRemind}
        />

        {/* APPEARANCE Section */}
        <div className="bg-gray-50/50 px-4 py-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Appearance</span>
        </div>
        
        <SettingsRow 
          label="Language & region"
          subtext="English · India (IST)"
        />

        {/* ACCOUNT Section */}
        <div className="bg-gray-50/50 px-4 py-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Account</span>
        </div>
        <SettingsRow 
          label="Log out"
          subtext="End your current session"
          isDanger={true}
          showChevron={false}
        />
      </div>
    </div>
  );
}
