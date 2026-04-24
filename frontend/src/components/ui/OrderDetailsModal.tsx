import { useQuery } from '@tanstack/react-query';
import {
  X, FileText, Calendar, User, Mail, Layers,
  Maximize2, DollarSign, Download, FileIcon, Link, ExternalLink
} from 'lucide-react';
import { ordersApi } from '../../api/ordersApi';
import { Button } from './Button';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  initialOrderData?: any;
}

export function OrderDetailsModal({ isOpen, onClose, orderId, initialOrderData }: OrderDetailsModalProps) {
  const { data: fullOrderDetails, isLoading } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: () => ordersApi.getOrderById(orderId!),
    enabled: !!orderId && isOpen,
  });

  const activeOrder = fullOrderDetails || initialOrderData;

  if (!isOpen || !activeOrder) return null;

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

  const getStatusStyle = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return 'bg-green-50 text-green-700 border-green-100';
    if (s.includes('process')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (s.includes('cancel')) return 'bg-red-50 text-red-700 border-red-100';
    if (s.includes('pending')) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
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
              <h3 className="text-xl font-bold">Order Details</h3>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{activeOrder.orderNo}</p>
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
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Ordered On</span>
                    <span className="text-[13px] font-bold text-slate-700">{formatDate(activeOrder.orderDate)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Username</span>
                    <span className="text-[13px] font-bold text-slate-700">{activeOrder.username}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Email</span>
                    <span className="text-[13px] font-bold text-slate-700">{activeOrder.email || '--'}</span>
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
                        {activeOrder.serviceName || initialOrderData?.serviceName}
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
                    <span className="text-[13px] font-bold text-slate-700">{activeOrder.workTitle || '--'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <Maximize2 size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Size</span>
                    <span className="text-[13px] font-bold text-slate-700">{activeOrder.size ? `${activeOrder.size} ${activeOrder.sizetype}` : '--'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <DollarSign size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Price</span>
                    <span className="text-[13px] font-bold text-slate-700">{formatPrice(activeOrder.amount, activeOrder.currency)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Status</span>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getStatusStyle(activeOrder.orderStatus)}`}>
                      {activeOrder.orderStatus || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions - Full Width */}
              <div className="md:col-span-2 space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Instructions</span>
                <div
                  className="bg-slate-50 rounded-2xl p-4 text-[13px] text-slate-600 leading-relaxed min-h-[100px] border border-slate-100 prose-sm prose-slate"
                  dangerouslySetInnerHTML={{ __html: activeOrder.instructions || 'No specific instructions provided.' }}
                />
              </div>

              {/* Note (Completion Note) - Full Width */}
              {activeOrder.note && (
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold block">Completion Note</span>
                  <div
                    className="bg-amber-50/30 rounded-2xl p-4 text-[13px] text-slate-600 leading-relaxed border border-amber-100/50 prose-sm prose-slate"
                    dangerouslySetInnerHTML={{ __html: activeOrder.note }}
                  />
                </div>
              )}

              {/* Attachments Section */}
              {activeOrder.files && activeOrder.files.length > 0 && (
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Attachments</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeOrder.files.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-cyan-200 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-cyan-50 transition-colors">
                            <FileIcon size={16} className="text-slate-400 group-hover:text-cyan-600" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-bold text-slate-700 truncate">{file.fileName}</span>
                          </div>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5193'}${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-slate-50 hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 flex items-center justify-center transition-all shadow-sm"
                          title="Download / View"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeOrder.externalLink && (
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Asset Transfer Link</span>
                  <a
                    href={activeOrder.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-700 text-[12px] font-bold hover:bg-cyan-100 transition-colors group"
                  >
                    <Link size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="truncate">{activeOrder.externalLink}</span>
                    <ExternalLink size={14} className="ml-auto opacity-50" />
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <Button
              onClick={onClose}
              variant="primary"
              className="px-10 rounded-xl"
            >
              Close Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
