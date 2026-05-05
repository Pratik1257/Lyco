import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Globe, Building2, CreditCard, MapPin, CheckCircle, Shield, Check, DollarSign, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import lycoLogoImg from '../../assets/LycoLogo.png';
import { authApi } from '../../api/authApi';
import { countriesApi, type Country } from '../../api/countriesApi';
import _PhoneInput from 'react-phone-input-2';
const PhoneInput = (_PhoneInput as any).default || _PhoneInput;
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';

// ── Shared Logo ───────────────────────────────────────────────────────────────
const LycoLogo = () => (
  <div className="flex items-center">
    <img src={lycoLogoImg} alt="Lyco Designs" className="h-12 w-auto object-contain" />
  </div>
);

// ── Input helper ─────────────────────────────────────────────────────────────
const inp = "w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 bg-white text-gray-800 placeholder:text-gray-400 transition-all";
const inpFull = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 bg-white text-gray-800 placeholder:text-gray-400 transition-all";
const labelStyle = "block text-xs font-semibold text-slate-600 mb-1";

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, title: 'Account Setup', sub: 'Details & Address' },
  { n: 2, title: 'Verify Email', sub: 'Check your inbox' },
  { n: 3, title: 'Billing Setup', sub: 'Card information' },
  { n: 4, title: 'Confirm', sub: 'Review & complete' },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ step }: { step: number }) {
  return (
    <div className="hidden md:flex flex-col justify-between w-64 bg-slate-900 p-8 text-white flex-shrink-0">
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
    <div className="w-full h-1 bg-gray-100 rounded-full mb-4">
      <div className="h-1 bg-cyan-500 rounded-full transition-all duration-500"
        style={{ width: `${((step - 1) / 3) * 100}%` }} />
    </div>
  );
}

