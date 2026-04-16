import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle, User, MapPin, Settings,
  ChevronLeft, Phone, ShieldCheck,
  Sparkles, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

import { customersApi, type Customer } from '../api/customersApi';
import { pricesApi } from '../api/pricesApi';
import { Button } from '../components/ui/Button';
import CustomSelect from '../components/ui/CustomSelect';
import ProfilePreview from '../components/customers/ProfilePreview';

export default function CustomerFormModelTwo() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('id');
  const isEdit = !!customerId;

  const [formData, setFormData] = useState<Partial<Customer>>({
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    companyname: '',
    primaryEmail: '',
    telephone: '',
    city: '',
    state: '',
    websiteUrl: '',
    address1: '',
    address2: '',
    zipcode: '',
    countryId: null,
    currency: 'USD',
    accountEmail: '',
    isActive: 'Y'
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Fetch reference data for dropdowns
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: customersApi.getCountries,
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: pricesApi.getCurrencies,
  });

  // Fetch customer data if in Edit mode
  const { data: existingCustomer, isLoading: isCustomerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.getCustomerById(Number(customerId)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingCustomer) {
      setFormData(existingCustomer);
    }
  }, [existingCustomer]);

  useEffect(() => {
    if (countries.length > 0 && !formData.countryId && !isEdit) {
      const defaultCountry = countries.find(c =>
        c.countryName.toLowerCase() === 'united states' ||
        c.countryName.toLowerCase() === 'united states of america' ||
        c.countryName === 'USA'
      );
      if (defaultCountry) {
        setFormData(prev => ({ ...prev, countryId: defaultCountry.countryId }));
      }
    }
  }, [countries, isEdit]);

  const mutation = useMutation({
    mutationFn: (data: Partial<Customer>) =>
      isEdit ? customersApi.updateCustomer(Number(customerId), data) : customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEdit ? 'Customer identity updated successfully' : 'New customer profile established');
      navigate('/customers/status');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setFormError(`Configuration Error: ${msg}`);
      toast.error(msg);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username?.trim()) {
      setFormError("Identity alias (username) is required.");
      return;
    }
    mutation.mutate(formData);
  };

  const premiumInput = "w-full h-11 px-4 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 backdrop-blur-sm";
  const sectionLabel = (colorClass: string) => `flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] ${colorClass} mb-4`;

  if (isEdit && isCustomerLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-cyan-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col lg:flex-row gap-12 items-start">

        {/* ── Left Sidebar: Profile Visualization ── */}
        <div className="w-full lg:w-[450px] space-y-8 lg:sticky lg:top-24 animate-in fade-in slide-in-from-left duration-700">
          <div className="space-y-4">
            <Link
              to="/customers/status"
              className="inline-flex items-center gap-2 text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors bg-cyan-50 px-3 py-1.5 rounded-full"
            >
              <ChevronLeft size={14} /> Back to Repository
            </Link>
            {/* <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {isEdit ? 'Modify Merchant Identity' : 'New Customer Establishment'}
            </h1> */}

          </div>

          <ProfilePreview
            firstname={formData.firstname || ''}
            lastname={formData.lastname || ''}
            companyname={formData.companyname || ''}
            email={formData.primaryEmail || ''}
            website={formData.websiteUrl || ''}
            isActive={formData.isActive || 'Y'}
            username={formData.username || ''}
          />

          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 border border-white shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-700">Identity Integrity</p>
                <p className="text-[11px] text-slate-500 font-medium">Verified Merchant Profile System</p>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-800/40">
              <Sparkles size={14} className="text-cyan-500" />
              Real-time digital ID card synchronization
            </div>
          </div>
        </div>

        {/* ── Right Panel: The High-Fidelity Form ── */}
        <div className="flex-1 w-full animate-in fade-in slide-in-from-right duration-700 delay-100">
          <form onSubmit={handleSaveCustomer} className="relative bg-white/70 backdrop-blur-2xl rounded-[32px] border border-white shadow-2xl shadow-cyan-900/5 p-8 sm:p-12 overflow-hidden">

            {/* Soft decorative background glows */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-100/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-100/30 rounded-full blur-3xl pointer-events-none" />

            {formError && (
              <div className="mb-10 text-red-600 text-sm font-bold flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100/50 animate-in zoom-in-95">
                <AlertCircle size={20} /> {formError}
              </div>
            )}

            <div className="space-y-12">

              {/* Section 1 — Personal Identification */}
              <section className="pb-12 border-b border-slate-100">
                <h4 className={sectionLabel('text-cyan-800/50')}><User size={12} /> Personal Identification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">First Name</label><input type="text" name="firstname" placeholder="First Name" value={formData.firstname || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">Last Name</label><input type="text" name="lastname" placeholder="Last Name" value={formData.lastname || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  <div className="md:col-span-2 space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">Company Name</label><input type="text" name="companyname" placeholder="Entity Legal Name" value={formData.companyname || ''} onChange={handleInputChange} className={premiumInput} /></div>
                </div>
              </section>

              {/* Section 2 — Communication */}
              <section className="pb-12 border-b border-slate-100">
                <h4 className={sectionLabel('text-violet-800/50')}><Phone size={12} /> Communication Matrix</h4>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">Primary Email Registry</label><input type="email" name="primaryEmail" placeholder="name@domain.com" value={formData.primaryEmail || ''} onChange={handleInputChange} className={premiumInput} /></div>
                    <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">Voice / Telephone</label><input type="text" name="telephone" placeholder="+1 (000) 000-0000" value={formData.telephone || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  </div>
                  <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">Website URL</label><input type="url" name="websiteUrl" placeholder="https://www.corporate.com" value={formData.websiteUrl || ''} onChange={handleInputChange} className={premiumInput} /></div>
                </div>
              </section>

              {/* Section 3 — Billing Residency */}
              <section className="pb-12 border-b border-slate-100">
                <h4 className={sectionLabel('text-amber-800/50')}><MapPin size={12} /> Billing Residency</h4>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">Address Line 1</label><input type="text" name="address1" placeholder="Street address or P.O. Box" value={formData.address1 || ''} onChange={handleInputChange} className={premiumInput} /></div>
                    <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">Address Line 2 (Optional)</label><input type="text" name="address2" placeholder="Suite, floor, etc" value={formData.address2 || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">City</label><input type="text" name="city" placeholder="Locality" value={formData.city || ''} onChange={handleInputChange} className={premiumInput} /></div>
                    <CustomSelect
                      label="Country"
                      value={formData.countryId || ''}
                      onChange={(val) => setFormData(p => ({ ...p, countryId: val ? Number(val) : null }))}
                      options={countries.map(c => ({ value: c.countryId, label: c.countryName }))}
                      placeholder="Select Country"
                    />
                    <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">ZIP / Postcode</label><input type="text" name="zipcode" placeholder="Postal Code" value={formData.zipcode || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">State / Territory</label><input type="text" name="state" placeholder="Region or Province" value={formData.state || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  </div>
                </div>
              </section>

              {/* Section 4 — Account Configuration */}
              <section>
                <h4 className={sectionLabel('text-emerald-800/50')}><Settings size={12} /> Access & Logic Configuration</h4>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-bold text-slate-700 ml-1"> Username<span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="username"
                        required
                        value={formData.username || ''}
                        onChange={handleInputChange}
                        className={`${premiumInput} ring-4 ring-cyan-500/5`}
                        placeholder="Username"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-bold text-slate-700 ml-1">{isEdit ? 'Change Password' : 'Password'}</label>
                      <input type="password" name="password" placeholder="••••••••" value={formData.password || ''} onChange={handleInputChange} className={premiumInput} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <CustomSelect
                      label="Status Protocol"
                      value={formData.isActive || 'Y'}
                      onChange={(val) => setFormData(p => ({ ...p, isActive: val as string }))}
                      options={[
                        { value: 'Y', label: 'Active' },
                        { value: 'N', label: 'Inactive' }
                      ]}
                    />
                    <CustomSelect
                      label="Currency"
                      value={formData.currency || 'USD'}
                      onChange={(val) => setFormData(p => ({ ...p, currency: val as string }))}
                      options={currencies.map(c => ({ value: c.code, label: `${c.symbol}, ${c.code}, ${c.name}` }))}
                    />
                    <div className="space-y-1.5"><label className="block text-[13px] font-bold text-slate-700 ml-1">Billing Notification Email</label><input type="email" name="accountEmail" placeholder="accounts@merchant.com" value={formData.accountEmail || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  </div>
                </div>
              </section>

              {/* Actions */}
              <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100">
                <div className="flex items-center gap-3 text-slate-400 group cursor-help">
                  <Info size={16} />
                  <p className="text-xs font-bold leading-tight max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity">Profile parameters will be propagated across all financial nodes once established.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate('/customers/status')}
                    className="text-xs font-black uppercase text-slate-400 hover:text-cyan-700 tracking-widest transition-colors px-6"
                  >
                    Reset
                  </button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-full sm:w-auto px-12 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all"
                    disabled={mutation.isPending || (!formData.username?.trim())}
                    isLoading={mutation.isPending}
                  >
                    {isEdit ? 'Edit Customer' : 'Add Customer'}
                  </Button>
                </div>
              </div>

            </div>
          </form>

          <div className="mt-8 px-4 flex justify-between items-center text-[10px] text-cyan-800/30 font-black uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Registry Handshake Protocol Active
            </div>
            <div>Lyco Core Entity Node 8.4</div>
          </div>
        </div>

      </div>
    </div>
  );
}
