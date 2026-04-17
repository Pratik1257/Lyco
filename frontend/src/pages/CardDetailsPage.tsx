import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle, ChevronLeft, ShieldCheck,
  MapPin, User, CreditCard as CardIcon,
  Info, Sparkles, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { cardsApi, type CardDetail } from '../api/cardsApi';
import { customersApi } from '../api/customersApi';
import { pricesApi } from '../api/pricesApi';
import { Button } from '../components/ui/Button';
import CustomSelect from '../components/ui/CustomSelect';
import CardPreview from '../components/cards/CardPreview';

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
  const [isFlipped, setIsFlipped] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch reference data
  const { data: users = [] } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: async () => {
      const res = await fetch('/api/Users/dropdown');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json() as Promise<{ userId: number, username: string, firstname?: string, lastname?: string }[]>;
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
      toast.success(isEdit ? 'Security profile updated successfully' : 'New security profile created');
      navigate('/customers/card-summary');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setFormError(`Configuration Error: ${msg}`);
      toast.error(msg);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) {
      setFormError("Identity association is required.");
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

  const premiumInput = "w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400";
  const sectionLabel = "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-800/40 mb-5";
  const microCard = "bg-slate-50/40 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 sm:p-8 transition-all hover:bg-slate-50/60";

  if (isEdit && isCardLoading) {
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
    <div className="max-w-[1200px] mx-auto py-8 px-4 sm:px-6">
      <div className="mb-10 flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <Link
            to="/customers/card-summary"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-600 transition-colors mb-4"
          >
            <ChevronLeft size={12} /> Back to Repository
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {isEdit ? 'Modify Security Profile' : 'Financial Profile Configuration'}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-cyan-800/40 font-black uppercase tracking-[0.2em] bg-cyan-50/50 px-3 py-1.5 rounded-full border border-cyan-100/50">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          Security Gateway Active
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {formError && (
            <div className="text-red-600 text-sm font-bold flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100/50 animate-in zoom-in-95">
              <AlertCircle size={20} /> {formError}
            </div>
          )}

          {/* Account Association */}
          <section className={microCard}>
            <h4 className={sectionLabel}><User size={12} /> Account Association</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
              <div className="md:col-span-5">
                <CustomSelect
                  label="Full Name"
                  value={formData.userId || ''}
                  onChange={(val) => setFormData(p => ({ ...p, userId: val ? Number(val) : null }))}
                  options={users.map(u => ({ 
                    value: u.userId, 
                    label: u.firstname || u.lastname ? `${u.firstname} ${u.lastname}` : u.username 
                  }))}
                  placeholder="Choose Full Name"
                  required
                />
              </div>
              <div className="md:col-span-7 flex items-center gap-3 pb-3 border-l border-slate-200/50 pl-8">
                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Financial Linkage Active</p>
                  <p className="text-[11px] text-slate-500 font-medium">Selected identity will be bound to this payment matrix.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Matrix */}
          <section className={microCard}>
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="flex-1 space-y-8">
                <h4 className={sectionLabel}><CardIcon size={12} /> Payment Matrix Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CustomSelect
                    label="Card Type"
                    value={formData.cardType || ''}
                    onChange={(val) => setFormData(p => ({ ...p, cardType: val as string }))}
                    options={cardTypes}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Card Number</label>
                    <input
                      type="text"
                      name="cardNo"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={formData.cardNo || ''}
                      onChange={handleInputChange}
                      className={premiumInput}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Expiry Period</label>
                    <div className="grid grid-cols-2 gap-3">
                      <CustomSelect value={expMonth} onChange={setExpMonth} options={months} placeholder="Month" />
                      <CustomSelect value={expYear} onChange={setExpYear} options={years} placeholder="Year" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Security Code (CVV)</label>
                    <input
                      type="password"
                      name="cvv"
                      placeholder="•••"
                      maxLength={4}
                      value={formData.cvv || ''}
                      onChange={handleInputChange}
                      onFocus={() => setIsFlipped(true)}
                      onBlur={() => setIsFlipped(false)}
                      className={`${premiumInput} tracking-widest`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200/50">
                  <div className="space-y-1.5"><label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">First Name</label><input type="text" name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  <div className="space-y-1.5"><label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Middle Name</label><input type="text" name="middlename" value={formData.middlename || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  <div className="space-y-1.5"><label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Last Name</label><input type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className={premiumInput} /></div>
                </div>
              </div>

              <div className="lg:w-[380px] shrink-0">
                <div className="sticky top-8 space-y-6">
                   <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <CardPreview
                      number={formData.cardNo || ''}
                      name={`${formData.firstName || ''} ${formData.lastName || ''}`.trim()}
                      expiryMonth={expMonth}
                      expiryYear={expYear.slice(-2)}
                      cvv={formData.cvv || ''}
                      isFlipped={isFlipped}
                      type={formData.cardType || 'Visa'}
                    />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/50 rounded-2xl border border-slate-200/50">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-700">Bank-Level Security</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-none">PCI-DSS Compliant Encryption</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Billing Origin */}
          <section className={microCard}>
            <h4 className={sectionLabel}><MapPin size={12} /> Billing Residency</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Address Line 1</label><input type="text" name="address1" placeholder="Street address or P.O. Box" value={formData.address1 || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  <div className="space-y-1.5"><label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Address Line 2 (Optional)</label><input type="text" name="address2" placeholder="Suite, unit, floor" value={formData.address2 || ''} onChange={handleInputChange} className={premiumInput} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">City</label><input type="text" name="city" placeholder="City" value={formData.city || ''} onChange={handleInputChange} className={premiumInput} /></div>
                  <CustomSelect
                    label="Country"
                    value={formData.countryId || ''}
                    onChange={(val) => setFormData(p => ({ ...p, countryId: val ? Number(val) : null }))}
                    options={countries.map(c => ({ value: c.countryId, label: c.countryName }))}
                    placeholder="Country"
                  />
                  <div className="space-y-1.5"><label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">ZIP / Postcode</label><input type="text" name="postcode" placeholder="Code" value={formData.postcode || ''} onChange={handleInputChange} className={premiumInput} /></div>
                </div>
              </div>
              <div className="md:col-span-5 space-y-6 border-l border-slate-200/50 pl-8">
                <div className="space-y-1.5"><label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">State / Territory</label><input type="text" name="state" placeholder="Region" value={formData.state || ''} onChange={handleInputChange} className={premiumInput} /></div>
                <CustomSelect
                  label="Currency Association"
                  value={formData.currency || 'USD'}
                  onChange={(val) => setFormData(p => ({ ...p, currency: val as string }))}
                  options={currencies.map(c => ({ value: c.code, label: `${c.symbol}, ${c.code}, ${c.name}` }))}
                />
              </div>
            </div>
          </section>

          {/* Remarks */}
          <section className={microCard}>
            <h4 className={sectionLabel}><Info size={12} /> Supplementary Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-8">
                <textarea
                  name="comments"
                  placeholder="Additional internal notes regarding this financial profile..."
                  value={formData.comments || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className={`${premiumInput} h-32 py-4 resize-none`}
                />
              </div>
              <div className="md:col-span-4 bg-cyan-50/30 p-5 rounded-2xl border border-cyan-100/50">
                <div className="flex items-center gap-2 text-cyan-700 font-black text-[10px] uppercase tracking-wider mb-2">
                  <Sparkles size={14} /> Note Entry Protocol
                </div>
                <p className="text-[11px] text-cyan-800/60 font-medium leading-relaxed">
                  Comments are for internal auditing only. They will not be visible to the customer during transaction processing.
                </p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100">
            <div className="flex items-center gap-3 text-slate-400">
              <Info size={16} />
              <p className="text-[11px] font-bold leading-tight max-w-[240px]">
                Profile parameters are encrypted via military-grade protocols and stored in our PCI-DSS compliant vault.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/customers/card-summary')}
                className="text-[11px] font-black uppercase text-slate-400 hover:text-cyan-700 tracking-widest transition-colors px-6"
              >
                Discard Changes
              </button>
              <Button
                variant="primary"
                type="submit"
                className="w-full sm:w-auto px-12 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all"
                disabled={mutation.isPending}
                isLoading={mutation.isPending}
              >
                {isEdit ? 'Authorize Matrix Changes' : 'Establish Financial Profile'}
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-12 px-4 text-center text-[10px] text-cyan-800/30 font-black uppercase tracking-[0.3em]">
          Lyco Financial Node V5.2 • Powered by LycoCore Secure Systems
        </div>
      </div>
    </div>
  );
}