// ── Step 1: Account Setup ─────────────────────────────────────────────────────
function Step1({ data, setData, countries, onNext }: any) {
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const nameRegex = /^[a-zA-Z\s'-]*$/;
  const alphaNumRegex = /^[a-zA-Z0-9][a-zA-Z0-9._]*$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const domainMap: Record<string, string> = { 'gmal.com': 'gmail.com', 'gmil.com': 'gmail.com', 'hotmal.com': 'hotmail.com', 'yaho.com': 'yahoo.com', 'outlok.com': 'outlook.com' };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (['firstName', 'lastName', 'city', 'state'].includes(name)) value = value.replace(/[^a-zA-Z\s'-]/g, '');
    if (name === 'username') value = value.replace(/[^a-zA-Z0-9._]/g, '');
    if (name === 'company') value = value.replace(/[^a-zA-Z0-9\s&.,'-]/g, '');
    if (name === 'zipcode') value = value.replace(/[^0-9-]/g, '');
    setData((p: any) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(p => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleWebsiteBlur = () => {
    const url = data.website?.trim() || '';
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      if (/^([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(url)) {
        setData((p: any) => ({ ...p, website: `https://${url}` }));
      }
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!data.firstName) errors.firstName = 'First name is required';
    else if (data.firstName.length < 3) errors.firstName = 'First name must be at least 3 characters';
    else if (!nameRegex.test(data.firstName)) errors.firstName = 'Only letters allowed';

    if (!data.lastName) errors.lastName = 'Last name is required';
    else if (data.lastName.length < 3) errors.lastName = 'Last name must be at least 3 characters';
    else if (!nameRegex.test(data.lastName)) errors.lastName = 'Only letters allowed';

    if (!data.company) errors.company = 'Company name is required';
    else if (data.company.length < 3) errors.company = 'Company name must be at least 3 characters';

    if (!data.email) errors.email = 'Email is required';
    else if (!emailRegex.test(data.email) || data.email.length > 150) errors.email = 'Please enter a valid email';
    else { const domain = data.email.split('@')[1]?.toLowerCase(); if (domainMap[domain]) errors.email = `Typo detected? Did you mean @${domainMap[domain]}?`; }

    if (!data.telephone || data.telephone === '+') errors.telephone = 'Telephone is required';
    else { try { const p = data.telephone.startsWith('+') ? data.telephone : `+${data.telephone}`; if (!isValidPhoneNumber(p)) errors.telephone = 'Invalid phone number'; } catch { errors.telephone = 'Invalid phone number format'; } }

    if (!data.username) errors.username = 'Username is required';
    else if (data.username.length < 3) errors.username = 'Username must be at least 3 characters';
    else if (data.username.length > 50) errors.username = 'Username cannot exceed 50 characters';
    else if (!alphaNumRegex.test(data.username)) errors.username = 'Only letters, numbers, dots, underscores allowed';
    else if (data.username.includes('__')) errors.username = 'Double underscores are not allowed';

    if (!data.password) errors.password = 'requirements_not_met';
    else { const p = data.password; if (!(p.length >= 8 && p.length <= 100 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[@#$%^&*]/.test(p))) errors.password = 'requirements_not_met'; }

    if (!data.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (!data.address1) errors.address1 = 'Address is required';
    else if (data.address1.length < 5) errors.address1 = 'Address must be at least 5 characters';

    if (!data.city) errors.city = 'City is required';
    else if (data.city.length < 2) errors.city = 'City must be at least 2 characters';

    if (!data.state) errors.state = 'State is required';
    else if (data.state.length < 2) errors.state = 'State must be at least 2 characters';

    if (!data.countryId) errors.countryId = 'Country is required';

    if (!data.zipcode) errors.zipcode = 'ZIP code is required';
    else {
      const isUS = countries.find((c: Country) => c.countryName.toLowerCase().includes('united states') || c.countryName === 'USA')?.countryId === data.countryId;
      if (isUS) { if (!/^\d{5}(-\d{4})?$/.test(data.zipcode)) errors.zipcode = 'Invalid ZIP code (e.g. 12345)'; }
      else { if (data.zipcode.length < 4) errors.zipcode = 'Postcode must be at least 4 characters'; if (data.zipcode.length > 10) errors.zipcode = 'Postcode cannot exceed 10 characters'; }
    }

    if (data.website) {
      const url = data.website.trim();
      if (!/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(url) || url.includes('@')) errors.website = 'Please enter a valid website URL';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const renderError = (name: string) => {
    if (!fieldErrors[name]) return null;
    if (name === 'password' && fieldErrors.password === 'requirements_not_met') {
      return (
        <div className="mt-2 space-y-1 animate-in fade-in duration-200">
          <p className="text-[11px] font-semibold text-red-500">Password requirements:</p>
          {[{ label: '8-100 characters', met: (data.password?.length || 0) >= 8 && (data.password?.length || 0) <= 100 }, { label: 'One uppercase letter', met: /[A-Z]/.test(data.password || '') }, { label: 'One number', met: /[0-9]/.test(data.password || '') }, { label: 'One special char (@#$%^&*)', met: /[@#$%^&*]/.test(data.password || '') }].map((req, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <AlertCircle size={11} className={req.met ? 'text-emerald-500' : 'text-red-400'} />
              <span className={`text-[11px] font-medium ${req.met ? 'text-emerald-600' : 'text-red-400'}`}>{req.label}</span>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-[11px] font-medium text-red-500 mt-1 animate-in fade-in duration-200">{fieldErrors[name]}</p>;
  };

  const handleNext = () => {
    if (!validateStep1()) {
      toast.error('Please fix the errors before continuing.');
      return;
    }
    onNext();
  };

  const inpCls = (name: string) => `${inp} ${fieldErrors[name] ? 'border-red-400 ring-2 ring-red-400/20' : ''}`;

  return (
    <div>
      <h1 className="text-xl font-black text-slate-900">Account Setup</h1>
      <p className="text-slate-400 text-xs mb-1">Step 1 of 4</p>
      <ProgressBar step={1} />

      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        <div>
          <label className={labelStyle}>First Name <span className="text-red-500">*</span></label>
          <div className="relative"><User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="firstName" className={inpCls('firstName')} placeholder="First Name" value={data.firstName} onChange={handleInputChange} />
          </div>
          {renderError('firstName')}
        </div>
        <div>
          <label className={labelStyle}>Last Name <span className="text-red-500">*</span></label>
          <div className="relative"><User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="lastName" className={inpCls('lastName')} placeholder="Last Name" value={data.lastName} onChange={handleInputChange} />
          </div>
          {renderError('lastName')}
        </div>
        <div>
          <label className={labelStyle}>Company Name <span className="text-red-500">*</span></label>
          <div className="relative"><Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="company" className={inpCls('company')} placeholder="Company Name" value={data.company} onChange={handleInputChange} />
          </div>
          {renderError('company')}
        </div>
        <div>
          <label className={labelStyle}>Website URL</label>
          <div className="relative"><Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="website" className={inpCls('website')} placeholder="www.yourdomain.com" value={data.website} onChange={handleInputChange} onBlur={handleWebsiteBlur} />
          </div>
          {renderError('website')}
        </div>
        <div>
          <label className={labelStyle}>Email Address <span className="text-red-500">*</span></label>
          <div className="relative"><Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="email" className={inpCls('email')} type="email" placeholder="name@domain.com" value={data.email} onChange={handleInputChange} />
          </div>
          {renderError('email')}
        </div>
        <div>
          <label className={labelStyle}>Telephone No. <span className="text-red-500">*</span></label>
          <div className={fieldErrors.telephone ? 'phone-input-error' : ''}>
            <PhoneInput
              country={'us'}
              value={data.telephone || ''}
              onChange={(value: string) => {
                setData((p: any) => ({ ...p, telephone: `+${value}` }));
                if (fieldErrors.telephone) setFieldErrors(p => { const n = { ...p }; delete n.telephone; return n; });
              }}
              containerClass="lyco-phone-container"
              inputClass="!w-full !h-[34px] !bg-white !border !border-gray-200 !rounded-lg !text-sm !font-medium !text-gray-800 !pl-12 focus:!ring-2 focus:!ring-cyan-400/30 focus:!border-cyan-400 !transition-all"
              buttonClass="!bg-transparent !border-none !rounded-l-lg !pl-2"
              enableSearch
              disableSearchIcon
            />
          </div>
          {renderError('telephone')}
        </div>
        <div>
          <label className={labelStyle}>Username <span className="text-red-500">*</span></label>
          <div className="relative"><User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="username" className={inpCls('username')} placeholder="m2web" value={data.username} onChange={handleInputChange} />
          </div>
          {renderError('username')}
        </div>
        <div>
          <label className={labelStyle}>Password <span className="text-red-500">*</span></label>
          <div className="relative"><Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="password" className={`${inpCls('password')} pr-8`} type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={data.password} onChange={handleInputChange} />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          {renderError('password')}
        </div>
        <div>
          <label className={labelStyle}>Confirm Password <span className="text-red-500">*</span></label>
          <div className="relative"><Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="confirmPassword" className={`${inpCls('confirmPassword')} pr-8`} type={showCPwd ? 'text' : 'password'} placeholder="••••••••" value={data.confirmPassword} onChange={handleInputChange} />
            <button type="button" onClick={() => setShowCPwd(!showCPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showCPwd ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          {renderError('confirmPassword')}
        </div>
        <div>
          <label className={labelStyle}>Address Line 1 <span className="text-red-500">*</span></label>
          <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="address1" className={inpCls('address1')} placeholder="Street address" value={data.address1} onChange={handleInputChange} />
          </div>
          {renderError('address1')}
        </div>
        <div>
          <label className={labelStyle}>Address Line 2</label>
          <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="address2" className={inp} placeholder="Suite, floor, etc." value={data.address2} onChange={handleInputChange} />
          </div>
        </div>
        <div>
          <label className={labelStyle}>City/Town <span className="text-red-500">*</span></label>
          <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="city" className={inpCls('city')} placeholder="City" value={data.city} onChange={handleInputChange} />
          </div>
          {renderError('city')}
        </div>
        <div>
          <label className={labelStyle}>State <span className="text-red-500">*</span></label>
          <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="state" className={inpCls('state')} placeholder="State" value={data.state} onChange={handleInputChange} />
          </div>
          {renderError('state')}
        </div>
        <div>
          <label className={labelStyle}>Choose Country <span className="text-red-500">*</span></label>
          <select className={`${inpFull} ${fieldErrors.countryId ? 'border-red-400' : ''}`} value={data.countryId} onChange={e => { setData((p: any) => ({ ...p, countryId: e.target.value })); if (fieldErrors.countryId) setFieldErrors(p => { const n = { ...p }; delete n.countryId; return n; }); }}>
            <option value="">Select Country</option>
            {countries.map((c: Country) => (<option key={c.countryId} value={c.countryId}>{c.countryName}</option>))}
          </select>
          {renderError('countryId')}
        </div>
        <div>
          <label className={labelStyle}>Zip/Postal Code <span className="text-red-500">*</span></label>
          <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="zipcode" className={inpCls('zipcode')} placeholder="Zip Code" value={data.zipcode} onChange={handleInputChange} />
          </div>
          {renderError('zipcode')}
        </div>
        <div>
          <label className={labelStyle}>Currency <span className="text-red-500">*</span></label>
          <div className="relative"><DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select className={inp + " pl-9"} value={data.currency} onChange={e => setData((p: any) => ({ ...p, currency: e.target.value }))}>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>
        <div className="col-span-2 mt-5 px-4 bg-cyan-50/50 rounded-lg border border-cyan-100 flex items-center gap-3 transition-colors hover:bg-cyan-50 h-[38px]">
          <input type="checkbox" id="sameAsBilling" className="w-4 h-4 rounded border-cyan-300 text-cyan-500 focus:ring-cyan-500/30 transition-all cursor-pointer" checked={data.useSameAddressForBilling || false} onChange={e => setData((p: any) => ({ ...p, useSameAddressForBilling: e.target.checked }))} />
          <label htmlFor="sameAsBilling" className="text-xs font-semibold text-slate-700 cursor-pointer select-none pt-[1px]">Use this address for <span className="text-cyan-700 font-bold">Billing Setup</span></label>
        </div>
      </div>

      <div className="mt-5 flex justify-between">
        <button onClick={() => window.history.back()} className="px-6 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all">Go to Login</button>
        <button onClick={handleNext} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-cyan-200 active:scale-[0.98]">Go to Next Step</button>
      </div>
    </div>
  );
}



// ── Step 2: Verify Email ─────────────────────────────────────────────────────
function Step2VerifyEmail({ data, onNext, onBack }: any) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [expectedCode, setExpectedCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Simulate sending an email and print the code to the console for testing
  useEffect(() => {
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(testCode);
    console.log('----------------------------------------');
    console.log(`📧 NEW EMAIL to ${data.email || 'your email'}`);
    console.log(`Your Lyco Verification Code is: ${testCode}`);
    console.log('----------------------------------------');
  }, [data.email]);



  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    
    // Auto-verify when 6th digit is entered
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode === expectedCode) {
        toast.success('Email verified successfully!');
        onNext();
      } else {
        toast.error('Invalid verification code. Please try again.');
        // Optionally clear the code on failure
        setTimeout(() => setCode(['', '', '', '', '', '']), 500);
        inputRefs.current[0]?.focus();
      }
    } else if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = [...code];
      pastedData.split('').forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCode(newCode);
      
      if (pastedData.length === 6) {
        if (pastedData === expectedCode) {
          toast.success('Email verified successfully!');
          onNext();
        } else {
          toast.error('Invalid verification code.');
          setCode(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      } else {
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex]?.focus();
      }
    }
  };

  const handleResend = () => {
    const newTestCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(newTestCode);
    setCode(['', '', '', '', '', '']);
    if (inputRefs.current[0]) inputRefs.current[0].focus();
    
    console.log('----------------------------------------');
    console.log(`📧 RESENDING EMAIL to ${data.email || 'your email'}`);
    console.log(`Your NEW Lyco Verification Code is: ${newTestCode}`);
    console.log('----------------------------------------');
    toast.success('A new code has been sent to your email');
  };

  return (
    <div>
      <h1 className="text-xl font-black text-slate-900">Verify Email</h1>
      <p className="text-slate-400 text-xs mb-1">Step 2 of 4</p>
      <ProgressBar step={2} />
      
      <div className="py-2 flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mb-4 mt-2">
          <div className="absolute inset-0 bg-cyan-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-50 to-white flex items-center justify-center border border-cyan-100 shadow-lg shadow-cyan-100/50 transform rotate-3">
            <Mail size={28} className="text-cyan-600 -rotate-3" strokeWidth={1.5} />
          </div>
        </div>
        
        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Check your inbox</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed px-4">
          We've sent a 6-digit security code to <br/>
          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">{data.email || 'your email address'}</span>
        </p>
        
        <div className="flex gap-2 mb-6 w-full justify-center" onPaste={handlePaste}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className="w-11 h-12 text-center text-xl font-black text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 focus:outline-none transition-all shadow-sm placeholder:text-slate-300"
              placeholder="-"
            />
          ))}
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-[11px] font-semibold text-slate-500">Didn't receive the code?</p>
          <div className="flex gap-4">
            <button type="button" onClick={handleResend} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline underline-offset-4 transition-all">
              Resend Code
            </button>
            <button type="button" onClick={onBack} className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline underline-offset-4 transition-all">
              Change Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Billing Setup ──────────────────────────────────────────────────────
function Step3Billing({ data, setData, countries, onNext, onBack }: any) {
  const [showCvv, setShowCvv] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateLuhn = (number: string) => {
    let sum = 0, shouldDouble = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i));
      if (shouldDouble) { if ((digit *= 2) > 9) digit -= 9; }
      sum += digit; shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
  };

  const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'cardNumber' || name === 'cvv') value = value.replace(/\D/g, '');
    if (['city', 'state'].includes(name)) value = value.replace(/[^a-zA-Z\s'-]/g, '');
    if (name === 'zipcode') value = value.replace(/[^0-9-]/g, '');
    setData((p: any) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(p => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);
    
    const num = parseInt(val);
    if (val.length === 1 && parseInt(val) > 1 && parseInt(val) <= 9) {
      val = '0' + val;
    } else if (val.length === 2 && (num < 1 || num > 12)) {
      return; // Block invalid month
    }
    
    setData((p: any) => ({ ...p, expiryMonth: val }));
    if (fieldErrors.expiry) setFieldErrors(p => { const n = { ...p }; delete n.expiry; return n; });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setData((p: any) => ({ ...p, expiryYear: val }));
    if (fieldErrors.expiry) setFieldErrors(p => { const n = { ...p }; delete n.expiry; return n; });
  };

  const validateBilling = () => {
    const errors: Record<string, string> = {};
    const cardNo = (data.cardNumber || '').replace(/\s/g, '');
    if (!cardNo) errors.cardNumber = 'Card number is required';
    else if (cardNo.length < 13 || cardNo.length > 19) errors.cardNumber = 'Card number must be 13-19 digits';
    else if (!validateLuhn(cardNo)) errors.cardNumber = 'Invalid card number';

    if (!data.expiryMonth || !data.expiryYear) errors.expiry = 'Expiry date is required';
    else {
      const now = new Date(); const cy = now.getFullYear(); const cm = now.getMonth() + 1;
      const sy = parseInt(data.expiryYear); const sm = parseInt(data.expiryMonth);
      if (sm < 1 || sm > 12) errors.expiry = 'Invalid month (01-12)';
      else if (data.expiryYear.length < 4) errors.expiry = 'Year must be 4 digits';
      else if (sy < cy || (sy === cy && sm < cm)) errors.expiry = 'Expiry date must be in the future';
    }

    if (!data.cvv) errors.cvv = 'CVV is required';
    else if (data.cvv.length < 3 || data.cvv.length > 4) errors.cvv = 'CVV must be 3-4 digits';

    if (!data.address1) errors.address1 = 'Address is required';
    else if (data.address1.length < 5) errors.address1 = 'Address must be at least 5 characters';

    if (!data.city) errors.city = 'City is required';
    else if (data.city.length < 2) errors.city = 'City must be at least 2 characters';

    if (!data.state) errors.state = 'State is required';
    else if (data.state.length < 2) errors.state = 'State must be at least 2 characters';

    if (!data.countryId) errors.countryId = 'Country is required';

    if (!data.zipcode) errors.zipcode = 'ZIP code is required';
    else {
      const isUS = countries?.find((c: Country) => c.countryName.toLowerCase().includes('united states') || c.countryName === 'USA')?.countryId === data.countryId;
      if (isUS) { if (!/^\d{5}(-\d{4})?$/.test(data.zipcode)) errors.zipcode = 'Invalid ZIP code (e.g. 12345)'; }
      else { if (data.zipcode.length < 4) errors.zipcode = 'Min 4 characters'; if (data.zipcode.length > 10) errors.zipcode = 'Max 10 characters'; }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const renderError = (name: string) => fieldErrors[name]
    ? <p className="text-[11px] font-medium text-red-500 mt-1 animate-in fade-in duration-200">{fieldErrors[name]}</p>
    : null;

  const inpCls = (name: string) => `${inp} ${fieldErrors[name] ? 'border-red-400 ring-2 ring-red-400/20' : ''}`;

  const handleNext = () => {
    if (!validateBilling()) { toast.error('Please fix the billing errors before continuing.'); return; }
    onNext();
  };

  return (
    <div>
      <h1 className="text-xl font-black text-slate-900">Billing Information</h1>
      <p className="text-slate-400 text-xs mb-1">Step 3 of 4</p>
      <ProgressBar step={3} />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Card Type <span className="text-red-500">*</span></label>
            <select className={inpFull} value={data.cardType} onChange={e => setData((p: any) => ({ ...p, cardType: e.target.value }))}>
              <option>Visa</option><option>Mastercard</option><option>Amex</option><option>Discover</option>
            </select>
          </div>
          <div>
            <label className={labelStyle}>Card Number <span className="text-red-500">*</span></label>
            <div className="relative"><CreditCard size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input name="cardNumber" maxLength={19} className={inpCls('cardNumber')} placeholder="4242 4242 4242 4242" value={data.cardNumber} onChange={handleCardInput} />
            </div>
            {renderError('cardNumber')}
          </div>
          <div>
            <label className={labelStyle}>Expiry Date <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input name="expiryMonth" className={`${inpFull} ${fieldErrors.expiry ? 'border-red-400' : ''}`} placeholder="MM" maxLength={2} value={data.expiryMonth} onChange={handleMonthChange} />
              <span className="self-center text-slate-400 font-bold">:</span>
              <input name="expiryYear" className={`${inpFull} ${fieldErrors.expiry ? 'border-red-400' : ''}`} placeholder="YYYY" maxLength={4} value={data.expiryYear} onChange={handleYearChange} />
            </div>
            {renderError('expiry')}
          </div>
          <div>
            <label className={labelStyle}>CVV <span className="text-red-500">*</span></label>
            <div className="relative">
              <input name="cvv" type={showCvv ? 'text' : 'password'} className={`${inpCls('cvv')} pr-8`} placeholder="•••" maxLength={4} value={data.cvv} onChange={handleCardInput} />
              <button type="button" onClick={() => setShowCvv(!showCvv)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCvv ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {renderError('cvv')}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 mt-4">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Billing Address</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={labelStyle}>Address Line 1 <span className="text-red-500">*</span></label>
              <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="address1" className={inpCls('address1')} placeholder="Street address" value={data.address1 || ''} onChange={handleCardInput} />
              </div>
              {renderError('address1')}
            </div>
            <div>
              <label className={labelStyle}>Address Line 2</label>
              <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="address2" className={inp} placeholder="Suite, floor, etc." value={data.address2 || ''} onChange={handleCardInput} />
              </div>
            </div>
            <div>
              <label className={labelStyle}>City/Town <span className="text-red-500">*</span></label>
              <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="city" className={inpCls('city')} placeholder="City" value={data.city || ''} onChange={handleCardInput} />
              </div>
              {renderError('city')}
            </div>
            <div>
              <label className={labelStyle}>State <span className="text-red-500">*</span></label>
              <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="state" className={inpCls('state')} placeholder="State" value={data.state || ''} onChange={handleCardInput} />
              </div>
              {renderError('state')}
            </div>
            <div>
              <label className={labelStyle}>Choose Country <span className="text-red-500">*</span></label>
              <select className={`${inpFull} ${fieldErrors.countryId ? 'border-red-400' : ''}`} value={data.countryId || ''} onChange={e => { setData((p: any) => ({ ...p, countryId: e.target.value })); if (fieldErrors.countryId) setFieldErrors(p => { const n={...p}; delete n.countryId; return n; }); }}>
                <option value="">Select Country</option>
                {countries?.map((c: Country) => (<option key={c.countryId} value={c.countryId}>{c.countryName}</option>))}
              </select>
              {renderError('countryId')}
            </div>
            <div>
              <label className={labelStyle}>Zip/Postal Code <span className="text-red-500">*</span></label>
              <div className="relative"><MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="zipcode" className={inpCls('zipcode')} placeholder="Zip Code" value={data.zipcode || ''} onChange={handleCardInput} />
              </div>
              {renderError('zipcode')}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <button onClick={onBack} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all">Back</button>
        <button onClick={handleNext} className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-cyan-200 active:scale-[0.98]">Review & Confirm</button>
      </div>
    </div>
  );
}

// ── Step 4: Confirm ───────────────────────────────────────────────────────────
function Step4Confirm({ account, billing, onBack, onSubmit }: any) {
  const [loading, setLoading] = useState(false);

  const Row = ({ label, value }: any) => (
    <div className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800">{value || '—'}</span>
    </div>
  );

  const handleSubmit = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Creating your account...');
    try {
      const payload = {
        username: account.username,
        password: account.password,
        firstname: account.firstName,
        lastname: account.lastName,
        companyname: account.company,
        email: account.email,
        website: account.website,
        address1: account.address1,
        address2: account.address2,
        city: account.city,
        state: account.state,
        countryId: Number(account.countryId),
        zipcode: account.zipcode,
        telephone: account.telephone,
        currency: account.currency,
        
        // Billing/Card Details
        cardType: billing.cardType,
        cardNo: (billing.cardNumber || '').replace(/\s/g, ''),
        expDate: billing.expiryMonth && billing.expiryYear ? `${billing.expiryMonth}/${billing.expiryYear}` : null,
        cvv: billing.cvv,
        billingAddress1: billing.address1,
        billingAddress2: billing.address2,
        billingCity: billing.city,
        billingState: billing.state,
        billingZipcode: billing.zipcode,
        billingCountryId: billing.countryId ? Number(billing.countryId) : null
      };

      await authApi.register(payload);
      toast.dismiss(loadingToast);
      toast.success('Registration successful!');
      onSubmit();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskedCard = billing.cardNumber ? `**** **** **** ${billing.cardNumber.replace(/\s/g, '').slice(-4)}` : '—';

  return (
    <div>
      <h1 className="text-xl font-black text-slate-900">Confirm Your Details</h1>
      <p className="text-slate-400 text-xs mb-1">Step 4 of 4</p>
      <ProgressBar step={4} />

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Account Information</p>
          <Row label="Name" value={`${account.firstName} ${account.lastName}`} />
          <Row label="Username" value={account.username} />
          <Row label="Email" value={account.email} />
          <Row label="Company" value={account.company} />
          <Row label="Website" value={account.website} />
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Address & Contact</p>
          <Row label="Address" value={`${account.address1}${account.address2 ? ', ' + account.address2 : ''}`} />
          <Row label="Location" value={`${account.city}, ${account.state} ${account.zipcode}`} />
          <Row label="Phone" value={account.telephone} />
          <Row label="Currency" value={account.currency} />
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Billing Information</p>
          <Row label="Card Number" value={maskedCard} />
          <Row label="Card Type" value={billing.cardType} />
          <Row label="Expiry" value={billing.expiryMonth && billing.expiryYear ? `${billing.expiryMonth}/${billing.expiryYear}` : '—'} />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={onBack} disabled={loading} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all">Back</button>
        <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-cyan-200 active:scale-[0.98] uppercase tracking-widest disabled:opacity-50">
          {loading ? 'Processing...' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ onDashboard, onLogin }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdf4 50%, #fafafa 75%, #f5f3ff 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center max-w-sm w-full">
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
  const [countries, setCountries] = useState<Country[]>([]);

  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [account, setAccount] = useState({
    firstName: '', lastName: '', company: '', website: '', email: '', username: '', password: '', confirmPassword: '',
    address1: '', address2: '', city: '', state: '', countryId: '', zipcode: '', telephone: '', currency: 'USD',
    useSameAddressForBilling: false
  });
  const [billing, setBilling] = useState({
    cardType: 'Visa', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '',
    address1: '', address2: '', city: '', state: '', countryId: '', zipcode: ''
  });

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await countriesApi.getCountries();
        setCountries(data);
      } catch (error) {
        console.error('Failed to fetch countries', error);
      }
    };
    fetchCountries();
  }, []);

  if (success) return <SuccessScreen onDashboard={() => navigate('/')} onLogin={() => navigate('/login')} />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdf4 50%, #fafafa 75%, #f5f3ff 100%)' }}>
      <div className="flex w-full max-w-5xl min-h-[550px] rounded-2xl shadow-2xl overflow-hidden bg-white">
        <Sidebar step={step} />
        <div className="flex-1 bg-white px-8 py-6 overflow-y-auto max-h-[90vh] flex flex-col justify-center">
          {step === 1 && <Step1 data={account} setData={setAccount} countries={countries} onNext={() => {
            if (account.useSameAddressForBilling) {
              setBilling(prev => ({
                ...prev,
                address1: account.address1,
                address2: account.address2,
                city: account.city,
                state: account.state,
                countryId: account.countryId,
                zipcode: account.zipcode
              }));
            }
            if (account.email === verifiedEmail) {
              setStep(3);
            } else {
              setStep(2);
            }
          }} />}
          {step === 2 && <Step2VerifyEmail data={account} onNext={() => {
            setVerifiedEmail(account.email);
            setStep(3);
          }} onBack={() => setStep(1)} />}
          {step === 3 && <Step3Billing data={billing} setData={setBilling} countries={countries} onNext={() => setStep(4)} onBack={() => {
            if (account.email === verifiedEmail) {
              setStep(1);
            } else {
              setStep(2);
            }
          }} />}
          {step === 4 && <Step4Confirm account={account} billing={billing} onBack={() => setStep(3)} onSubmit={() => setSuccess(true)} />}
        </div>
      </div>
    </div>
  );
}
