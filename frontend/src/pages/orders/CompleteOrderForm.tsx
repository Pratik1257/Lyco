import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, AlertCircle, PenTool, 
  Upload, X, File as FileIcon, Info, Link, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/ordersApi';
import { customersApi } from '../../api/customersApi';
import { Button } from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';

export default function CompleteOrderForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    userId: null as number | null,
    orderId: null as number | null,
    poNo: '',
    note: '',
    orderNo: '',
    externalLink: '',
    stitches: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => customersApi.getCustomers(1, 500)
  });
  const users = usersData?.items || [];

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['user-orders', formData.userId],
    queryFn: () => ordersApi.getOrders(1, 100, '', 'In Process', undefined, undefined, undefined),
    enabled: !!formData.userId
  });
  // Filter orders manually if API doesn't support UniqueNo yet (or as extra safety)
  const userOrders = useMemo(() => {
    return ordersData?.items || [];
  }, [ordersData]);
  
  const selectedOrder = useMemo(() => {
    return userOrders.find(o => o.orderId === formData.orderId);
  }, [userOrders, formData.orderId]);

  const isDigitizing = selectedOrder?.serviceName === 'Digitizing';
  const calculatedAmount = useMemo(() => {
    if (!isDigitizing || !formData.stitches || isNaN(Number(formData.stitches)) || !selectedOrder?.amount) {
      return selectedOrder?.amount || '0';
    }
    const rate = Number(selectedOrder.amount);
    const count = Number(formData.stitches);
    return ((count / 1000) * rate).toFixed(2);
  }, [isDigitizing, formData.stitches, selectedOrder]);

  // Mutation
  const mutation = useMutation({
    mutationFn: (_data: any) => {
      const selectedOrder = userOrders.find(o => o.orderId === formData.orderId);
      const formDataToSend = new FormData();

      if (selectedOrder) {
        formDataToSend.append('uniqueNo', selectedOrder.uniqueNo?.toString() || '');
        formDataToSend.append('serviceId', selectedOrder.serviceId?.toString() || '');
        formDataToSend.append('workTitle', selectedOrder.workTitle || '');
        if (selectedOrder.fileFormat) formDataToSend.append('fileFormat', selectedOrder.fileFormat);
        if (selectedOrder.size) formDataToSend.append('size', selectedOrder.size);
        if (selectedOrder.sizetype) formDataToSend.append('sizetype', selectedOrder.sizetype);
        formDataToSend.append('amount', selectedOrder.amount?.toString() || '0');
        if (selectedOrder.currency) formDataToSend.append('currency', selectedOrder.currency);
        if (selectedOrder.email) formDataToSend.append('email', selectedOrder.email);
        if (selectedOrder.instructions) formDataToSend.append('instructions', selectedOrder.instructions);
      }

      formDataToSend.append('orderStatus', 'Completed');
      formDataToSend.append('note', formData.note); 
      
      if (isDigitizing && formData.stitches) {
        formDataToSend.append('stitches', formData.stitches);
      }

      if (formData.externalLink) {
        formDataToSend.append('externalLink', formData.externalLink);
      }

      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      return ordersApi.updateOrder(Number(formData.orderId), formDataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order completed successfully');
      navigate('/orders/complete');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to complete order');
      toast.error('Submission failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};

    if (!formData.userId) errors.userId = 'User is required';
    if (!formData.orderId) errors.orderId = 'Order # is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    mutation.mutate(formData);
  };

  const handleUserChange = (val: string) => {
    const userId = val ? Number(val) : null;
    setFormData(p => ({ ...p, userId, orderId: null, poNo: '', orderNo: '' }));
    setFieldErrors(p => { const n = { ...p }; delete n.userId; return n; });
  };

  const handleOrderChange = (val: string) => {
    const orderId = val ? Number(val) : null;
    const selectedOrder = userOrders.find(o => o.orderId === orderId);
    setFormData(p => ({ 
      ...p, 
      orderId, 
      poNo: selectedOrder?.workTitle || '',
      orderNo: selectedOrder?.orderNo || ''
    }));
    setFieldErrors(p => { const n = { ...p }; delete n.orderId; return n; });
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
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in zoom-in-95">
                  <AlertCircle size={20} /> {formError}
                </div>
              )}

              {/* Main Fields Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-6">
                {/* Username */}
                <div className="space-y-1 lg:col-span-4">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Username <span className="text-red-500">*</span></label>
                  <CustomSelect
                    value={formData.userId || ''}
                    onChange={handleUserChange}
                    options={users.map(u => {
                      const fullName = [u.firstname, u.lastname].filter(Boolean).join(' ');
                      return {
                        value: u.userId,
                        label: fullName ? `${fullName} (${u.username})` : (u.username || '--')
                      };
                    })}
                    placeholder="Choose Username"
                    error={fieldErrors.userId}
                  />
                </div>

                {/* Order # */}
                <div className="space-y-1 lg:col-span-4">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Order # <span className="text-red-500">*</span></label>
                  <CustomSelect
                    value={formData.orderId || ''}
                    onChange={handleOrderChange}
                    options={userOrders.map(o => ({ value: o.orderId, label: o.orderNo || '--' }))}
                    placeholder={isLoadingOrders ? "Loading..." : "Choose Order #"}
                    isDisabled={!formData.userId || isLoadingOrders}
                    error={fieldErrors.orderId}
                  />
                </div>

                {/* PO # */}
                <div className="space-y-1 lg:col-span-4">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">PO #</label>
                  <div className="relative group">
                    <PenTool className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      readOnly
                      placeholder="Auto-fills from order"
                      value={formData.poNo}
                      className={`${premiumInput} pl-10 bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed`}
                    />
                  </div>
                </div>

                {/* Digitizing Specific: Stitches */}
                {isDigitizing && (
                  <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <label className="block text-[13px] font-semibold text-slate-900 ml-1">Stitches # <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                        <input
                          type="text"
                          placeholder="e.g. 5000"
                          value={formData.stitches}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*$/.test(val)) setFormData(p => ({ ...p, stitches: val }));
                          }}
                          className={`${premiumInput} pl-10`}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[13px] font-semibold text-slate-900 ml-1">Final Amount</label>
                      <div className="h-10 px-4 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-sm">
                        <span className="text-sm font-bold text-cyan-600">{selectedOrder?.currency === 'GBP' ? '£' : selectedOrder?.currency === 'EURO' ? '€' : '$'}</span>
                        <span className="text-sm font-extrabold text-slate-700">{calculatedAmount}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-auto">Auto-calculated</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Note Section */}
                <div className="space-y-1 lg:col-span-12">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Note :</label>
                  <textarea
                    placeholder="Add a completion note for the customer..."
                    value={formData.note}
                    onChange={(e) => setFormData(p => ({ ...p, note: e.target.value }))}
                    className={`${premiumInput} h-24 py-2.5 resize-none`}
                  />
                </div>

                {/* Attachments Section */}
                <div className="space-y-3 lg:col-span-12">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Attachments (Upto 30 MB)</label>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const files = Array.from(e.dataTransfer.files).filter(file => 
                          !selectedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)
                        );
                        if (files.length < e.dataTransfer.files.length) {
                          toast.error('Duplicate files were skipped');
                        }

                        const largeFiles = files.filter(f => f.size > 30 * 1024 * 1024);
                        if (largeFiles.length > 0) {
                          toast.error(
                            "Some files exceed the 30MB limit. Please provide a transfer link for these assets instead.",
                            { duration: 5000, icon: '⚠️' }
                          );
                          const validFiles = files.filter(f => f.size <= 30 * 1024 * 1024);
                          setSelectedFiles(prev => [...prev, ...validFiles]);
                        } else {
                          setSelectedFiles(prev => [...prev, ...files]);
                        }

                        if (fieldErrors.files) setFieldErrors(p => { const n = { ...p }; delete n.files; return n; });
                      }
                    }}
                    className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-8 transition-all hover:border-cyan-400 hover:bg-cyan-50/30 cursor-pointer text-center"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files).filter(file => 
                            !selectedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)
                          );
                          if (files.length < e.target.files!.length) {
                            toast.error('Duplicate files were skipped');
                          }

                          const largeFiles = files.filter(f => f.size > 30 * 1024 * 1024);
                          if (largeFiles.length > 0) {
                            toast.error(
                              "Some files exceed the 30MB limit. Please provide a transfer link for these assets instead.",
                              { duration: 5000, icon: '⚠️' }
                            );
                            const validFiles = files.filter(f => f.size <= 30 * 1024 * 1024);
                            setSelectedFiles(prev => [...prev, ...validFiles]);
                          } else {
                            setSelectedFiles(prev => [...prev, ...files]);
                          }

                          if (fieldErrors.files) setFieldErrors(p => { const n = { ...p }; delete n.files; return n; });
                        }
                      }}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-cyan-100 group-hover:scale-110 transition-all duration-300">
                        <Upload className="text-slate-400 group-hover:text-cyan-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">Drag & Drop files here.</p>
                        <p className="text-[11px] text-slate-400 font-medium">or click to browse from your computer</p>
                      </div>
                    </div>
                  </div>
                  {renderError('files')}

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
                        value={formData.externalLink}
                        onChange={(e) => setFormData(p => ({ ...p, externalLink: e.target.value }))}
                        className={`${premiumInput} pl-10`}
                      />
                    </div>
                  </div>

                  {/* File List */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                              <FileIcon size={14} className="text-cyan-600" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-bold text-slate-700 truncate">{file.name}</span>
                              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Actions */}
            <div className="bg-slate-50/80 p-5 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-0">
              <button
                type="button"
                onClick={() => navigate('/orders/complete')}
                className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors order-2 sm:order-1"
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto order-1 sm:order-2">
                <Button
                  type="submit"
                  isLoading={mutation.isPending}
                  className="w-full sm:w-auto bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 px-10 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Order
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ userId: null, orderId: null, poNo: '', note: '', orderNo: '', externalLink: '', stitches: '' });
                    setSelectedFiles([]);
                    setFieldErrors({});
                  }}
                  className="w-full sm:w-auto px-6 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
