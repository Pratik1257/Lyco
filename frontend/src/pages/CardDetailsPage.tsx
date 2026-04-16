import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CreditCard, User, MapPin, Globe, CreditCard as CardIcon, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { cardsApi, type CardDetail } from '../api/cardsApi';
import { customersApi } from '../api/customersApi';
import { pricesApi } from '../api/pricesApi';
import { Button } from '../components/ui/Button';
import CustomSelect from '../components/ui/CustomSelect';

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

  // Split expiry parts for local state
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  // Fetch reference data
  const { data: users = [] } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: async () => {
        const res = await fetch('/api/Users/dropdown');
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json() as Promise<{ userId: number, username: string }[]>;
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

  // Fetch card data if in Edit mode
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

  // Combine month and year whenever they change
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
      toast.success(isEdit ? 'Card details updated.' : 'Card details added.');
      navigate('/customers/card-summary');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setFormError(`Failed: ${msg}`);
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
      setFormError("User is required.");
      return;
    }
    mutation.mutate(formData);
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0');
    return { value: m, label: m };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => {
    const y = (currentYear + i).toString();
    return { value: y, label: y };
  });

  const cardTypes = [
    { value: 'Visa', label: 'Visa' },
    { value: 'Mastercard', label: 'Mastercard' },
    { value: 'American Express', label: 'American Express' },
    { value: 'Discover', label: 'Discover' },
    { value: 'UnionPay', label: 'UnionPay' }
  ];

  const inputClass = "w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium text-gray-900 placeholder:text-gray-400";
  const labelClass = "block text-[13px] font-bold text-gray-700 ml-1";

  if (isEdit && isCardLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto py-6">
      
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
            <button 
                onClick={() => navigate('/customers/card-summary')}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-cyan-600 transition-colors mb-2 uppercase tracking-tight"
            >
                <ChevronLeft size={14} /> Back to Summary
            </button>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{isEdit ? 'Edit Card Details' : 'Customer Credit Card Details'}</h1>
            <p className="text-gray-500 mt-0.5 text-sm font-medium">Manage payment methods and card information for your clients.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col">
          
          <div className="px-8 py-8">
            
            {formError && (
              <div className="mb-8 text-red-600 text-sm font-medium flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            {/* ─────────── Section 1: Identity & Ownership ─────────── */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center border border-cyan-200/50 shadow-sm">
                  <User size={16} className="text-cyan-700" />
                </div>
                <h4 className="text-sm font-bold text-gray-800">Identity & Ownership</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-11">
                <div>
                  <CustomSelect
                    label="Username"
                    value={formData.userId || ''}
                    onChange={(val) => setFormData(p => ({ ...p, userId: val ? Number(val) : null }))}
                    options={users.map(u => ({ value: u.userId, label: u.username }))}
                    placeholder="Choose Username"
                    required
                    menuPlacement="bottom"
                  />
                </div>
                <div>
                   <label className={labelClass}>Register Address?</label>
                   <div className="mt-2.5 flex items-center gap-4 ml-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer group">
                        <input 
                            type="radio" 
                            name="asRegistered" 
                            value="Y" 
                            checked={formData.asRegistered === 'Y'} 
                            onChange={handleInputChange} 
                            className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"
                        />
                        <span className="group-hover:text-cyan-600 transition-colors">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer group">
                        <input 
                            type="radio" 
                            name="asRegistered" 
                            value="N" 
                            checked={formData.asRegistered === 'N'} 
                            onChange={handleInputChange} 
                            className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"
                        />
                        <span className="group-hover:text-cyan-600 transition-colors">No</span>
                      </label>
                   </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100/80 my-8 ml-11"></div>

            {/* ─────────── Section 2: Card Information ─────────── */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center border border-violet-200/50 shadow-sm">
                  <CardIcon size={16} className="text-violet-700" />
                </div>
                <h4 className="text-sm font-bold text-gray-800">Card Information</h4>
              </div>
              <div className="space-y-6 ml-11">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CustomSelect
                        label="Card Type"
                        value={formData.cardType || ''}
                        onChange={(val) => setFormData(p => ({ ...p, cardType: val as string }))}
                        options={cardTypes}
                        placeholder="Choose Card Type"
                        menuPlacement="bottom"
                    />
                    <div>
                        <label className={labelClass}>Card No.</label>
                        <input type="text" name="cardNo" placeholder="xxxx xxxx xxxx xxxx" value={formData.cardNo || ''} onChange={handleInputChange} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Expiry Date</label>
                        <div className="grid grid-cols-2 gap-4">
                            <CustomSelect
                                value={expMonth}
                                onChange={setExpMonth}
                                options={months}
                                placeholder="Month"
                                menuPlacement="bottom"
                            />
                            <CustomSelect
                                value={expYear}
                                onChange={setExpYear}
                                options={years}
                                placeholder="Year"
                                menuPlacement="bottom"
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>CVV/CVS</label>
                        <input type="text" name="cvv" placeholder="123" value={formData.cvv || ''} onChange={handleInputChange} className="w-24 h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium text-gray-900" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}>First Name</label>
                        <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleInputChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Middle Name</label>
                        <input type="text" name="middlename" value={formData.middlename || ''} onChange={handleInputChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} className={inputClass} />
                    </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100/80 my-8 ml-11"></div>

            {/* ─────────── Section 3: Billing Address ─────────── */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center border border-amber-200/50 shadow-sm">
                  <MapPin size={16} className="text-amber-700" />
                </div>
                <h4 className="text-sm font-bold text-gray-800">Billing Address</h4>
              </div>
              <div className="space-y-6 ml-11">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Address Line 1</label>
                    <input type="text" name="address1" placeholder="123 Billing St" value={formData.address1 || ''} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Address Line 2</label>
                    <input type="text" name="address2" value={formData.address2 || ''} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className={labelClass}>City</label>
                    <input type="text" name="city" value={formData.city || ''} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <CustomSelect
                        label="Country"
                        value={formData.countryId || ''}
                        onChange={(val) => setFormData(p => ({ ...p, countryId: val ? Number(val) : null }))}
                        options={countries.map(c => ({ value: c.countryId, label: c.countryName }))}
                        placeholder="Choose Country"
                        menuPlacement="bottom"
                    />
                  <div>
                    <label className={labelClass}>Postal Code</label>
                    <input type="text" name="postcode" value={formData.postcode || ''} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>State/Territory</label>
                    <input type="text" name="state" value={formData.state || ''} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <CustomSelect
                        label="Currency"
                        value={formData.currency || 'USD'}
                        onChange={(val) => setFormData(p => ({ ...p, currency: val as string }))}
                        options={currencies.map(c => ({ value: c.code, label: `${c.symbol}, ${c.code}, ${c.name}` }))}
                        menuPlacement="bottom"
                    />
                </div>
                <div>
                  <label className={labelClass}>Comments</label>
                  <textarea 
                    name="comments" 
                    value={formData.comments || ''} 
                    onChange={handleInputChange} 
                    rows={3} 
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                   />
                </div>
              </div>
            </div>

          </div>

          {/* ── Footer Actions ── */}
          <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
            <Button variant="secondary" type="button" onClick={() => navigate('/customers/card-summary')} className="px-6 py-2.5 rounded-lg font-bold text-sm">Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              className="px-8 py-2.5 rounded-lg font-bold text-sm"
              disabled={mutation.isPending}
              isLoading={mutation.isPending}
            >
              {isEdit ? 'Save Changes' : 'Save Card Details'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
