import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, ShieldCheck,
  MapPin, User, CreditCard as CardIcon,
  Info, Sparkles, CheckCircle2, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

import { cardsApi, type CardDetail } from '../api/cardsApi';
import { customersApi } from '../api/customersApi';
import { pricesApi } from '../api/pricesApi';
import { Button } from '../components/ui/Button';
import CustomSelect from '../components/ui/CustomSelect';
import apiClient from '../api/apiClient';

export default function CardDetailsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cardId = searchParams.get('id');
  const isEdit = !!cardId;

  const [formData, setFormData] = useState<Partial<CardDetail>>({
    userId: null,
    cardType: 'Visa',
    cardNo: '',
    expDate: '',
    cvv: '',
    asRegistered: 'Y',
    firstName: '',
    middlename: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    countryId: null,
    currency: 'USD',
    comments: ''
  });

  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch reference data
  const { data: users = [] } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: async () => {
      const res = await apiClient.get('/Users/dropdown');
      return res.data as { id: number, username: string, firstname?: string, lastname?: string }[];
    }
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: customersApi.getCountries,
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: pricesApi.getCurrencies,
  });

  const { data: existingCard, isLoading: isCardLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => cardsApi.getCardById(Number(cardId)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingCard) {
      setFormData(existingCard);
      if (existingCard.expDate) {
        const [m, y] = existingCard.expDate.split('/');
        setExpMonth(m || '');
        setExpYear(y || '');
      }
    }
  }, [existingCard]);

  useEffect(() => {
    if (expMonth && expYear) {
      setFormData(prev => ({ ...prev, expDate: `${expMonth}/${expYear}` }));
    } else {
      setFormData(prev => ({ ...prev, expDate: '' }));
    }
  }, [expMonth, expYear]);

  const mutation = useMutation({
    mutationFn: (data: Partial<CardDetail>) =>
      isEdit ? cardsApi.updateCard(Number(cardId), data) : cardsApi.createCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success(isEdit ? 'Customer card updated successfully' : 'Customer card saved successfully');
      navigate('/customers/card-summary');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setFormError(`Configuration Failure: ${msg}`);
      toast.error(msg);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    // Numeric shielding for financial fields
    if (name === 'cardNo' || name === 'cvv') {
      value = value.replace(/\D/g, ''); // Strip non-digits
    }

    // Capitalize first letter for name fields
    if (['firstName', 'middlename', 'lastName', 'state', 'city'].includes(name) && value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.userId) errors.userId = 'Please associate an account';
    
    if (!formData.cardNo) {
      errors.cardNo = 'Card number is required';
    } else if (formData.cardNo.length < 13 || formData.cardNo.length > 19) {
      errors.cardNo = 'Card number must be 13-19 digits';
    }

    if (!expMonth || !expYear) errors.expDate = 'Expiry is required';
    
    if (!formData.cvv) {
      errors.cvv = 'CVV is required';
    } else if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      errors.cvv = 'CVV must be 3-4 digits';
    }

    if (!formData.firstName) errors.firstName = 'First name is required';
    // Middle name is optional
    if (!formData.lastName) errors.lastName = 'Last name is required';
    if (!formData.address1) errors.address1 = 'Billing address is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.state) errors.state = 'State / Territory is required';
    if (!formData.countryId) errors.countryId = 'Country is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateForm()) {
      setFormError('Validation Error: Please review required metrics.');
      return;
    }
    mutation.mutate(formData);
  };

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString().padStart(2, '0'), label: (i + 1).toString().padStart(2, '0') })), []);
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ value: (currentYear + i).toString(), label: (currentYear + i).toString() })), [currentYear]);

  const cardTypes = [
    { value: 'Visa', label: 'Visa' },
    { value: 'Mastercard', label: 'Mastercard' },
    { value: 'American Express', label: 'American Express' },
    { value: 'Discover', label: 'Discover' },
    { value: 'UnionPay', label: 'UnionPay' }
  ];

  const isFormComplete = !!(
    formData.userId &&
    formData.cardNo &&
    expMonth &&
    expYear &&
    formData.cvv &&
    formData.firstName &&
    formData.lastName &&
    formData.address1 &&
    formData.city &&
    formData.state &&
    formData.countryId
  );

  const premiumInput = "w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400";
  const sectionLabel = (colorClass: string) => `flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${colorClass} mb-2`;

  const renderError = (name: string) => {
    if (!fieldErrors[name]) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{fieldErrors[name]}</span>
      </div>
    );
  };

  if (isEdit && isCardLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 py-5">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <form 
            onSubmit={handleSubmit} 
            noValidate
            className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
          >
            <div className="p-6 sm:p-7 space-y-5">
              
              {formError && (
                <div className="text-red-600 text-sm font-bold flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100/50 animate-in zoom-in-95">
                  <AlertCircle size={20} /> {formError}
                </div>
              )}

              {/* Section 1 — Account Linkage */}
              <section>
                <h4 className={sectionLabel('text-cyan-800/50')}><User size={12} /> Account Association</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4 items-end">
                  <div className="md:col-span-5 space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Username <span className="text-red-500">*</span></label>
                    <CustomSelect
                      value={formData.userId || ''}
                      onChange={(val) => setFormData(p => ({ ...p, userId: val ? Number(val) : null }))}
                      options={users.map(u => ({ 
                        value: u.id, 
                        label: u.username 
                      }))}
                      placeholder="Select Username"
                      error={fieldErrors.userId}
                    />
                  </div>
                  <div className="md:col-span-7 flex items-center gap-3 py-2 px-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-slate-700">Financial Linkage Ready</p>
                      <p className="text-[11px] text-slate-500 font-medium">Card telemetry will be bound to this verified identity.</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* Section 2 — Payment Matrix Configuration */}
              <section>
                <h4 className={sectionLabel('text-blue-800/50')}><CardIcon size={12} /> Payment Matrix Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Card Type <span className="text-red-500">*</span></label>
                    <CustomSelect
                      value={formData.cardType || ''}
                      onChange={(val) => setFormData(p => ({ ...p, cardType: val as string }))}
                      options={cardTypes}
                      placeholder="Select Type"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Card Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="cardNo"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={formData.cardNo || ''}
                      onChange={handleInputChange}
                      className={`${premiumInput} ${fieldErrors.cardNo ? 'border-red-500 ring-4 ring-red-500/5' : ''}`}
                    />
                    {renderError('cardNo')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Security Code (CVV) <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      name="cvv"
                      placeholder="•••"
                      maxLength={4}
                      value={formData.cvv || ''}
                      onChange={handleInputChange}
                      className={`${premiumInput} tracking-widest ${fieldErrors.cvv ? 'border-red-500 ring-4 ring-red-500/5' : ''}`}
                    />
                    {renderError('cvv')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4 pt-4 mt-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Expiry Period <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <CustomSelect value={expMonth} onChange={setExpMonth} options={months} placeholder="MM" menuPlacement="top" error={fieldErrors.expDate} />
                      <CustomSelect value={expYear} onChange={setExpYear} options={years} placeholder="YYYY" menuPlacement="top" error={fieldErrors.expDate} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">First Name <span className="text-red-500">*</span></label>
                    <input type="text" name="firstName" placeholder="As on card" value={formData.firstName || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.firstName ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('firstName')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Middle Name</label>
                    <input type="text" name="middlename" value={formData.middlename || ''} onChange={handleInputChange} className={premiumInput} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.lastName ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('lastName')}
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* Section 3 — Billing Residency */}
              <section>
                <h4 className={sectionLabel('text-amber-800/50')}><MapPin size={12} /> Billing Residency</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Address Line 1 <span className="text-red-500">*</span></label>
                    <input type="text" name="address1" placeholder="Street address or P.O. Box" value={formData.address1 || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.address1 ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('address1')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Address Line 2</label>
                    <input type="text" name="address2" placeholder="Suite, floor, etc" value={formData.address2 || ''} onChange={handleInputChange} className={premiumInput} />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">City <span className="text-red-500">*</span></label>
                    <input type="text" name="city" placeholder="Locality" value={formData.city || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.city ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('city')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">State / Territory <span className="text-red-500">*</span></label>
                    <input type="text" name="state" placeholder="Province / State" value={formData.state || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.state ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('state')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Country <span className="text-red-500">*</span></label>
                    <CustomSelect
                      value={formData.countryId || ''}
                      onChange={(val) => setFormData(p => ({ ...p, countryId: val ? Number(val) : null }))}
                      options={countries.map(c => ({ value: c.countryId, label: c.countryName }))}
                      placeholder="Select Country"
                      menuPlacement="top"
                      error={fieldErrors.countryId}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">ZIP / Postcode</label>
                    <input type="text" name="postcode" placeholder="Postal Code" value={formData.postcode || ''} onChange={handleInputChange} className={premiumInput} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Currency Association</label>
                    <CustomSelect
                      value={formData.currency || 'USD'}
                      onChange={(val) => setFormData(p => ({ ...p, currency: val as string }))}
                      options={currencies.map(c => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
                      menuPlacement="top"
                    />
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              <section>
                <h4 className={sectionLabel('text-slate-800/50')}><Info size={12} /> Supplementary Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4">
                  <div className="md:col-span-8 space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Comments</label>
                    <textarea 
                      name="comments" 
                      placeholder="Internal financial notes..." 
                      value={formData.comments || ''} 
                      onChange={handleInputChange} 
                      className={`${premiumInput} h-24 py-3 resize-none`} 
                    />
                  </div>
                  <div className="md:col-span-4 self-center p-5 bg-cyan-50/40 rounded-2xl border border-cyan-100/50">
                    <div className="flex items-center gap-2 text-cyan-700 font-bold text-[11px] uppercase tracking-wider mb-2">
                      <Sparkles size={14} /> Audit Trail
                    </div>
                    <p className="text-[11px] text-cyan-800/60 font-medium leading-relaxed">
                      Notes entered here are restricted to internal financial auditing and will never be exposed to the end customer.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Bottom Actions */}
            <div className="bg-slate-50/50 p-6 sm:p-7 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
                <ShieldCheck size={18} className="text-cyan-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 max-w-[200px] leading-tight">
                  High-Encryption vault activated for PCI-DSS compliance.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={isEdit ? () => navigate('/customers/card-summary') : () => setFormData({ userId: null, cardType: 'Visa', cardNo: '', expDate: '', cvv: '', asRegistered: 'Y', firstName: '', middlename: '', lastName: '', address1: '', address2: '', city: '', state: '', postcode: '', countryId: null, currency: 'USD', comments: '' })}
                  className="text-[11px] font-black uppercase text-slate-400 hover:text-cyan-700 tracking-widest transition-colors px-6"
                >
                  {isEdit ? 'Cancel' : 'Reset'}
                </button>
                <Button
                  variant="primary"
                  type="submit"
                  className={`w-full sm:w-auto px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-white border-0 ${
                    !isFormComplete || mutation.isPending
                      ? 'bg-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-xl shadow-cyan-500/20 active:scale-[0.98]'
                  }`}
                  disabled={!isFormComplete || mutation.isPending}
                  isLoading={mutation.isPending}
                >
                  <span className="mt-[-1px]">
                    {isEdit ? 'Update Profile' : 'Save Profile'}
                  </span>
                </Button>
              </div>
            </div>
          </form>

          <button 
            type="button"
            onClick={() => navigate('/customers/card-summary')}
            className="mt-8 mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-cyan-600 transition-colors"
          >
            <ChevronLeft size={14} /> Back to card summary
          </button>
        </div>
      </div>
    </div>
  );
}
