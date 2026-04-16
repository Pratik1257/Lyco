import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, User, MapPin, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi, type Customer } from '../api/customersApi';
import { pricesApi } from '../api/pricesApi';
import { Button } from '../components/ui/Button';
import CustomSelect from '../components/ui/CustomSelect';

export default function CustomerFormModelTwo() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (countries.length > 0 && !formData.countryId) {
      const defaultCountry = countries.find(c => 
          c.countryName.toLowerCase() === 'united states' || 
          c.countryName.toLowerCase() === 'united states of america' || 
          c.countryName === 'USA'
      );
      if (defaultCountry) {
        setFormData(prev => ({ ...prev, countryId: defaultCountry.countryId }));
      }
    }
  }, [countries]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully.');
      navigate('/customers/status'); // Redirect back to list
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setFormError(`Failed to create customer: ${msg}`);
      toast.error(`Failed to create customer: ${msg}`);
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
    createMutation.mutate(formData);
  };

  const inputClass = "w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium text-gray-900 placeholder:text-gray-400";

  return (
    <div className="max-w-[1000px] mx-auto py-6">
      
      {/* Header section outside the card */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Add New Customer</h1>
        <p className="text-gray-500 mt-1 text-sm font-medium">Create a new customer profile and setup their environment.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSaveCustomer} className="flex flex-col">
          
          <div className="px-8 py-8">
            
            {formError && (
              <div className="mb-8 text-red-600 text-sm font-medium flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

          {/* ─────────── Section 1: Personal Information ─────────── */}
          <div className="p-8 bg-[#fcfdfe] border border-gray-100 shadow-sm rounded-2xl mb-8 transition-all hover:border-cyan-100/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <User size={22} className="text-cyan-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 tracking-tight">Personal Information</h4>
                <p className="text-xs text-gray-500 font-medium">Basic identifying details and company affiliation</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">First Name</label>
                <input type="text" name="firstname" placeholder="John" value={formData.firstname} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Last Name</label>
                <input type="text" name="lastname" placeholder="Doe" value={formData.lastname} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Company Name</label>
                <input type="text" name="companyname" placeholder="Acme Corp" value={formData.companyname} onChange={handleInputChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* ─────────── Section 2: Contact Details ─────────── */}
          <div className="p-8 bg-[#fcfdfe] border border-gray-100 shadow-sm rounded-2xl mb-8 transition-all hover:border-violet-100/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 tracking-tight">Contact Details</h4>
                <p className="text-xs text-gray-500 font-medium">Communication channels and digital presence</p>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Email address</label>
                <input type="email" name="primaryEmail" placeholder="john@acme.com" value={formData.primaryEmail} onChange={handleInputChange} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Telephone</label>
                  <input type="text" name="telephone" placeholder="+1 555-000-0000" value={formData.telephone} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Website URL</label>
                  <input type="url" name="websiteUrl" placeholder="https://acme.com" value={formData.websiteUrl} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* ─────────── Section 3: Address ─────────── */}
          <div className="p-8 bg-[#fcfdfe] border border-gray-100 shadow-sm rounded-2xl mb-8 transition-all hover:border-amber-100/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <MapPin size={22} className="text-amber-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 tracking-tight">Billing Address</h4>
                <p className="text-xs text-gray-500 font-medium">Physical location for accounting and shipping</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Address Line 1</label>
                  <input type="text" name="address1" placeholder="123 Digital Way" value={formData.address1} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Address Line 2</label>
                  <input type="text" name="address2" placeholder="Suite 400" value={formData.address2} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">City / Town</label>
                  <input type="text" name="city" placeholder="San Francisco" value={formData.city} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">State</label>
                  <input type="text" name="state" placeholder="CA" value={formData.state} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Zip Code</label>
                  <input type="text" name="zipcode" placeholder="94105" value={formData.zipcode} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <CustomSelect
                    label="Country"
                    value={formData.countryId || ''}
                    onChange={(val) => setFormData(p => ({ ...p, countryId: val ? Number(val) : null }))}
                    options={countries.map(c => ({ value: c.countryId, label: c.countryName }))}
                    placeholder="Select country..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─────────── Section 4: Account & Configuration ─────────── */}
          <div className="p-8 bg-[#fcfdfe] border border-gray-100 shadow-sm rounded-2xl transition-all hover:border-emerald-100/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                <Settings size={22} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 tracking-tight">Account & Configuration</h4>
                <p className="text-xs text-gray-500 font-medium">System access credentials and preferences</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Username <span className="text-red-500">*</span></label>
                  <input type="text" name="username" required value={formData.username} onChange={handleInputChange} className={`${inputClass} font-semibold text-gray-900 placeholder:text-gray-300`} placeholder="Choose a username" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Access Password</label>
                  <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <CustomSelect
                    label="Account Status"
                    value={formData.isActive || 'Y'}
                    onChange={(val) => setFormData(p => ({ ...p, isActive: val as string }))}
                    options={[
                      { value: 'Y', label: 'Active Account' },
                      { value: 'N', label: 'Inactive Account' }
                    ]}
                    menuPlacement="bottom"
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Primary Currency"
                    value={formData.currency || 'USD'}
                    onChange={(val) => setFormData(p => ({ ...p, currency: val as string }))}
                    options={currencies.map(c => ({ value: c.code, label: `${c.symbol}, ${c.code}, ${c.name}` }))}
                    menuPlacement="bottom"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 ml-1 mb-2">Billing Notification Email</label>
                <input type="email" name="accountEmail" placeholder="billing@acme.com" value={formData.accountEmail} onChange={handleInputChange} className={inputClass} />
              </div>
            </div>
            </div>
          </div>

          {/* ── Footer Actions ── */}
          <div className="mt-8 px-8 py-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 rounded-2xl">
            <Button variant="secondary" type="button" onClick={() => navigate('/customers/status')} className="px-6 py-2.5 rounded-lg font-bold text-sm">Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              className="px-8 py-2.5 rounded-lg font-bold text-sm"
              disabled={!formData.username?.trim() || createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              Create Customer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
