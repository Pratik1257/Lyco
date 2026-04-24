import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, Upload, File as FileIcon, Info, Link, 
  CheckCircle2, AlertCircle, ShoppingBag, User 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi, type Order } from '../../api/ordersApi';
import { Button } from '../../components/ui/Button';

interface CompleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function CompleteOrderModal({ isOpen, onClose, order }: CompleteOrderModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [note, setNote] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Mutation
  const mutation = useMutation({
    mutationFn: () => {
      if (!order) throw new Error('No order selected');
      
      const formDataToSend = new FormData();
      
      // Append required fields from existing order
      formDataToSend.append('uniqueNo', order.uniqueNo?.toString() || '');
      formDataToSend.append('serviceId', order.serviceId?.toString() || '');
      formDataToSend.append('workTitle', order.workTitle || '');
      if (order.fileFormat) formDataToSend.append('fileFormat', order.fileFormat);
      if (order.size) formDataToSend.append('size', order.size);
      if (order.sizetype) formDataToSend.append('sizetype', order.sizetype);
      formDataToSend.append('amount', order.amount?.toString() || '0');
      if (order.currency) formDataToSend.append('currency', order.currency);
      if (order.email) formDataToSend.append('email', order.email);

      if (order.instructions) formDataToSend.append('instructions', order.instructions);
      
      // New data
      formDataToSend.append('orderStatus', 'Completed');
      formDataToSend.append('note', note); 
      
      if (externalLink) {
        formDataToSend.append('externalLink', externalLink);
      }

      selectedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      return ordersApi.updateOrder(order.orderId, formDataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order completed successfully');
      handleClose();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to complete order');
      toast.error('Submission failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const handleClose = () => {
    setNote('');
    setExternalLink('');
    setSelectedFiles([]);
    setFormError(null);
    onClose();
  };

  if (!isOpen || !order) return null;

  const premiumInput = "w-full px-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-400">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Complete Order</h3>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{order.orderNo}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[calc(100vh-160px)] overflow-y-auto">
          {formError && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in zoom-in-95">
              <AlertCircle size={20} /> {formError}
            </div>
          )}

          {/* Context Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <User size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User</p>
                <p className="text-[12px] font-bold text-slate-700 truncate">{order.username}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <ShoppingBag size={14} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PO / Artwork</p>
                <p className="text-[12px] font-bold text-slate-700 truncate">{order.workTitle || '--'}</p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="block text-[13px] font-semibold text-slate-900 ml-1">Completion Note</label>
            <textarea
              placeholder="Add a final note for the customer..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${premiumInput} h-24 py-2.5 resize-none`}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <label className="block text-[13px] font-semibold text-slate-900 ml-1">
              Final Assets (Upto 30 MB)
            </label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const files = Array.from(e.dataTransfer.files).filter(file => 
                    !selectedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)
                  );
                  const largeFiles = files.filter(f => f.size > 30 * 1024 * 1024);
                  if (largeFiles.length > 0) {
                    toast.error("Files exceeding 30MB are not allowed.", { icon: '⚠️' });
                    setSelectedFiles(prev => [...prev, ...files.filter(f => f.size <= 30 * 1024 * 1024)]);
                  } else {
                    setSelectedFiles(prev => [...prev, ...files]);
                  }
                  setFormError(null);
                }
              }}
              className="group relative border-2 border-dashed border-slate-200 rounded-3xl p-8 transition-all hover:border-cyan-400 hover:bg-cyan-50/30 cursor-pointer text-center"
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
                    const largeFiles = files.filter(f => f.size > 30 * 1024 * 1024);
                    if (largeFiles.length > 0) {
                      toast.error("Files exceeding 30MB are not allowed.", { icon: '⚠️' });
                      setSelectedFiles(prev => [...prev, ...files.filter(f => f.size <= 30 * 1024 * 1024)]);
                    } else {
                      setSelectedFiles(prev => [...prev, ...files]);
                    }
                    setFormError(null);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-cyan-100 group-hover:scale-110 transition-all duration-300">
                  <Upload className="text-slate-400 group-hover:text-cyan-600" size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Drop your final files here</p>
                  <p className="text-[11px] text-slate-400 font-medium">Max 30 MB per file</p>
                </div>
              </div>
            </div>

            {/* File List */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                        <FileIcon size={14} className="text-cyan-600" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-700 truncate">{file.name}</span>
                        <span className="text-[9px] text-slate-400 font-medium tracking-wider">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
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

          {/* Info for large files */}
          <div className="flex items-center gap-3 py-2 px-4 bg-cyan-50/50 border border-cyan-100/50 rounded-2xl">
            <Info size={14} className="text-cyan-600 shrink-0" />
            <p className="text-[11px] text-cyan-800 leading-relaxed font-medium">
              For files exceeding 30MB, please provide a transfer link below.
            </p>
          </div>

          {/* Transfer Link */}
          <div className="space-y-1">
            <label className="block text-[13px] font-semibold text-slate-900 ml-1">Asset Transfer Link</label>
            <div className="relative group">
              <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
              <input
                type="url"
                placeholder="https://wetransfer.com/downloads/..."
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                className={`${premiumInput} h-10 pl-10`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              isLoading={mutation.isPending}
              className="w-full bg-slate-900 hover:bg-slate-800 py-4 rounded-2xl shadow-xl shadow-slate-200"
            >
              Confirm Completion
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
