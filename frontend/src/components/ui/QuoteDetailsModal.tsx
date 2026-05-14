import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, FileText, Calendar, User, Mail, Layers,
  Maximize2, DollarSign, ExternalLink, FileIcon, Link,
  ArrowRightLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

import { quotesApi } from '../../api/quotesApi';
import { pricesApi } from '../../api/pricesApi';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';

interface QuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: number | null;
  initialQuoteData?: any;
}

export function QuoteDetailsModal({ isOpen, onClose, quoteId, initialQuoteData }: QuoteDetailsModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';

  // Admin-entered rate before converting
  const [rateInput, setRateInput] = useState('');
  const [suggestion, setSuggestion] = useState<{ price: number; source: 'Userwise' | 'General' } | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const { data: fullQuoteDetails, isLoading } = useQuery({
    queryKey: ['quote-details', quoteId],
    queryFn: () => quotesApi.getQuoteById(quoteId!),
    enabled: !!quoteId && isOpen,
  });

  const activeQuote = fullQuoteDetails || initialQuoteData;

  // Pre-fill rate input when quote loads
  useEffect(() => {
    if (activeQuote?.amount && Number(activeQuote.amount) > 0) {
      setRateInput(activeQuote.amount);
    } else {
      setRateInput('');
    }
  }, [activeQuote?.amount, quoteId]);

  // Fetch suggested price
  useEffect(() => {
    const fetchSuggestion = async () => {
      if (!isAdmin || !isOpen || !activeQuote?.serviceId) return;
      
      setIsFetchingPrice(true);
      try {
        // 1. Try Userwise Price lookup
        if (activeQuote.userId) {
          const uPrice = await pricesApi.getUserwisePriceLookup(activeQuote.userId, activeQuote.serviceId);
          if (uPrice !== null) {
            setSuggestion({ price: uPrice, source: 'Userwise' });
            setIsFetchingPrice(false);
            return;
          }
        }
        
        // 2. Fallback to General Price lookup
        const gPrice = await pricesApi.getGeneralPriceLookup(activeQuote.serviceId, activeQuote.currency || 'USD');
        if (gPrice !== null) {
          setSuggestion({ price: gPrice, source: 'General' });
        } else {
          setSuggestion(null);
        }
      } catch (err) {
        console.error('Failed to fetch suggested price:', err);
        setSuggestion(null);
      } finally {
        setIsFetchingPrice(false);
      }
    };

    fetchSuggestion();
  }, [activeQuote?.serviceId, activeQuote?.userId, activeQuote?.currency, isAdmin, isOpen]);

  const convertMutation = useMutation({
    mutationFn: (id: number) => quotesApi.convertToOrder(id, rateInput, activeQuote?.currency),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(data.message || 'Successfully converted to order');
      onClose();
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
        <div className="relative h-20 bg-gradient-to-r from-cyan-600 to-cyan-500 flex items-center px-8 rounded-t-2xl overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-2xl">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight leading-none">Quote Details</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black uppercase tracking-widest border border-white/30">
                    {activeQuote.quoteNo}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white border border-white/10 hover:scale-110 active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-8 py-7 overflow-y-auto max-h-[calc(90vh-160px)]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm font-medium">Loading details...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 pb-2">
              {/* Info Grid */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block leading-none mb-0.5">Quote Date</span>
                    <span className="text-[12px] font-bold text-slate-700 leading-none">{formatDate(activeQuote.quoteDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block leading-none mb-0.5">Username</span>
                    <span className="text-[12px] font-bold text-slate-700 leading-none">{activeQuote.username}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block leading-none mb-0.5">Email</span>
                    <span className="text-[12px] font-bold text-slate-700 leading-none">{activeQuote.email || '--'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Layers size={14} className="text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block leading-none mb-1">Service</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 self-start">
                      {activeQuote.serviceName || initialQuoteData?.serviceName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block leading-none mb-0.5">PO / Artwork Name</span>
                    <span className="text-[12px] font-bold text-slate-700 leading-none">{activeQuote.workTitle || '--'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Maximize2 size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block leading-none mb-0.5">Size</span>
                    <span className="text-[12px] font-bold text-slate-700 leading-none">{activeQuote.size ? `${activeQuote.size} ${activeQuote.sizetype}` : '--'}</span>
                  </div>
                </div>

                {/* Price — editable input for admin, read-only label for customer */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                    <DollarSign size={14} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block leading-none mb-1">
                      {isAdmin ? 'Rate (required to convert)' : 'Price'}
                    </span>
                    {isAdmin ? (
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">
                          {activeQuote.currency === 'GBP' ? '£' : activeQuote.currency === 'EUR' || activeQuote.currency === 'EURO' ? '€' : activeQuote.currency === 'INR' ? '₹' : '$'}
                        </span>
                        <input
                          type="text"
                          value={rateInput}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '' || /^\d*\.?\d*$/.test(v)) setRateInput(v);
                          }}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1.5 text-[12px] font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all"
                        />
                      </div>
                    ) : (
                      <span className="text-[12px] font-bold text-slate-700 leading-none">{formatPrice(activeQuote.amount, activeQuote.currency)}</span>
                    )}

                    {isAdmin && suggestion !== null && (
                      <div className={`mt-1.5 flex items-center justify-between border rounded-lg px-2 py-1.5 animate-in fade-in slide-in-from-top-1 duration-300 ${
                        suggestion.source === 'Userwise' 
                          ? 'bg-indigo-50/50 border-indigo-100 text-indigo-700' 
                          : 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
                      }`}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[8px] font-black uppercase tracking-tighter leading-none px-1 py-0.5 rounded ${
                              suggestion.source === 'Userwise' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              {suggestion.source}
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60 leading-none">Suggested Rate</span>
                          </div>
                          <span className="text-[11px] font-black leading-none">
                            {formatPrice(suggestion.price.toString(), activeQuote.currency)}
                          </span>
                        </div>
                        <button
                          onClick={() => setRateInput(suggestion.price.toString())}
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm transition-all active:scale-95 border bg-white ${
                            suggestion.source === 'Userwise' 
                              ? 'text-indigo-600 border-indigo-200 hover:text-indigo-700' 
                              : 'text-emerald-600 border-emerald-200 hover:text-emerald-700'
                          }`}
                        >
                          Use
                        </button>
                      </div>
                    )}
                    {isAdmin && isFetchingPrice && (
                       <div className="mt-1.5 flex items-center gap-2 px-2 py-1">
                         <div className="w-2.5 h-2.5 border-2 border-slate-200 border-t-cyan-500 rounded-full animate-spin"></div>
                         <span className="text-[9px] text-slate-400 font-bold italic">Finding rate...</span>
                       </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Layers size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block leading-none mb-0.5">File Format</span>
                    <span className="text-[12px] font-bold text-slate-700 leading-none">{activeQuote.fileFormat || '--'}</span>
                  </div>
                </div>
              </div>

              {/* Instructions - Full Width */}
              <div className="md:col-span-2 space-y-1.5 w-full overflow-hidden">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block">Instructions</span>
                <div
                  className="bg-slate-50 rounded-xl p-3 text-[12px] text-slate-600 leading-relaxed min-h-[80px] border border-slate-100 prose-sm prose-slate w-full"
                  style={{ wordBreak: 'normal', overflowWrap: 'anywhere', hyphens: 'none' }}
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
                <div className="md:col-span-2 space-y-3 pt-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Attachments</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeQuote.files.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl group/card hover:border-cyan-200 transition-colors shadow-sm">
                        <a 
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5193'}${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 overflow-hidden flex-1 group/link"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover/link:bg-cyan-50 transition-colors">
                            <FileIcon size={16} className="text-slate-400 group-hover/link:text-cyan-500 transition-colors" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-bold text-slate-700 truncate group-hover/link:text-cyan-600 transition-colors">{file.fileName}</span>
                            <span className="text-[10px] text-slate-400 font-medium lowercase">File Attachment</span>
                          </div>
                        </a>
                        <a
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5193'}${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-white hover:bg-cyan-500 text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-sm group/btn"
                          title="View File"
                        >
                          <ExternalLink size={14} className="group-hover/btn:scale-110 transition-transform" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {!isLoading && (
          <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <button
              onClick={onClose}
              className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            {isAdmin ? (
              <div className="flex items-center gap-3">
                {(!rateInput || rateInput === '0' || rateInput === '0.00') && (
                  <span className="text-[10px] font-semibold text-amber-500">Enter a rate above to convert</span>
                )}
                <Button
                  onClick={() => convertMutation.mutate(activeQuote.quoteId)}
                  variant="primary"
                  isLoading={convertMutation.isPending}
                  disabled={!rateInput || rateInput === '0' || rateInput === '0.00' || isNaN(Number(rateInput))}
                  className="px-6 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <ArrowRightLeft size={16} /> Convert to Order
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => convertMutation.mutate(activeQuote.quoteId)}
                variant="primary"
                isLoading={convertMutation.isPending}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center gap-2"
              >
                <ArrowRightLeft size={16} /> Convert to Order
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
