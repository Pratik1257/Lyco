import { useState } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Globe, Building2, CreditCard, MapPin, CheckCircle, Shield, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import lycoLogoImg from '../../assets/LycoLogo.png';

// ── Shared Logo ───────────────────────────────────────────────────────────────
const LycoLogo = () => (
  <div className="flex items-center">
    <img src={lycoLogoImg} alt="Lyco Designs" className="h-10 w-auto object-contain" />
  </div>
);
// ── Input helper ─────────────────────────────────────────────────────────────
const inp = "w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 bg-white text-gray-800 placeholder:text-gray-400 transition-all";
const inpFull = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 bg-white text-gray-800 placeholder:text-gray-400 transition-all";
const label = "block text-xs font-semibold text-slate-600 mb-1";

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, title: 'Account Setup', sub: 'Add your basic details' },
  { n: 2, title: 'Verify Email', sub: 'Verify your email address' },
  { n: 3, title: 'Billing Setup', sub: 'Add billing information' },
  { n: 4, title: 'Confirm', sub: 'Review & complete' },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ step }: { step: number }) {
  return (
    <div className="hidden md:flex flex-col justify-between w-56 bg-slate-900 p-7 text-white flex-shrink-0">
      <div>
        <LycoLogo />
        <ul className="mt-8 space-y-4">
          {STEPS.map(s => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <li key={s.n} className="flex items-start gap-3">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-all
                  ${done ? 'bg-cyan-500' : active ? 'bg-cyan-500' : 'bg-slate-700 text-slate-400'}`}>
                  {done ? <Check size={12} /> : <span>{s.n}</span>}
                </div>
                <div>
                  <p className={`text-xs font-bold ${active || done ? 'text-white' : 'text-slate-500'}`}>{s.title}</p>
                  <p className={`text-[10px] ${done ? 'text-cyan-400' : active ? 'text-slate-400' : 'text-slate-600'}`}>
                    {done ? 'Completed' : s.sub}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex items-center gap-2 text-slate-400 text-[10px]">
        <Shield size={12} className="text-cyan-400" />
        Your data is 100% secure and protected
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full mb-6">
      <div className="h-1 bg-cyan-500 rounded-full transition-all duration-500"
        style={{ width: `${((step - 1) / 3) * 100}%` }} />
    </div>
  );
}

// ── Step 1: Account Setup ─────────────────────────────────────────────────────
function Step1({ data, setData, onNext }: any) {
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  return (
    <div>
      <h1 className="text-xl font-black text-slate-900">Create Your Account</h1>
      <p className="text-slate-400 text-xs mb-1">Step 1 of 4</p>
      <ProgressBar step={1} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>First Name <span className="text-red-500">*</span></label>
          <div className="relative"><User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={inp} placeholder="First Name" value={data.firstName} onChange={e => setData((p: any) => ({ ...p, firstName: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className={label}>Last Name <span className="text-red-500">*</span></label>
          <div className="relative"><User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={inp} placeholder="Last Name" value={data.lastName} onChange={e => setData((p: any) => ({ ...p, lastName: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className={label}>Company Name <span className="text-red-500">*</span></label>
          <div className="relative"><Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={inp} placeholder="Company Name" value={data.company} onChange={e => setData((p: any) => ({ ...p, company: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className={label}>Website URL</label>
          <div className="relative"><Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={inp} placeholder="www.yourdomain.com" value={data.website} onChange={e => setData((p: any) => ({ ...p, website: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className={label}>Email Address <span className="text-red-500">*</span></label>
          <div className="relative"><Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={inp} type="email" placeholder="name@domain.com" value={data.email} onChange={e => setData((p: any) => ({ ...p, email: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className={label}>Username <span className="text-red-500">*</span></label>
          <div className="relative"><User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={inp} placeholder="m2web" value={data.username} onChange={e => setData((p: any) => ({ ...p, username: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className={label}>Password <span className="text-red-500">*</span></label>
          <div className="relative"><Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inp} pr-8`} type={showPwd ? 'text' : 'password'} placeholder="••••••••••" value={data.password} onChange={e => setData((p: any) => ({ ...p, password: e.target.value }))} />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
        <div>
          <label className={label}>Confirm Password <span className="text-red-500">*</span></label>
          <div className="relative"><Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inp} pr-8`} type={showCPwd ? 'text' : 'password'} placeholder="••••••••••" value={data.confirmPassword} onChange={e => setData((p: any) => ({ ...p, confirmPassword: e.target.value }))} />
            <button type="button" onClick={() => setShowCPwd(!showCPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showCPwd ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
      </div>
      <button onClick={onNext} className="mt-5 ml-auto flex px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-cyan-200 active:scale-[0.98]">
        Next Step
      </button>
    </div>
  );
}

// ── Step 2: Verify Email ──────────────────────────────────────────────────────
function Step2VerifyEmail({ email, onNext, onBack }: any) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);

  return (
    <div className="text-center flex flex-col items-center">
      <h1 className="text-xl font-black text-slate-900">Verify Your Email</h1>
      <p className="text-slate-400 text-xs mb-1">Step 2 of 4</p>
      <ProgressBar step={2} />
      
      <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-6 mt-4">
        <Mail size={32} className="text-cyan-500" />
      </div>

      <p className="text-slate-600 text-sm mb-1 font-medium">We've sent a 6-digit code to</p>
      <p className="text-cyan-600 font-bold mb-4">{email || 'john@example.com'}</p>
      <p className="text-slate-400 text-[11px] mb-8">Please enter the code below to verify your email address.</p>

      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            className="w-10 h-12 text-center text-lg font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 bg-white"
            value={code[i]}
            onChange={(e) => {
              const newCode = [...code];
              newCode[i] = e.target.value;
              setCode(newCode);
              // Auto focus next
              if (e.target.value && e.target.nextSibling) {
                (e.target.nextSibling as HTMLInputElement).focus();
              }
            }}
          />
        ))}
      </div>

      <p className="text-xs text-slate-500 mb-8">
        Didn't receive the code? <button className="text-cyan-600 font-bold hover:underline">Resend code (00:{timer < 10 ? `0${timer}` : timer})</button>
      </p>

      <div className="mt-5 w-full flex items-center justify-between">
        <button onClick={onBack} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all">Back</button>
        <button onClick={onNext} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-cyan-200 active:scale-[0.98]">Verify & Continue</button>
      </div>
    </div>
  );
}

// ── Step 3: Billing ───────────────────────────────────────────────────────────
function Step3({ data, setData, onNext, onBack }: any) {
  return (
    <div>
      <h1 className="text-xl font-black text-slate-900">Billing Information</h1>
      <p className="text-slate-400 text-xs mb-1">Step 3 of 4</p>
      <ProgressBar step={3} />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Card Type <span className="text-red-500">*</span></label>
            <select className={inpFull} value={data.cardType} onChange={e => setData((p: any) => ({ ...p, cardType: e.target.value }))}>
              <option>Visa</option><option>Mastercard</option><option>Amex</option><option>Discover</option>
            </select>
          </div>
          <div>
            <label className={label}>Card Number <span className="text-red-500">*</span></label>
            <div className="relative"><CreditCard size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={inp} placeholder="4242 4242 4242 4242" value={data.cardNumber} onChange={e => setData((p: any) => ({ ...p, cardNumber: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={label}>Expiry Date <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input className={inpFull} placeholder="12" maxLength={2} value={data.expiryMonth} onChange={e => setData((p: any) => ({ ...p, expiryMonth: e.target.value }))} />
              <span className="self-center text-slate-400 font-bold">:</span>
              <input className={inpFull} placeholder="2028" maxLength={4} value={data.expiryYear} onChange={e => setData((p: any) => ({ ...p, expiryYear: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={label}>CVV <span className="text-red-500">*</span></label>
            <input className={inpFull} placeholder="123" maxLength={4} value={data.cvv} onChange={e => setData((p: any) => ({ ...p, cvv: e.target.value }))} />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-700 mt-1">Billing Address</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Address Line 1 <span className="text-red-500">*</span></label>
            <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={inp} placeholder="Street address" value={data.addr1} onChange={e => setData((p: any) => ({ ...p, addr1: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={label}>Address Line 2</label>
            <input className={inpFull} placeholder="Suite, floor, etc." value={data.addr2} onChange={e => setData((p: any) => ({ ...p, addr2: e.target.value }))} />
          </div>
          <div>
            <label className={label}>City <span className="text-red-500">*</span></label>
            <input className={inpFull} placeholder="New York" value={data.city} onChange={e => setData((p: any) => ({ ...p, city: e.target.value }))} />
          </div>
          <div>
            <label className={label}>State <span className="text-red-500">*</span></label>
            <input className={inpFull} placeholder="New York" value={data.state} onChange={e => setData((p: any) => ({ ...p, state: e.target.value }))} />
          </div>
          <div>
            <label className={label}>ZIP / Postal Code <span className="text-red-500">*</span></label>
            <input className={inpFull} placeholder="10001" value={data.zip} onChange={e => setData((p: any) => ({ ...p, zip: e.target.value }))} />
          </div>
          <div>
            <label className={label}>Country <span className="text-red-500">*</span></label>
            <select className={inpFull} value={data.country} onChange={e => setData((p: any) => ({ ...p, country: e.target.value }))}>
              <option>United States</option><option>United Kingdom</option><option>Canada</option><option>Australia</option>
            </select>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <button onClick={onBack} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all">Back</button>
        <button onClick={onNext} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-cyan-200 active:scale-[0.98]">Next Step</button>
      </div>
    </div>
  );
}

// ── Step 4: Confirm ───────────────────────────────────────────────────────────
function Step4({ account, billing, onBack, onSubmit, goToStep }: any) {
  const Row = ({ label, value }: any) => (
    <div className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800">{value || '—'}</span>
    </div>
  );
  const maskedCard = billing.cardNumber ? `**** **** **** ${billing.cardNumber.replace(/\s/g, '').slice(-4)}` : '—';
  return (
    <div>
      <h1 className="text-xl font-black text-slate-900">Confirm Your Details</h1>
      <p className="text-slate-400 text-xs mb-1">Step 4 of 4</p>
      <ProgressBar step={4} />
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Account Information</p>
            <button onClick={() => goToStep(1)} className="text-xs font-bold text-cyan-600 hover:text-cyan-700">Edit</button>
          </div>
          <Row label="Name" value={`${account.firstName} ${account.lastName}`} />
          <Row label="Email" value={account.email} />
          <Row label="Username" value={account.username} />
          <Row label="Website" value={account.website} />
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Billing Information</p>
            <button onClick={() => goToStep(3)} className="text-xs font-bold text-cyan-600 hover:text-cyan-700">Edit</button>
          </div>
          <Row label="Card Number" value={maskedCard} />
          <Row label="Card Type" value={billing.cardType} />
          <Row label="Expiry Date" value={billing.expiryMonth && billing.expiryYear ? `${billing.expiryMonth} / ${billing.expiryYear}` : '—'} />
          <Row label="Billing Address" value={[billing.addr1, billing.city, billing.state, billing.zip, billing.country].filter(Boolean).join(', ')} />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <button onClick={onBack} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all">Back</button>
        <button onClick={onSubmit} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-cyan-200 active:scale-[0.98]">Complete Registration</button>
      </div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ onDashboard, onLogin }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdf4 50%, #fafafa 75%, #f5f3ff 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center max-w-sm w-full">
        <div className="flex items-center justify-center mb-8">
          <img src={lycoLogoImg} alt="Lyco Designs" className="h-12 w-auto object-contain" />
        </div>
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
          <CheckCircle size={42} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Registration Successful!!</h2>
        <p className="text-slate-400 text-sm mb-8">Your account has been created successfully.<br />You can now access your dashboard.</p>
        <button onClick={onDashboard} className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-cyan-200 mb-3 active:scale-[0.98]">
          Go to Dashboard
        </button>
        <button onClick={onLogin} className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
          Back to Login
        </button>
      </div>
    </div>
  );
}

// ── Main Register Page ────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  const [account, setAccount] = useState({ firstName: '', lastName: '', company: '', website: '', email: '', username: '', password: '', confirmPassword: '' });
  const [billing, setBilling] = useState({ cardType: 'Visa', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '', addr1: '', addr2: '', city: '', state: '', zip: '', country: 'United States' });

  if (success) return <SuccessScreen onDashboard={() => navigate('/')} onLogin={() => navigate('/login')} />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdf4 50%, #fafafa 75%, #f5f3ff 100%)' }}>
      <div className="flex w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
        <Sidebar step={step} />
        <div className="flex-1 bg-white p-8 overflow-y-auto max-h-[90vh]">
          {step === 1 && <Step1 data={account} setData={setAccount} onNext={() => setStep(2)} />}
          {step === 2 && <Step2VerifyEmail email={account.email} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3 data={billing} setData={setBilling} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <Step4 account={account} billing={billing} onBack={() => setStep(3)} onSubmit={() => setSuccess(true)} goToStep={setStep} />}
        </div>
      </div>
    </div>
  );
}
