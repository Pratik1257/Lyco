import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, User, MapPin, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi, type Customer } from '../../api/customersApi';
import { pricesApi } from '../../api/pricesApi';
import { Button } from '../ui/Button';
import CustomSelect from '../ui/CustomSelect';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit: Customer | null;
}

export default function CustomerFormModal({ isOpen, onClose, customerToEdit }: CustomerFormModalProps) {
  const queryClient = useQueryClient();

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
    enabled: isOpen, // Only fetch if modal is open
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: pricesApi.getCurrencies,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        setFormData({
            username: customerToEdit.username || '',
            password: '',
            firstname: customerToEdit.firstname || '',
            lastname: customerToEdit.lastname || '',
            companyname: customerToEdit.companyname || '',
            primaryEmail: customerToEdit.primaryEmail || '',
            telephone: customerToEdit.telephone || '',
            city: customerToEdit.city || '',
            state: customerToEdit.state || '',
            websiteUrl: customerToEdit.websiteUrl || '',
            address1: customerToEdit.address1 || '',
            address2: customerToEdit.address2 || '',
            zipcode: customerToEdit.zipcode || '',
            countryId: customerToEdit.countryId || null,
            currency: customerToEdit.currency || 'USD',
            accountEmail: customerToEdit.accountEmail || '',
            isActive: customerToEdit.isActive || 'Y'
        });
      } else {
        const defaultCountry = countries.find(c => 
            c.countryName.toLowerCase() === 'united states' || 
            c.countryName.toLowerCase() === 'united states of america' || 
            c.countryName === 'USA'
        );
        setFormData({
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
          countryId: defaultCountry ? defaultCountry.countryId : null,
          currency: 'USD',
          accountEmail: '',
          isActive: 'Y'
        });
      }
      setFormError(null);
    }
  }, [isOpen, customerToEdit, countries]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
      toast.success('Customer created successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setFormError(`Failed to create customer: ${msg}`);
      toast.error(`Failed to create customer: ${msg}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) => customersApi.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
      toast.success('Customer updated successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setFormError(`Failed to update customer: ${msg}`);
      toast.error(`Failed to update customer: ${msg}`);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'countryId') {
      setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username?.trim()) {
        setFormError("Username is required");
        return;
    }

    if (customerToEdit?.userId) {
      updateMutation.mutate({ id: customerToEdit.userId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium text-gray-900 placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[960px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── Header ── */}
        <div className="shrink-0 px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cyan-600 to-cyan-500">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{customerToEdit ? 'Edit Customer' : 'New Customer'}</h3>
            <p className="text-[13px] text-cyan-50/90 mt-0.5">{customerToEdit ? 'Update customer profile details' : 'Register a new customer profile'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSaveCustomer} className="flex flex-col flex-1 min-h-0">
          {/* ── Scrollable Body ── */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            
            {formError && (
              <div className="mb-6 text-red-600 text-sm font-medium flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            {/* ─────────── Section 1: Personal Information ─────────── */}
            <div className="p-6 bg-[#fcfdfe] border border-gray-100 shadow-sm rounded-2xl mb-6 transition-all hover:border-cyan-100/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                  <User size={18} className="text-cyan-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-800">Personal Information</h4>
                  <p className="text-[11px] text-gray-500 font-medium">Basic identifying details</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">First Name</label>
                  <input type="text" name="firstname" placeholder="John" value={formData.firstname} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Last Name</label>
                  <input type="text" name="lastname" placeholder="Doe" value={formData.lastname} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Company Name</label>
                  <input type="text" name="companyname" placeholder="Acme Corp" value={formData.companyname} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
            </div>

            {/* ─────────── Section 2: Contact Details ─────────── */}
            <div className="p-6 bg-[#fcfdfe] border border-gray-100 shadow-sm rounded-2xl mb-6 transition-all hover:border-violet-100/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-800">Contact Details</h4>
                  <p className="text-[11px] text-gray-500 font-medium">How to reach the customer</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Email</label>
                  <input type="email" name="primaryEmail" placeholder="john@acme.com" value={formData.primaryEmail} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Telephone</label>
                    <input type="text" name="telephone" placeholder="+1 555-000-0000" value={formData.telephone} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Website URL</label>
                    <input type="url" name="websiteUrl" placeholder="https://acme.com" value={formData.websiteUrl} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* ─────────── Section 3: Address ─────────── */}
            <div className="p-6 bg-[#fcfdfe] border border-gray-100 shadow-sm rounded-2xl mb-6 transition-all hover:border-amber-100/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                  <MapPin size={18} className="text-amber-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-800">Billing Address</h4>
                  <p className="text-[11px] text-gray-500 font-medium">Physical location for invoices</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Address Line 1</label>
                    <input type="text" name="address1" placeholder="123 Digital Way" value={formData.address1} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Address Line 2</label>
                    <input type="text" name="address2" placeholder="Suite 400" value={formData.address2} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">City / Town</label>
                    <input type="text" name="city" placeholder="San Francisco" value={formData.city} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">State</label>
                    <input type="text" name="state" placeholder="CA" value={formData.state} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Zip Code</label>
                    <input type="text" name="zipcode" placeholder="94105" value={formData.zipcode} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <CustomSelect
                      label="Country"
                      value={formData.countryId || ''}
                      onChange={(val) => setFormData(p => ({ ...p, countryId: val ? Number(val) : null }))}
                      options={countries.map(c => ({ value: c.countryId, label: c.countryName }))}
                      placeholder="Select country..."
                      menuPlacement="bottom"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ─────────── Section 4: Account & Configuration ─────────── */}
            <div className="p-6 bg-[#fcfdfe] border border-gray-100 shadow-sm rounded-2xl mb-2 transition-all hover:border-emerald-100/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                  <Settings size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-800">Account & Configuration</h4>
                  <p className="text-[11px] text-gray-500 font-medium">System access and settings</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Username <span className="text-red-500">*</span></label>
                    <input type="text" name="username" required value={formData.username} onChange={handleInputChange} className={`${inputClass} font-semibold text-gray-900 placeholder:text-gray-300`} placeholder="Choose a username" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Password</label>
                    <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <CustomSelect
                      label="Status"
                      value={formData.isActive || 'Y'}
                      onChange={(val) => setFormData(p => ({ ...p, isActive: val as string }))}
                      options={[
                        { value: 'Y', label: 'Active' },
                        { value: 'N', label: 'Inactive' }
                      ]}
                      menuPlacement="bottom"
                    />
                  </div>
                  <div>
                    <CustomSelect
                      label="Currency"
                      value={formData.currency || 'USD'}
                      onChange={(val) => setFormData(p => ({ ...p, currency: val as string }))}
                      options={currencies.map(c => ({ value: c.code, label: `${c.symbol}, ${c.code}, ${c.name}` }))}
                      menuPlacement="bottom"
                      menuAlign="right"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-1.5">Account Email</label>
                  <input type="email" name="accountEmail" placeholder="billing@acme.com" value={formData.accountEmail} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
            </div>

          </div>

          {/* ── Sticky Footer ── */}
          <div className="shrink-0 px-8 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50/50">
            <Button variant="secondary" type="button" onClick={onClose} className="px-5 py-2 rounded-lg font-semibold text-sm">Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              className="px-6 py-2 rounded-lg font-semibold text-sm"
              disabled={!formData.username?.trim() || createMutation.isPending || updateMutation.isPending}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {customerToEdit ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
