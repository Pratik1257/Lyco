import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, AlertCircle, PenTool, 
  Upload, X, File as FileIcon 
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
    orderNo: ''
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

  // Mutation
  const mutation = useMutation({
    mutationFn: (_data: any) => {
      const formDataToSend = new FormData();
      formDataToSend.append('orderStatus', 'Completed');
      formDataToSend.append('instructions', formData.note); // Using instructions field for Note
      
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
    if (selectedFiles.length === 0) errors.files = 'At least one attachment is required';

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
      <div className="w-full px-4 sm:px-6 max-w-5xl mx-auto">
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
                    options={users.map(u => ({ value: u.userId, label: u.username || '--' }))}
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
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Attachments (Upto 30 MB) <span className="text-red-500">*</span></label>
                  
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
                        const newFiles = Array.from(e.dataTransfer.files).filter(file => 
                          !selectedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)
                        );
                        if (newFiles.length < e.dataTransfer.files.length) {
                          toast.error('Duplicate files were skipped');
                        }
                        setSelectedFiles(prev => [...prev, ...newFiles]);
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
                          const newFiles = Array.from(e.target.files).filter(file => 
                            !selectedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)
                          );
                          if (newFiles.length < e.target.files!.length) {
                            toast.error('Duplicate files were skipped');
                          }
                          setSelectedFiles(prev => [...prev, ...newFiles]);
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
            <div className="bg-slate-50/80 p-5 sm:p-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
              <button
                type="button"
                onClick={() => navigate('/orders/complete')}
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft size={16} /> Cancel
              </button>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ userId: null, orderId: null, poNo: '', note: '', orderNo: '' });
                    setSelectedFiles([]);
                    setFieldErrors({});
                  }}
                  className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-600 transition-colors"
                >
                  Reset
                </button>
                <Button
                  type="submit"
                  isLoading={mutation.isPending}
                  className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 px-10 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Order
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
