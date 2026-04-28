import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle2, Mail, Building2, DollarSign, Clock, User, CheckSquare, Receipt, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import { customersApi } from '../../api/customersApi';
import { ordersApi } from '../../api/ordersApi';
import { invoicesApi } from '../../api/invoicesApi';
import { generateDraftPdf } from '../../utils/invoiceDraftPdf';


export default function CreateInvoice() {
  const navigate = useNavigate();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUniqueNo, setSelectedUniqueNo] = useState<number | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users for dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: () => customersApi.getCustomers(1, 1000)
  });
  const users = usersData?.items || [];

  // Fetch COMPLETED orders for selected user using uniqueNo
  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['user-orders-completed', selectedUniqueNo],
    queryFn: () => ordersApi.getOrders(1, 100, '', 'Completed', undefined, selectedUniqueNo ?? undefined),
    enabled: !!selectedUniqueNo
  });
  const orders = (ordersData?.items || []).map(o => ({
    ...o,
    status: o.orderStatus || 'COMPLETED',
    po: 'PO: ' + (o.workTitle || 'banner'),
    date: o.completedDate ? new Date(o.completedDate).toLocaleDateString() : (o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A')
  }));

  // Update customer details and uniqueNo when user is selected
  const handleUserChange = (userIdVal: string) => {
    const userId = userIdVal ? Number(userIdVal) : null;
    setSelectedUserId(userId);

    if (userId) {
      const user = users.find(u => u.userId === userId);
      if (user) {
        setSelectedUniqueNo(user.uniqueNo || null);
        setCustomerDetails({
          companyName: user.companyname || '',
          email: user.primaryEmail || ''
        });
      }
    } else {
      setSelectedUniqueNo(null);
      setCustomerDetails(null);
      setSelectedOrderIds([]);
    }
  };

  const handleSelectAll = () => {
    setSelectedOrderIds(orders.map(o => o.orderId));
  };

  const handleUnselectAll = () => {
    setSelectedOrderIds([]);
  };

  const toggleOrder = (id: number) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    return orders
      .filter(o => selectedOrderIds.includes(o.orderId))
      .reduce((sum, o) => sum + Number(o.amount || 0), 0)
      .toFixed(2);
  };

  const calculatePendingTotal = () => {
    return orders
      .reduce((sum, o) => sum + Number(o.amount || 0), 0)
      .toFixed(2);
  };

  const handleSubmit = async (type: string) => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }
    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await invoicesApi.createInvoice({
        userId: selectedUserId,
        orderIds: selectedOrderIds,
        invoiceType: type
      });

      const { invoices } = res;
      toast.success(
        type === 'Individual'
          ? `${invoices.length} individual invoice(s) created!`
          : `Combined invoice ${invoices[0]?.invoiceNo} created!`
      );

      // Open each PDF in a new tab
      invoices.forEach(inv => {
        if (inv.pdfUrl) {
          window.open(`http://localhost:5193${inv.pdfUrl}`, '_blank');
        }
      });

      navigate('/invoices/summary');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDraft = () => {
    if (!selectedUserId || selectedOrderIds.length === 0) {
      toast.error('Please select a user and at least one order');
      return;
    }
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.orderId));
    generateDraftPdf({
      invoiceNo: 'DRAFT',
      invoiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      companyName: customerDetails?.companyName || '',
      contactName: '',
      phone: '',
      email: customerDetails?.email || '',
      customerId: '',
      lineItems: selectedOrders.map(o => ({
        orderNo: o.orderNo || '',
        orderDate: o.date || '',
        description: o.workTitle || o.po || '',
        amount: o.amount?.toString() || '0'
      }))
    });
  };

  const premiumInput = "w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400";
  const sectionLabel = (colorClass: string) => `flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${colorClass} mb-3`;

  return (
    <div className="bg-slate-50/50 py-5">
      <div className="w-full px-4 sm:px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

          <form className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

            <div className="p-5 sm:p-6 space-y-4">

              {/* Section 1 — Account Association */}
              <section>
                <h4 className={sectionLabel('text-cyan-800/50')}><User size={12} /> Account Association</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4">
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Username <span className="text-red-500">*</span></label>
                    <CustomSelect
                      value={selectedUserId || ''}
                      onChange={handleUserChange}
                      options={users.map(u => ({ value: u.userId, label: u.username }))}
                      placeholder="Select Username"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Company Name</label>
                    <div className="relative group">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        readOnly
                        value={customerDetails?.companyName || ''}
                        placeholder=""
                        className={`${premiumInput} pl-10 bg-slate-50 cursor-not-allowed`}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Client Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        readOnly
                        value={customerDetails?.email || ''}
                        placeholder=""
                        className={`${premiumInput} pl-10 bg-slate-50 cursor-not-allowed`}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* Section 2 — Order Selection Matrix */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={sectionLabel('text-blue-800/50')}><CheckSquare size={12} /> Order Selection Matrix</h4>
                  <button
                    type="button"
                    onClick={selectedOrderIds.length === orders.length ? handleUnselectAll : handleSelectAll}
                    className="text-[10px] font-black uppercase text-cyan-600 hover:text-cyan-700 tracking-widest transition-colors"
                  >
                    {selectedOrderIds.length === orders.length ? 'Unselect All' : 'Select All'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 overflow-x-auto pb-4 custom-scrollbar">
                  {selectedUserId ? (
                    orders.length > 0 ? (
                      orders.map(order => (
                        <label
                          key={order.orderId}
                          className={`relative flex items-start gap-3 p-4 min-w-[260px] rounded-2xl border transition-all cursor-pointer group ${selectedOrderIds.includes(order.orderId)
                            ? 'bg-white border-cyan-500 ring-4 ring-cyan-500/5'
                            : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                            }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedOrderIds.includes(order.orderId)
                            ? 'bg-cyan-500 border-cyan-500 text-white'
                            : 'bg-white border-slate-300'
                            }`}>
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.orderId)}
                              onChange={() => toggleOrder(order.orderId)}
                              className="hidden"
                            />
                            {selectedOrderIds.includes(order.orderId) && <CheckCircle2 size={12} />}
                          </div>

                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900">{order.orderNo}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                              <span>{order.po}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>{order.date}</span>
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="w-full py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No completed orders found</p>
                      </div>
                    )
                  ) : (
                    <div className="w-full py-8 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Please select a username first</p>
                    </div>
                  )}
                </div>
              </section>

              <div className="h-px bg-slate-100" />

              {/* Section 3 — Financial Summary (Light Theme) */}
              <section>
                <h4 className={sectionLabel('text-amber-800/50')}><DollarSign size={12} /> Financial Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-6 bg-cyan-50/30 border border-cyan-100/50 rounded-3xl shadow-sm flex items-center justify-between group hover:bg-cyan-50/50 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase text-cyan-700/60 tracking-widest mb-1">Total Invoice Amount</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{calculateTotal()} <span className="text-xs text-slate-400 font-bold uppercase ml-1">USD</span></h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-100/50 flex items-center justify-center text-cyan-600 shadow-inner group-hover:scale-110 transition-transform">
                      <DollarSign size={24} />
                    </div>
                  </div>
                  <div className="p-6 bg-amber-50/30 border border-amber-100/50 rounded-3xl shadow-sm flex items-center justify-between group hover:bg-amber-50/50 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase text-amber-700/60 tracking-widest mb-1">Pending Amount</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{calculatePendingTotal()} <span className="text-xs text-slate-400 font-bold uppercase ml-1">USD</span></h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100/50 flex items-center justify-center text-amber-600 shadow-inner group-hover:scale-110 transition-transform">
                      <Clock size={24} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Centered Actions Section */}
              <section className="pt-6 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-4 w-full px-4">
                  <Button
                    onClick={() => handleSubmit('Individual')}
                    disabled={isSubmitting}
                    variant="unstyled"
                    className="flex-1 sm:flex-initial min-w-[200px] h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none"
                  >
                    <Receipt size={16} />
                    {isSubmitting ? 'Generating...' : 'Individual Invoice'}
                  </Button>

                  <Button
                    onClick={() => handleSubmit('Combined')}
                    disabled={isSubmitting}
                    variant="unstyled"
                    className="flex-1 sm:flex-initial min-w-[200px] h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-600/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none"
                  >
                    <Receipt size={16} className="rotate-90" />
                    {isSubmitting ? 'Generating...' : 'Combined Invoice'}
                  </Button>

                  <Button
                    onClick={() => handleSubmit('Paypal')}
                    disabled={isSubmitting}
                    variant="unstyled"
                    className="flex-1 sm:flex-initial min-w-[200px] h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-rose-500/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none"
                  >
                    <Mail size={16} />
                    {isSubmitting ? 'Generating...' : 'Send Paypal Link'}
                  </Button>

                  <Button
                    onClick={handleDownloadDraft}
                    disabled={isSubmitting}
                    variant="unstyled"
                    className="flex-1 sm:flex-initial min-w-[200px] h-12 bg-amber-400 hover:bg-amber-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-amber-400/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none"
                  >
                    <FileText size={16} />
                    Download Draft
                  </Button>
                </div>
              </section>

            </div>

            {/* Bottom Actions - Only Cancel now */}
            <div className="bg-slate-50/50 p-6 sm:p-7 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/invoices/summary')}
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft size={16} /> Cancel
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
