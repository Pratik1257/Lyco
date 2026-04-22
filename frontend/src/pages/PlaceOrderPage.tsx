import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Briefcase, FileText,
  Mail, Hash, DollarSign, PenTool, Layers,
  Maximize2, Paperclip, ChevronLeft, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ordersApi } from '../api/ordersApi';
import { servicesApi } from '../api/servicesApi';
import { customersApi } from '../api/customersApi';
import { pricesApi, usersApi } from '../api/pricesApi';
import { Button } from '../components/ui/Button';
import CustomSelect from '../components/ui/CustomSelect';
import { X, FileIcon } from 'lucide-react';

export default function PlaceOrderPage() {
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
    orderNo: '',
    orderStatus: 'In Process'
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  // Auto-generate Order # when uniqueNo/userId changes
  useEffect(() => {
    // Skip if in edit mode
    if (isEditMode) return;

    const { uniqueNo, userId } = formData;
    const identifier = uniqueNo || userId;

    if (identifier !== null && identifier !== undefined) {
      ordersApi.getNextOrderNumber(identifier).then(no => {
        setFormData(prev => ({ ...prev, orderNo: no }));
      }).catch(err => {
        console.error('Failed to fetch next order number:', err);
      });
    } else {
      setFormData(prev => ({ ...prev, orderNo: '' }));
    }
  }, [formData.uniqueNo, formData.userId, isEditMode]);

  // Reset form when switching from edit to create mode
  useEffect(() => {
    if (!isEditMode) {
      setFormData({
        uniqueNo: null,
        userId: null,
        serviceId: null,
        workTitle: '',
        instructions: '',
        fileFormat: '',
        size: '',
        sizetype: 'Inches',
        amount: '',
        currency: 'USD',
        email: '',
        companyName: '',
        orderNo: '',
        orderStatus: 'In Process'
      });
      setFieldErrors({});
    }
  }, [isEditMode]);

  // Load data for edit mode
  useEffect(() => {
    if (isEditMode) {
      ordersApi.getOrderById(Number(id)).then(order => {
        // We need to map the user back to its userId from the users list
        // Or find it by uniqueNo
        const matchingUser = users.find(u =>
          (u.uniqueNo && order.uniqueNo && String(u.uniqueNo) === String(order.uniqueNo)) ||
          (u.username && order.username && u.username === order.username)
        );

        const orderData = {
          uniqueNo: order.uniqueNo,
          userId: matchingUser ? matchingUser.id : null,
          serviceId: order.serviceId,
          workTitle: order.workTitle || '',
          instructions: order.instructions || '',
          fileFormat: order.fileFormat || '',
          size: order.size || '',
          sizetype: order.sizetype || 'Inches',
          amount: order.amount || '',
          currency: order.currency || 'USD',
          email: order.email || '',
          companyName: order.companyName || '',
          orderNo: order.orderNo || '',
          orderStatus: order.orderStatus || 'In Process'
        };

        setFormData(orderData);
        setInitialData(orderData);
      }).catch(() => {
        toast.error('Failed to load order details');
        navigate('/orders/summary');
      });
    }
  }, [id, isEditMode, users, navigate]);

  const hasChanges = useMemo(() => {
    if (!isEditMode) return true;
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData, isEditMode]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const formDataToSend = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formDataToSend.append(key, data[key]);
        }
      });
      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      return isEditMode
        ? ordersApi.updateOrder(Number(id), formDataToSend)
        : ordersApi.createOrder(formDataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(isEditMode ? 'Order updated successfully' : 'Order placed successfully');
      navigate('/orders/summary');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || err.message);
      toast.error('Failed to place order');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Simple validation
    const errors: Record<string, string> = {};
    if (!formData.userId) errors.userId = 'User is required';
    if (!formData.serviceId) errors.serviceId = 'Service is required';
    if (!formData.workTitle) errors.workTitle = 'PO/Artwork Name is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    mutation.mutate({
      uniqueNo: formData.uniqueNo,
      orderNo: formData.orderNo,
      serviceId: formData.serviceId,
      workTitle: formData.workTitle,
      instructions: formData.instructions,
      fileFormat: formData.fileFormat,
      size: formData.size,
      sizetype: formData.sizetype,
      amount: formData.amount,
      currency: formData.currency,
      email: formData.email,
      orderStatus: formData.orderStatus
    });
  };

  const premiumInput = "w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400";
  const sectionLabel = (colorClass: string) => `flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${colorClass} mb-2`;

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
            className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden"
          >

            <div className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="text-red-600 text-sm font-bold flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100/50 animate-in zoom-in-95">
                  <AlertCircle size={20} /> {formError}
                </div>
              )}

              {/* Section 1: Identity & Service */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-4">
                  <h4 className={sectionLabel('text-cyan-800/50')}><User size={12} /> Customer Identity</h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[13px] font-semibold text-slate-900 ml-1">Username <span className="text-red-500">*</span></label>
                      <CustomSelect
                        value={formData.userId || ''}
                        onChange={(val) => {
                          setFormData(p => ({ ...p, userId: val ? Number(val) : null }));
                          setFieldErrors(p => { const n = { ...p }; delete n.userId; return n; });
                        }}
                        options={users.map(u => ({ value: u.id, label: u.username || 'Unknown' }))}
                        placeholder="Choose Username"
                        error={fieldErrors.userId}
                        isDisabled={isEditMode}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[13px] font-semibold text-slate-900 ml-1">Company Name</label>
                      <input
                        type="text"
                        readOnly
                        placeholder="Auto-fills from account"
                        value={formData.companyName}
                        className={`${premiumInput} bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[13px] font-semibold text-slate-900 ml-1">Email <span className="text-slate-400 font-normal"></span></label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                        <input
                          type="email"
                          placeholder="name@domain.com"
                          value={formData.email}
                          onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                          className={`${premiumInput} pl-10`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className={sectionLabel('text-blue-800/50')}><Briefcase size={12} /> Service Parameters</h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[13px] font-semibold text-slate-900 ml-1">Service <span className="text-red-500">*</span></label>
                      <CustomSelect
                        value={formData.serviceId || ''}
                        onChange={(val) => {
                          setFormData(p => ({ ...p, serviceId: val ? Number(val) : null }));
                          setFieldErrors(p => { const n = { ...p }; delete n.serviceId; return n; });
                        }}
                        options={services.map(s => ({ value: s.id, label: s.name || 'Unknown' }))}
                        placeholder="Choose Service"
                        error={fieldErrors.serviceId}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[13px] font-semibold text-slate-900 ml-1">Rate</label>
                      <div className="relative group">
                        <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                        <input
                          type="text"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                          className={`${premiumInput} pl-10`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[13px] font-semibold text-slate-900 ml-1">Order #</label>
                      <div className="relative group">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          readOnly
                          placeholder="Auto-generated"
                          value={formData.orderNo}
                          className={`${premiumInput} pl-10 bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed`}
                        />
                      </div>
                    </div>
                    {isEditMode && (
                      <div className="space-y-1">
                        <label className="block text-[13px] font-semibold text-slate-900 ml-1">Order Status</label>
                        <CustomSelect
                          value={formData.orderStatus}
                          onChange={(val) => setFormData(p => ({ ...p, orderStatus: val }))}
                          options={[
                            { value: 'In Process', label: 'In Process' },
                            { value: 'Cancelled', label: 'Cancelled' },
                            { value: 'Completed', label: 'Completed' },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Section 2: Order Specifics */}
              <section className="space-y-4">
                <h4 className={sectionLabel('text-amber-800/50')}><FileText size={12} /> Order Specifics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-1">
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
                  <div className="space-y-1">
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
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Size & Dimensions</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1 group">
                        <Maximize2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                        <input
                          type="text"
                          placeholder="e.g. 4.5 x 2.1"
                          value={formData.size}
                          onChange={(e) => setFormData(p => ({ ...p, size: e.target.value }))}
                          className={`${premiumInput} pl-10`}
                        />
                      </div>
                      <div className="w-32">
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
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Instruction</label>
                    <textarea
                      placeholder="Enter specific instructions for the design team..."
                      value={formData.instructions}
                      onChange={(e) => setFormData(p => ({ ...p, instructions: e.target.value }))}
                      className={`${premiumInput} h-32 py-3 resize-none`}
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Attachments */}
              <section className="space-y-4">
                <h4 className={sectionLabel('text-purple-800/50')}><Paperclip size={12} /> Attachments</h4>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                  multiple
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.ai,.psd"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-3 group-hover:scale-110 transition-transform">
                    <Paperclip size={20} className="text-slate-400 group-hover:text-cyan-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Click to upload or drag and drop</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Upto 30 MB (JPG, PNG, PDF, AI, PSD)</p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
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
            <div className="bg-slate-50/80 p-5 sm:p-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/orders/summary')}
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft size={16} /> Cancel Order
              </button>
              <div className="flex items-center gap-4">
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        uniqueNo: null, userId: null, serviceId: null, workTitle: '',
                        instructions: '', fileFormat: '', size: '', sizetype: 'Inches',
                        amount: '', currency: 'USD', email: '', companyName: '', orderNo: '',
                        orderStatus: 'In Process'
                      });
                      setSelectedFiles([]);
                    }}
                    className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-600 transition-colors"
                  >
                    Reset
                  </button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={mutation.isPending}
                  disabled={!hasChanges}
                  className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 px-10 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {isEditMode ? 'Update Order' : 'Place Order'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
