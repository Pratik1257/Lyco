import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Building2, Globe, Phone, MapPin,
  ShieldCheck, Save, CreditCard,
  Building, MapPinned, Hash, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { customersApi, type Customer, type Country } from '../../api/customersApi';

export default function MyProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [profile, setProfile] = useState<Partial<Customer>>({
    firstname: '',
    lastname: '',
    companyname: '',
    websiteUrl: '',
    primaryEmail: '',
    telephone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipcode: '',
    countryId: null,
    currency: 'USD',
    accountEmail: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedUser = localStorage.getItem('lyco_user');
        if (!savedUser) {
          navigate('/login');
          return;
        }
        const { userId } = JSON.parse(savedUser);

        const [userData, countryList] = await Promise.all([
          customersApi.getCustomerById(userId),
          customersApi.getCountries()
        ]);

        setProfile(userData);
        setCountries(countryList);
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const loadingToast = toast.loading('Updating profile...');

    try {
      const savedUser = localStorage.getItem('lyco_user');
      if (!savedUser) return;
      const { userId } = JSON.parse(savedUser);

      const updated = await customersApi.updateCustomer(userId, profile);

      // Update local storage if name changed
      const currentLocal = JSON.parse(savedUser);
      localStorage.setItem('lyco_user', JSON.stringify({
        ...currentLocal,
        fullname: `${updated.firstname} ${updated.lastname}`.trim()
      }));

      toast.dismiss(loadingToast);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'countryId' ? Number(value) : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  const inp = "w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400";
  const labelCls = "block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Basic Info */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <User size={16} className="text-cyan-500" /> Basic Information
                </h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className={labelCls}>Username</label>
                  <div className="relative">
                    <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-600" />
                    <input name="username" value={profile.username} readOnly className={`${inp} cursor-not-allowed opacity-75 bg-slate-100/50 border-cyan-100`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Primary Email</label>
                  <div className="relative">
                    <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-600" />
                    <input type="email" name="primaryEmail" value={profile.primaryEmail} readOnly className={`${inp} cursor-not-allowed opacity-75 bg-slate-100/50 border-cyan-100`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>First Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="firstname" value={profile.firstname} onChange={handleInput} className={inp} placeholder="First Name" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Last Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="lastname" value={profile.lastname} onChange={handleInput} className={inp} placeholder="Last Name" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Company Name</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="companyname" value={profile.companyname} onChange={handleInput} className={inp} placeholder="Company Name" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Website URL</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="websiteUrl" value={profile.websiteUrl} onChange={handleInput} className={inp} placeholder="https://example.com" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Telephone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="telephone" value={profile.telephone} onChange={handleInput} className={inp} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Account Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" name="accountEmail" value={profile.accountEmail} onChange={handleInput} className={inp} placeholder="accounts@example.com" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <MapPinned size={16} className="text-cyan-500" /> Address Details
                </h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className={labelCls}>Address Line 1</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input name="address1" value={profile.address1} onChange={handleInput} className={inp} placeholder="Street Address" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Address Line 2</label>
                    <div className="relative">
                      <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input name="address2" value={profile.address2} onChange={handleInput} className={inp} placeholder="Suite / Apt" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className={labelCls}>City</label>
                    <input name="city" value={profile.city} onChange={handleInput} className={inp.replace('pl-10', 'pl-4')} placeholder="City" />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>State / Province</label>
                    <input name="state" value={profile.state} onChange={handleInput} className={inp.replace('pl-10', 'pl-4')} placeholder="State" />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Zip / Postal Code</label>
                    <div className="relative">
                      <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input name="zipcode" value={profile.zipcode} onChange={handleInput} className={inp} placeholder="Zipcode" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className={labelCls}>Country</label>
                    <select
                      name="countryId"
                      value={profile.countryId || ''}
                      onChange={handleInput}
                      className={inp.replace('pl-10', 'pl-4')}
                    >
                      <option value="">Select Country</option>
                      {countries.map(c => (
                        <option key={c.countryId} value={c.countryId}>{c.countryName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Preferred Currency</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select name="currency" value={profile.currency} onChange={handleInput} className={inp}>
                        <option value="USD">USD - US Dollar</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status & Actions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-6 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-cyan-500/20">
                {profile.firstname?.[0]}{profile.lastname?.[0]}
              </div>
              <h3 className="text-xl font-black text-slate-900">{profile.firstname} {profile.lastname}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{profile.userType}</p>

              <div className="mt-8 pt-8 border-t border-slate-50 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-medium px-2">
                  <span className="text-slate-400 uppercase tracking-wider">Account Status</span>
                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-black">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium px-2">
                  <span className="text-slate-400 uppercase tracking-wider">Verification</span>
                  <span className="text-slate-900 font-black">VERIFIED</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-10 py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>

            <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-cyan-500/20">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <CreditCard size={20} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider mb-2">Billing Method</h4>
              <p className="text-white/70 text-xs leading-relaxed mb-6 font-medium">
                Manage your saved credit cards and billing preferences in the Payment Center.
              </p>
              <button
                type="button"
                onClick={() => navigate(isAdmin ? '/admin/card-details' : '/card-details')}
                className="w-full py-3 bg-white text-cyan-700 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
              >
                Manage Cards
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
