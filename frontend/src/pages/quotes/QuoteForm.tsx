import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Mail, Hash, DollarSign, PenTool, Layers,
  Maximize2, Paperclip, ChevronLeft, Link, Info, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { quotesApi } from '../../api/quotesApi';
import { servicesApi } from '../../api/servicesApi';
import { customersApi } from '../../api/customersApi';
import { pricesApi, usersApi } from '../../api/pricesApi';
import { Button } from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import { X, FileIcon, Download } from 'lucide-react';

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['clean']
  ],
};

const quillFormats = [
  'bold', 'italic', 'underline', 'list'
];

export default function QuoteForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    uniqueNo: null as number | null,
    userId: null as number | null,
    serviceId: null as number | null,
    workTitle: '',
    instructions: '',
    fileFormat: '',
    size: '',
    sizetype: 'Inches',
    amount: '',
    currency: 'USD',
    email: '',
    companyName: '',
    quoteNo: '',
    quoteType: 'Standard',
    imageUrl: ''
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: usersApi.getUsers
  });

  // Fetch services for dropdown
  const { data: servicesData } = useQuery({
    queryKey: ['services', 1, 100],
    queryFn: () => servicesApi.getServices(1, 100)
  });
  const services = servicesData?.items || [];

  // When user is selected, fetch full details for auto-fill
  useEffect(() => {
    if (formData.userId) {
      customersApi.getCustomerById(formData.userId).then(user => {
        setFormData(prev => ({
          ...prev,
          email: user.primaryEmail || (user as any).PrimaryEmail || '',
          companyName: user.companyname || (user as any).Companyname || '',
          uniqueNo: user.uniqueNo ?? (user as any).UniqueNo ?? null,
          currency: user.currency || (user as any).Currency || 'USD'
        }));
      });
    } else {
      setFormData(prev => ({
        ...prev,
        email: '',
        companyName: '',
        uniqueNo: null
      }));
    }
  }, [formData.userId]);

  // When user and service are selected, fetch Rate
  useEffect(() => {
    const { userId, serviceId, currency } = formData;
    if (userId !== null && serviceId !== null) {
      pricesApi.getUserwisePriceLookup(userId, serviceId).then(userPrice => {
        if (userPrice !== null) {
          setFormData(prev => ({ ...prev, amount: userPrice.toString() }));
        } else {
          pricesApi.getGeneralPriceLookup(serviceId, currency).then(genPrice => {
            if (genPrice !== null) {
              setFormData(prev => ({ ...prev, amount: genPrice.toString() }));
            }
          });
        }
      });
    }
  }, [formData.userId, formData.serviceId, formData.currency]);

  // Auto-generate Quote # when uniqueNo/userId changes
  useEffect(() => {
    if (isEditMode) return;

    const { uniqueNo, userId } = formData;
    const identifier = uniqueNo || userId;

    if (identifier !== null && identifier !== undefined) {
      quotesApi.getNextQuoteNumber(identifier).then(no => {
        setFormData(prev => ({ ...prev, quoteNo: no }));
      }).catch(err => {
        console.error('Failed to fetch next quote number:', err);
      });
    } else {
      setFormData(prev => ({ ...prev, quoteNo: '' }));
    }
  }, [formData.uniqueNo, formData.userId, isEditMode]);

  // Load data for edit mode
  useEffect(() => {
    if (isEditMode) {
      quotesApi.getQuoteById(Number(id)).then(quote => {
        const matchingUser = users.find(u =>
          (u.uniqueNo && quote.uniqueNo && String(u.uniqueNo) === String(quote.uniqueNo)) ||
          (u.username && quote.username && u.username === quote.username)
        );

        const quoteData = {
          uniqueNo: quote.uniqueNo,
          userId: matchingUser ? matchingUser.id : null,
          serviceId: quote.serviceId,
          workTitle: quote.workTitle || '',
          instructions: quote.instructions || '',
          fileFormat: quote.fileFormat || '',
          size: quote.size || '',
          sizetype: quote.sizetype || 'Inches',
          amount: quote.amount || '',
          currency: quote.currency || 'USD',
          email: quote.email || '',
          companyName: quote.companyName || '',
          quoteNo: quote.quoteNo || '',
          quoteType: quote.quoteType || 'Standard',
          imageUrl: quote.imageUrl || ''
        };

        setFormData(quoteData);
        setInitialData(quoteData);
        // Assuming quotes don't have multiple files in this schema yet, but structure is ready
        setExistingFiles((quote as any).files || []);
      }).catch(() => {
        toast.error('Failed to load quote details');
        navigate('/quotes');
      });
    }
  }, [id, isEditMode, users, navigate]);

  const hasChanges = useMemo(() => {
    if (!isEditMode) return true;
    if (!initialData) return false;
    const basicInfoChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    return basicInfoChanged || selectedFiles.length > 0 || filesToDelete.length > 0;
  }, [formData, initialData, isEditMode, selectedFiles.length, filesToDelete.length]);

  const isFormValid = useMemo(() => {
    return !!(
      formData.userId &&
      formData.serviceId &&
      formData.workTitle && formData.workTitle.trim().length > 0 &&
      formData.amount && formData.amount.toString().trim().length > 0
    );
  }, [formData]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        files: selectedFiles,
        filesToDelete: filesToDelete
      };

      return isEditMode
        ? quotesApi.updateQuote(Number(id), payload)
        : quotesApi.createQuote(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success(isEditMode ? 'Quote updated successfully' : 'Quote placed successfully');
      navigate('/quotes');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || err.message);
      toast.error('Failed to save quote');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: Record<string, string> = {};
    if (!formData.userId) errors.userId = 'User is required';
    if (!formData.serviceId) errors.serviceId = 'Service is required';
    // PO/Artwork Name Validation
    if (!formData.workTitle) {
      errors.workTitle = 'PO/Artwork Name is required';
    } else if (formData.workTitle.trim().length < 1) {
      errors.workTitle = 'PO/Artwork Name is required';
    }

    // Email Validation with Typo Detection
    const validateEmail = (email: string, fieldName: string, label: string) => {
      if (!email) return true;
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

    if (formData.email) {
      validateEmail(formData.email, 'email', 'Email');
    }

    if (!formData.amount) {
      errors.amount = 'Rate is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) < 0) {
      errors.amount = 'Please enter a valid positive number';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fix the errors before submitting.');
      return;
    }

    mutation.mutate(formData);
  };

  const premiumInput = "w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400";

  const renderError = (name: string) => {
    if (!fieldErrors[name]) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
        <span className="text-[11px] font-medium text-red-500 leading-none">
          {fieldErrors[name]}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-5">
      <div className="w-full px-4 sm:px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
          >
            <div className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="text-red-600 text-sm font-bold flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100/50 animate-in zoom-in-95">
                  <AlertCircle size={20} /> {formError}
                </div>
              )}

              {/* Main Fields */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-6">

                {/* --- Row 1 (Username, Company Name, Quote #) --- */}
                <div className="space-y-1 lg:col-span-4">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Username <span className="text-red-500">*</span></label>
                  <CustomSelect
                    value={formData.userId || ''}
                    onChange={(val) => {
                      setFormData(p => ({ ...p, userId: val ? Number(val) : null }));
                      setFieldErrors(p => { const n = { ...p }; delete n.userId; return n; });
                    }}
                    options={(Array.isArray(users) ? users : []).map(u => ({
                      value: u.id,
                      label: `${u.username}${u.firstname || u.lastname ? ` (${[u.firstname, u.lastname].filter(Boolean).join(' ')})` : ''}`
                    }))}
                    placeholder="Choose Username"
                    error={fieldErrors.userId}
                    isDisabled={isEditMode}
                  />
                </div>

                <div className="space-y-1 lg:col-span-4">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Company Name</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto-fills from account"
                    value={formData.companyName}
                    className={`${premiumInput} bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed`}
                  />
                </div>

                <div className="space-y-1 lg:col-span-4">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Quote #</label>
                  <div className="relative group">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      readOnly
                      placeholder="Auto-generated"
                      value={formData.quoteNo}
                      className={`${premiumInput} pl-10 bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed`}
                    />
                  </div>
                </div>

                {/* --- Row 2 (Service, Rate, PO / Artwork Name, File Format Required) --- */}
                <div className="space-y-1 lg:col-span-3">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Service <span className="text-red-500">*</span></label>
                  <CustomSelect
                    value={formData.serviceId || ''}
                    onChange={(val) => {
                      setFormData(p => ({ ...p, serviceId: val ? Number(val) : null }));
                      setFieldErrors(p => { const n = { ...p }; delete n.serviceId; return n; });
                    }}
                    options={(Array.isArray(services) ? services : []).map(s => ({ value: s.id, label: s.name || 'Unknown' }))}
                    placeholder="Choose Service"
                    error={fieldErrors.serviceId}
                  />
                </div>

                <div className="space-y-1 lg:col-span-2">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Rate <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                    <input
                      type="text"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setFormData(p => ({ ...p, amount: val }));
                          if (fieldErrors.amount) setFieldErrors(p => { const n = { ...p }; delete n.amount; return n; });
                        }
                      }}
                      className={`${premiumInput} pl-10 ${fieldErrors.amount ? 'border-red-500 ring-red-500/10' : ''}`}
                    />
                  </div>
                  {renderError('amount')}
                </div>

                <div className="space-y-1 lg:col-span-4">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">PO / Artwork Name <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <PenTool className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                    <input
                      type="text"
                      placeholder="Enter PO or Artwork Name"
                      value={formData.workTitle}
                      onChange={(e) => {
                        setFormData(p => ({ ...p, workTitle: e.target.value }));
                        if (fieldErrors.workTitle) setFieldErrors(p => { const n = { ...p }; delete n.workTitle; return n; });
                      }}
                      className={`${premiumInput} pl-10 ${fieldErrors.workTitle ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {renderError('workTitle')}
                </div>

                <div className="space-y-1 lg:col-span-3">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">File Format Required</label>
                  <div className="relative group">
                    <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. DST, PES, AI"
                      value={formData.fileFormat}
                      onChange={(e) => setFormData(p => ({ ...p, fileFormat: e.target.value }))}
                      className={`${premiumInput} pl-10`}
                    />
                  </div>
                </div>

                {/* --- Row 3 (Size, Email) --- */}
                <div className="space-y-1 lg:col-span-6">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Size & Dimensions</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group min-w-0">
                      <Maximize2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={14} />
                      <input
                        type="text"
                        placeholder="4.5x2.1"
                        value={formData.size}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.x*]/gi, '');
                          setFormData(p => ({ ...p, size: val }));
                        }}
                        className={`${premiumInput} pl-8 text-[13px]`}
                      />
                    </div>
                    <div className="w-[120px] shrink-0">
                      <CustomSelect
                        value={formData.sizetype}
                        onChange={(val) => setFormData(p => ({ ...p, sizetype: val }))}
                        options={[
                          { value: 'Inches', label: 'Inches' },
                          { value: 'CM', label: 'CM' },
                          { value: 'MM', label: 'MM' }
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 lg:col-span-6">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                    <input
                      type="text"
                      placeholder="name@domain.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData(p => ({ ...p, email: e.target.value }));
                        if (fieldErrors.email) setFieldErrors(p => { const n = { ...p }; delete n.email; return n; });
                      }}
                      className={`${premiumInput} pl-10 ${fieldErrors.email ? 'border-red-500 ring-4 ring-red-500/5' : ''}`}
                    />
                  </div>
                  {renderError('email')}
                </div>
              </section>

              {/* Instruction Section */}
              <section className="space-y-1">
                <label className="block text-[13px] font-semibold text-slate-900 ml-1">Instruction</label>
                <div className="quill-premium-editor">
                  <ReactQuill
                    theme="snow"
                    value={formData.instructions}
                    onChange={(content) => setFormData(p => ({ ...p, instructions: content }))}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter specific instructions for the design team..."
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10 transition-all"
                  />
                </div>
              </section>

              {/* Attachments Section */}
              <section className="space-y-4">
                <label className="block text-[13px] font-semibold text-slate-900 ml-1">Attachments (Upto 30 MB)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center transition-all hover:border-cyan-400 hover:bg-cyan-50/30 group cursor-pointer"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setSelectedFiles(prev => [...prev, ...files]);
                      }
                    }}
                    multiple
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-3 group-hover:scale-110 transition-transform">
                    <Paperclip size={20} className="text-slate-400 group-hover:text-cyan-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Click to upload or drag and drop</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Maximum 30 MB per file (JPG, PNG, PDF, AI, PSD)</p>
                </div>

                {/* Professional Message for Large Files */}
                <div className="flex items-center gap-3 py-2 px-4 bg-cyan-50/50 border border-cyan-100/50 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                    <Info size={14} className="text-cyan-600" />
                  </div>
                  <p className="text-[12px] text-cyan-800 leading-relaxed font-medium">
                    For assets exceeding <span className="font-bold">30MB</span>, please provide a direct transfer link (e.g., Google Drive, or Dropbox) in the field below to ensure optimal processing.
                  </p>
                </div>

                {/* External Link Input */}
                <div className="space-y-1">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Asset Transfer Link (for large files)</label>
                  <div className="relative group">
                    <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                    <input
                      type="url"
                      placeholder="https://wetransfer.com/downloads/..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(p => ({ ...p, imageUrl: e.target.value }))}
                      className={`${premiumInput} pl-10`}
                    />
                  </div>
                </div>

                {(selectedFiles.length > 0 || existingFiles.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {/* Existing Files */}
                    {existingFiles.map((file, idx) => (
                      <div key={`existing-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                            <FileIcon size={16} className="text-slate-500" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-bold text-slate-700 truncate">{file.fileName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Existing File</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5193'}${file.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-full bg-white hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 flex items-center justify-center transition-colors shadow-sm"
                            title="Download"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setFilesToDelete(prev => [...prev, file.orderFileId]);
                              setExistingFiles(prev => prev.filter(f => f.orderFileId !== file.orderFileId));
                            }}
                            className="w-7 h-7 rounded-full bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* New Files */}
                    {selectedFiles.map((file, idx) => (
                      <div key={`new-${idx}`} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                            <FileIcon size={16} className="text-cyan-600" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-bold text-slate-700 truncate">{file.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="w-7 h-7 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Actions */}
            <div className="bg-slate-50/80 p-5 sm:p-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
              <button
                type="button"
                onClick={() => navigate('/quotes')}
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={mutation.isPending}
                  disabled={!hasChanges || !isFormValid}
                  className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 px-10 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditMode ? 'Update Quote' : 'Create Quote'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
