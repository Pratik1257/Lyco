import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, User, MapPin, Settings, Eye, EyeOff, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import _PhoneInput from 'react-phone-input-2';
const PhoneInput = (_PhoneInput as any).default || _PhoneInput;
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber } from 'libphonenumber-js';

import { customersApi, type Customer } from '../../api/customersApi';
import { pricesApi } from '../../api/pricesApi';
import { Button } from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';


export default function CustomerForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('id');
  const isEdit = !!customerId;
  const [showPassword, setShowPassword] = useState(false);

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      let errorMessage = 'An unexpected validation error occurred.';
      
      if (err.response?.status === 400 && err.response?.data) {
        const data = err.response.data;
        if (data.errors) {
          const modelErrors: Record<string, string> = {};
          Object.keys(data.errors).forEach(key => {
            const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
            modelErrors[fieldName] = data.errors[key][0];
          });
          setFieldErrors(modelErrors);
          errorMessage = 'Identity verification failed. Please review the highlighted fields.';
        } else if (data.message || data.Message) {
          errorMessage = data.message || data.Message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else {
          errorMessage = JSON.stringify(data);
        }
      } else {
        errorMessage = err.response?.data?.error || err.message || 'Configuration Error';
      }
      
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;

    // Apply numeric and hyphen restriction for ZIP code
    if (name === 'zipcode') {
      value = value.replace(/[^0-9-]/g, '');
    }

    // Strictly prevent typing numbers and special characters for name and location fields
    if (['firstname', 'lastname', 'city', 'state'].includes(name)) {
      value = value.replace(/[^a-zA-Z\s'-]/g, '');
    }

    // Strictly prevent typing spaces and most special characters for username
    // Allowed: letters, numbers, dots, underscores
    if (name === 'username') {
      value = value.replace(/[^a-zA-Z0-9._]/g, '');
    }

    // Prevent special characters in company name but allow letters and numbers
    if (name === 'companyname') {
      value = value.replace(/[^a-zA-Z0-9\s&.,'-]/g, '');
    }


    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleWebsiteBlur = () => {
    let url = formData.websiteUrl?.trim() || '';
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it looks like a domain before adding https
      const domainRegex = /^([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
      if (domainRegex.test(url)) {
        setFormData(prev => ({ ...prev, websiteUrl: `https://${url}` }));
      }
    }
  };

  const handleReset = () => {
    if (isEdit && existingCustomer) {
      setFormData(existingCustomer);
    } else {
      setFormData({
        username: '',
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
        currency: '',
        accountEmail: '',
        isActive: 'Y'
      });
    }
    setFieldErrors({});
    setFormError(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const req = (name: string, label: string) => {
      const val = formData[name as keyof Customer]?.toString().trim();
      if (!val) {
        errors[name] = `Please enter ${label.toLowerCase()}`;
        return false;
      }
      return true;
    };

    const alphaNumRegex = /^[a-zA-Z0-9][a-zA-Z0-9._]*$/;

    if (req('username', 'Username')) {
      if (!alphaNumRegex.test(formData.username!)) {
        errors.username = 'Must start with letter/number and use only letters, numbers, dots, or underscores';
      } else if (formData.username!.includes('__')) {
        errors.username = 'Double underscores are not allowed';
      }
    }
    req('firstname', 'First Name');
    req('lastname', 'Last Name');

    // Email Validation with Typo Detection
    const validateEmail = (email: string, fieldName: string, label: string) => {
      if (!email) return true;
      // Robust regex that prevents consecutive dots and invalid characters like commas
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email) || email.includes(',.') || email.includes('.,')) {
        errors[fieldName] = `Please enter a valid ${label.toLowerCase()}`;
        return false;
      }
      if (email.length > 150) {
        errors[fieldName] = `${label} cannot exceed 150 characters`;
        return false;
      }
      const domainMap: Record<string, string> = {
        'gmal.com': 'gmail.com',
        'gmil.com': 'gmail.com',
        'hotmal.com': 'hotmail.com',
        'yaho.com': 'yahoo.com',
        'outlok.com': 'outlook.com'
      };
      const domain = email.split('@')[1]?.toLowerCase();
      if (domainMap[domain]) {
        errors[fieldName] = `Typo detected? Did you mean @${domainMap[domain]}?`;
        return false;
      }
      return true;
    };

    if (req('primaryEmail', 'Email')) {
      validateEmail(formData.primaryEmail!, 'primaryEmail', 'Email');
    }

    req('companyname', 'Company Name');
    // Telephone validation using libphonenumber-js
    if (!formData.telephone || formData.telephone === '+') {
      errors.telephone = 'Please enter telephone number';
    } else {
      try {
        const fullPhone = formData.telephone.startsWith('+') ? formData.telephone : `+${formData.telephone}`;
        if (!isValidPhoneNumber(fullPhone)) {
          errors.telephone = 'Invalid phone number for selected country';
        }
      } catch (e) {
        errors.telephone = 'Invalid phone number format';
      }
    }
    if (req('address1', 'Address')) {
      if (formData.address1!.length < 5) errors.address1 = 'Address must be at least 5 characters';
    }
    if (req('city', 'City')) {
      if (formData.city!.length < 2) errors.city = 'City must be at least 2 characters';
    }
    if (req('state', 'State')) {
      if (formData.state!.length < 2) errors.state = 'State / Territory must be at least 2 characters';
    }

    if (req('zipcode', 'ZIP / Postcode')) {
      // Find if selected country is US (assuming United States or USA)
      const isUS = countries.find(c => c.countryId === formData.countryId)?.countryName.toLowerCase().includes('united states') || 
                   countries.find(c => c.countryId === formData.countryId)?.countryName === 'USA';
      
      if (isUS) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(formData.zipcode!)) {
          errors.zipcode = 'Invalid ZIP code';
        }
      } else {
        if (formData.zipcode!.length < 4) errors.zipcode = 'Postcode must be at least 4 characters';
        if (formData.zipcode!.length > 10) errors.zipcode = 'Postcode cannot exceed 10 characters';
      }
    }

    if (!formData.countryId) errors.countryId = 'Please select a country';
    if (!formData.currency) errors.currency = 'Please select a currency';

    // Length and specific checks
    const checkLen = (f: string, max: number, lbl: string) => {
      const v = formData[f as keyof Customer]?.toString() || '';
      if (v.length > max) errors[f] = `${lbl} cannot exceed ${max} characters`;
    };

    checkLen('username', 50, 'Username');
    checkLen('firstname', 100, 'First Name');
    checkLen('lastname', 100, 'Last Name');
    checkLen('companyname', 200, 'Company Name');
    checkLen('address1', 255, 'Address Line 1');
    checkLen('address2', 255, 'Address Line 2');
    checkLen('city', 100, 'City');
    checkLen('state', 100, 'State / Territory');
    checkLen('zipcode', 20, 'ZIP / Postcode');
    checkLen('zipcode', 20, 'ZIP / Postcode');
    
    // Website Validation
    if (formData.websiteUrl) {
      const url = formData.websiteUrl.trim();
      // Strict URL regex that blocks emails and random text
      const websiteRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
      if (!websiteRegex.test(url) || url.includes('@') || url.includes(',.')) {
        errors.websiteUrl = 'Please enter a valid website URL';
      }
      checkLen('websiteUrl', 200, 'Website URL');
    }

    if (formData.username && formData.username.length < 3) errors.username = 'Username must be at least 3 characters';
    if (formData.username && /\s/.test(formData.username)) errors.username = 'Username cannot contain spaces';
    if (formData.firstname && formData.firstname.length < 3) errors.firstname = 'First Name must be at least 3 characters';
    if (formData.lastname && formData.lastname.length < 3) errors.lastname = 'Last Name must be at least 3 characters';
    if (formData.companyname && formData.companyname.length < 3) errors.companyname = 'Company Name must be at least 3 characters';

    // Password check
    if (!isEdit) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else {
        const p = formData.password;
        const hasUpper = /[A-Z]/.test(p);
        const hasNum = /[0-9]/.test(p);
        const hasSpecial = /[@#$%^&*]/.test(p);
        const hasLen = p.length >= 8 && p.length <= 100;

        if (!hasUpper || !hasNum || !hasSpecial || !hasLen) {
          errors.password = 'requirements_not_met';
        }
      }
    }

    // Billing Notification Email validation (if provided)
    if (formData.accountEmail) {
      validateEmail(formData.accountEmail, 'accountEmail', 'Account email');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!validateForm()) {
      setFormError('Action Required: Please complete the mandatory fields correctly.');
      return;
    }
    mutation.mutate(formData);
  };

  const premiumInput = "w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400";
  const sectionLabel = (colorClass: string) => `flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${colorClass} mb-2`;

  const renderError = (name: string) => {
    if (!fieldErrors[name]) return null;

    if (name === 'password' && fieldErrors.password === 'requirements_not_met') {
      return (
        <div className="mt-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[13px] font-semibold text-red-500 mb-2">Password does not meet requirements</p>
          {[
            { label: '8-100 characters', met: (formData.password?.length || 0) >= 8 },
            { label: 'At least one uppercase letter', met: /[A-Z]/.test(formData.password || '') },
            { label: 'At least one number', met: /[0-9]/.test(formData.password || '') },
            { label: 'At least one special character (@#$%^&*)', met: /[@#$%^&*]/.test(formData.password || '') }
          ].map((req, i) => (
            <div key={i} className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span className="text-[12px] font-medium text-red-500/90 leading-none">{req.label}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
        <span className="text-[11px] font-medium text-red-500 leading-none">
          {fieldErrors[name]}
        </span>
      </div>
    );
  };

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
    <div className="min-h-screen bg-slate-50/50 py-5">
      <div className="w-full px-4 sm:px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <form
            onSubmit={handleSaveCustomer}
            noValidate
            className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
          >
            <div className="p-6 sm:p-7 space-y-5">
              <style>{`
                .lyco-phone-container { width: 100% !important; }
                .lyco-phone-container .form-control:focus { border-color: #06b6d4 !important; box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.05) !important; }
                .phone-input-error .form-control { border-color: #ef4444 !important; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.05) !important; }
                .react-tel-input .selected-flag { background: transparent !important; width: 42px !important; }
                .react-tel-input .flag-dropdown { border: none !important; background: transparent !important; }
                .react-tel-input .country-list { border-radius: 1rem !important; border: 1px solid #f1f5f9 !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important; }
                .react-tel-input .country-list .country:hover { background-color: #f8fafc !important; }
                .react-tel-input .country-list .country.highlight { background-color: #ecfeff !important; color: #0891b2 !important; }
                 .react-tel-input .search-box { 
                   padding: 8px 10px !important; 
                   margin: 0 !important; 
                   background: #f8fafc !important; 
                   border-radius: 1rem 1rem 0 0 !important; 
                   border-bottom: 1px solid #f1f5f9 !important;
                 }
                 .react-tel-input .search-box { 
                   background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") no-repeat 12px center / 16px 16px !important;
                   border: 1px solid #e2e8f0 !important; 
                   border-radius: 8px !important; 
                   font-size: 13px !important; 
                   padding-left: 36px !important;
                   padding-right: 10px !important;
                   padding-top: 6px !important;
                   padding-bottom: 6px !important;
                   width: 100% !important; 
                   outline: none !important; 
                   color: #1e293b !important;
                 }
                 .react-tel-input .search-box:focus { border-color: #06b6d4 !important; box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.05) !important; }
                .react-tel-input .search-box input:focus { border-color: #06b6d4 !important; box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.05) !important; }
              `}</style>
              {formError && (
                <div className="text-red-600 text-sm font-bold flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100/50 animate-in zoom-in-95">
                  <AlertCircle size={20} /> {formError}
                </div>
              )}

              {/* Section 1 — Identification & Communication */}
              <section>
                <h4 className={sectionLabel('text-cyan-800/50')}><User size={12} /> Personal Identification</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                  {/* Row 1 */}
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">First Name <span className="text-red-500">*</span></label>
                    <input type="text" name="firstname" maxLength={100} placeholder="First Name" value={formData.firstname || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.firstname ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('firstname')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" name="lastname" maxLength={100} placeholder="Last Name" value={formData.lastname || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.lastname ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('lastname')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" name="primaryEmail" maxLength={150} placeholder="name@domain.com" value={formData.primaryEmail || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.primaryEmail ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('primaryEmail')}
                  </div>

                  {/* Row 2 */}
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Company Name <span className="text-red-500">*</span></label>
                    <input type="text" name="companyname" maxLength={200} placeholder="Entity Legal Name" value={formData.companyname || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.companyname ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('companyname')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Telephone <span className="text-red-500">*</span></label>
                    <div className={fieldErrors.telephone ? 'phone-input-error' : ''}>
                      <PhoneInput
                        country={'us'}
                        value={formData.telephone || ''}
                        onChange={(value: string) => {
                          setFormData(prev => ({ ...prev, telephone: `+${value}` }));
                          if (fieldErrors.telephone) {
                            setFieldErrors(prev => { const n = { ...prev }; delete n.telephone; return n; });
                          }
                        }}
                        containerClass="lyco-phone-container"
                        inputClass="!w-full !h-10 !bg-white !border !border-slate-200 !rounded-xl !text-sm !font-medium !text-slate-800 !pl-12 focus:!ring-4 focus:!ring-cyan-500/5 focus:!border-cyan-500 !transition-all"
                        buttonClass="!bg-transparent !border-none !rounded-l-xl !pl-2"
                        dropdownClass="!rounded-2xl !shadow-2xl !border-slate-100 !mt-2"
                        searchClass="!bg-slate-50 !border-slate-200 !rounded-lg"
                        enableSearch
                        disableSearchIcon={true}
                        menuPlacement="top"
                      />
                    </div>
                    {renderError('telephone')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Website URL</label>
                    <input 
                      type="text" 
                      name="websiteUrl" 
                      maxLength={200} 
                      placeholder="e.g. google.com" 
                      value={formData.websiteUrl || ''} 
                      onChange={handleInputChange} 
                      onBlur={handleWebsiteBlur}
                      className={`${premiumInput} ${fieldErrors.websiteUrl ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} 
                    />
                    {renderError('websiteUrl')}
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* Section 3 — Billing Residency */}
              <section>
                <h4 className={sectionLabel('text-amber-800/50')}><MapPin size={12} /> Billing Residency</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Address Line 1 <span className="text-red-500">*</span></label>
                    <input type="text" name="address1" maxLength={255} placeholder="Street address" value={formData.address1 || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.address1 ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('address1')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Address Line 2</label>
                    <input type="text" name="address2" maxLength={255} placeholder="Suite, floor, etc" value={formData.address2 || ''} onChange={handleInputChange} className={premiumInput} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">City <span className="text-red-500">*</span></label>
                    <input type="text" name="city" maxLength={100} placeholder="Locality" value={formData.city || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.city ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('city')}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">State / Territory <span className="text-red-500">*</span></label>
                    <input type="text" name="state" maxLength={100} placeholder="Region or Province" value={formData.state || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.state ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('state')}
                  </div>
                  <CustomSelect
                    label="Country"
                    required
                    menuPlacement="top"
                    value={formData.countryId || ''}
                    onChange={(val) => {
                      setFormData(p => ({ ...p, countryId: val ? Number(val) : null }));
                      setFieldErrors(p => { const n = { ...p }; delete n.countryId; return n; });
                    }}
                    options={countries.map(c => ({ value: c.countryId, label: c.countryName }))}
                    placeholder="Select Country"
                    error={fieldErrors.countryId}
                  />
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">ZIP / Postcode <span className="text-red-500">*</span></label>
                    <input type="text" name="zipcode" maxLength={20} placeholder="Postal Code" value={formData.zipcode || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.zipcode ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('zipcode')}
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* Section 4 — Account Configuration */}
              <section>
                <h4 className={sectionLabel('text-slate-800/50')}><Settings size={12} /> Access & Logic Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Username <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="username" 
                      maxLength={50} 
                      placeholder="Enter Username" 
                      value={formData.username || ''} 
                      onChange={handleInputChange} 
                      disabled={isEdit}
                      className={`${premiumInput} ${isEdit ? 'bg-slate-50 text-slate-500 cursor-not-allowed select-none' : ''} ${fieldErrors.username ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} 
                    />
                    {renderError('username')}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Password {!isEdit && <span className="text-red-500">*</span>}</label>
                    <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        maxLength={100}
                        placeholder={isEdit ? '••••••••' : 'Enter Password'}
                        value={formData.password || ''}
                        onChange={handleInputChange}
                        className={`${premiumInput} pr-12 ${fieldErrors.password ? 'border-red-500 ring-4 ring-red-500/5' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all duration-200"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {renderError('password')}
                  </div>

                  <CustomSelect
                    label="Financial Currency"
                    required
                    menuPlacement="top"
                    value={formData.currency || ''}
                    onChange={(val) => {
                      setFormData(p => ({ ...p, currency: val as string }));
                      setFieldErrors(p => { const n = { ...p }; delete n.currency; return n; });
                    }}
                    options={currencies.map(c => ({
                      value: c.code,
                      label: `${c.symbol}, ${c.code}, ${c.name}`
                    }))}
                    placeholder="Select Currency"
                    error={fieldErrors.currency}
                  />
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Account Email</label>
                    <input type="email" name="accountEmail" maxLength={150} placeholder="accounts@merchant.com" value={formData.accountEmail || ''} onChange={handleInputChange} className={`${premiumInput} ${fieldErrors.accountEmail ? 'border-red-500 ring-4 ring-red-500/5' : ''}`} />
                    {renderError('accountEmail')}
                  </div>
                </div>
              </section>
            </div>

            {/* Actions */}
            <div className="bg-slate-50/50 border-t border-slate-100 p-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate('/customers/status')}
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft size={16} /> Cancel
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
                {!isEdit && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] font-black uppercase text-slate-400 hover:text-cyan-700 tracking-widest transition-colors px-6"
                  >
                    Reset
                  </button>
                )}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-full sm:w-auto px-12 py-4 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-200 tracking-[0.02em] active:scale-[0.98] transition-all flex items-center justify-center leading-none"
                  disabled={
                    mutation.isPending || 
                    !formData.username?.trim() || 
                    !formData.firstname?.trim() || 
                    !formData.lastname?.trim() || 
                    !formData.companyname?.trim() || 
                    !formData.primaryEmail?.trim() || 
                    !formData.address1?.trim() || 
                    !formData.city?.trim() || 
                    !formData.state?.trim() || 
                    !formData.zipcode?.trim() || 
                    !formData.countryId || 
                    !formData.currency?.trim() || 
                    (!isEdit && !formData.password?.trim())
                  }
                  isLoading={mutation.isPending}
                >
                  <span className="mt-[-1px]">
                    {isEdit ? 'Update Profile' : 'Save Profile'}
                  </span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
