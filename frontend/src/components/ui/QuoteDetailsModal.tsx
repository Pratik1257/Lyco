import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, FileText, Calendar, User, Mail, Layers,
  Maximize2, DollarSign, Download, FileIcon, Link,
  ArrowRightLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { quotesApi } from '../../api/quotesApi';
import { Button } from './Button';

interface QuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: number | null;
  initialQuoteData?: any;
}

export function QuoteDetailsModal({ isOpen, onClose, quoteId, initialQuoteData }: QuoteDetailsModalProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: fullQuoteDetails, isLoading } = useQuery({
    queryKey: ['quote-details', quoteId],
    queryFn: () => quotesApi.getQuoteById(quoteId!),
    enabled: !!quoteId && isOpen,
  });

  const activeQuote = fullQuoteDetails || initialQuoteData;

  const convertMutation = useMutation({
    mutationFn: (id: number) => quotesApi.convertToOrder(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(data.message || 'Successfully converted to order');
      onClose();
      navigate('/orders/summary');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to convert quote');
    }
  });

  if (!isOpen || !activeQuote) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  };

  const formatPrice = (amount: string | null, currency: string | null) => {
    if (!amount) return '--';
    const symbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${symbol}${amount}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
              <FileText className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Quote Details</h3>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{activeQuote.quoteNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(100vh-160px)]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm font-medium">Loading details...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Info Grid */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Quote Date</span>
                    <span className="text-[13px] font-bold text-slate-700">{formatDate(activeQuote.quoteDate)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Username</span>
                    <span className="text-[13px] font-bold text-slate-700">{activeQuote.username}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Email</span>
                    <span className="text-[13px] font-bold text-slate-700">{activeQuote.email || '--'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Layers size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Service</span>
                    <span className="text-[13px] font-bold text-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] border border-slate-200">
                        {activeQuote.serviceName || initialQuoteData?.serviceName}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">PO / Artwork Name</span>
                    <span className="text-[13px] font-bold text-slate-700">{activeQuote.workTitle || '--'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Maximize2 size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Size</span>
                    <span className="text-[13px] font-bold text-slate-700">{activeQuote.size ? `${activeQuote.size} ${activeQuote.sizetype}` : '--'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <DollarSign size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Price</span>
                    <span className="text-[13px] font-bold text-slate-700">{formatPrice(activeQuote.amount, activeQuote.currency)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Layers size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">File Format</span>
                    <span className="text-[13px] font-bold text-slate-700">{activeQuote.fileFormat || '--'}</span>
                  </div>
                </div>
              </div>

              {/* Instructions - Full Width */}
              <div className="md:col-span-2 space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Instructions</span>
                <div
                  className="bg-slate-50 rounded-2xl p-4 text-[13px] text-slate-600 leading-relaxed min-h-[100px] border border-slate-100 prose-sm prose-slate"
                  dangerouslySetInnerHTML={{ __html: activeQuote.instructions || 'No specific instructions provided.' }}
                />
              </div>

              {/* Asset Transfer Link */}
              {activeQuote.imageUrl && (
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Asset Link</span>
                  <a
                    href={activeQuote.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-700 text-[12px] font-bold hover:bg-cyan-100 transition-colors group"
                  >
                    <Link size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="truncate">{activeQuote.imageUrl}</span>
                  </a>
                </div>
              )}

              {/* Uploaded Files */}
              {activeQuote.files && activeQuote.files.length > 0 && (
                <div className="md:col-span-2 space-y-3">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Attachments</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeQuote.files.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-cyan-200 transition-colors shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                            <FileIcon size={16} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-bold text-slate-700 truncate">{file.fileName}</span>
                            <span className="text-[10px] text-slate-400 font-medium lowercase">File Attachment</span>
                          </div>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5193'}${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-white hover:bg-cyan-500 text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-sm group/btn"
                          title="Download"
                        >
                          <Download size={14} className="group-hover/btn:scale-110 transition-transform" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={() => convertMutation.mutate(activeQuote.quoteId)}
              variant="primary"
              isLoading={convertMutation.isPending}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 flex items-center gap-2"
            >
              <ArrowRightLeft size={16} /> Convert to Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
