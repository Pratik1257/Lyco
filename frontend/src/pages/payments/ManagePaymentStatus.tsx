import { useState, useEffect } from 'react';
import {
  User, CheckCircle2, AlertCircle, Loader2,
  Calendar, DollarSign, Clock, Building2, ChevronLeft, CheckSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { paymentsApi } from '../../api/paymentsApi';
import type { PendingOrder } from '../../api/paymentsApi';
import { usersApi } from '../../api/pricesApi';
import type { UserDto } from '../../api/pricesApi';
import { Button } from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import { Skeleton } from '../../components/ui/Skeleton';

export default function ManagePaymentStatus() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);

  const [customerDetails, setCustomerDetails] = useState<{ companyName: string; currency: string } | null>(null);

  // Load users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await usersApi.getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Could not load customer list');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Load orders when user selection changes
  useEffect(() => {
    if (!selectedUserId) {
      setOrders([]);
      setCustomerDetails(null);
      return;
    }

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const user = users.find(u => u.id === selectedUserId);
        if (user) {
          setCustomerDetails({
            companyName: user.companyname || '—',
            currency: user.currency || 'USD'
          });

          if (user.uniqueNo) {
            const data = await paymentsApi.getPendingForStatus(user.uniqueNo);
            setOrders(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch pending orders:', error);
        toast.error('Could not load pending orders');
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
    setSelectedOrderIds([]);
  }, [selectedUserId, users]);

  const toggleOrder = (id: number) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedOrderIds(orders.map(o => o.orderId));
  };

  const handleUnselectAll = () => {
    setSelectedOrderIds([]);
  };



  const handleUpdateStatus = async (status: 'Completed' | 'Bad Debt') => {
    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order');
      return;
    }

    setUpdating(true);
    setUpdatingAction(status);
    try {
      const response = await paymentsApi.updateStatus({
        orderIds: selectedOrderIds,
        status
      });
      toast.success(response.message);

      // Reset selection and customer after successful update
      setSelectedOrderIds([]);
      setSelectedUserId(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Update failed');
    } finally {
      setUpdating(false);
      setUpdatingAction(null);
    }
  };

  const premiumInput = "w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400";
  const sectionLabel = (colorClass: string) => `flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${colorClass} mb-3`;

  return (
    <div className="bg-slate-50/50 py-5">
      <div className="w-full px-4 sm:px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">



          <form className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 space-y-6">

              {/* Section 1 — Account Association */}
              <section>
                <h4 className={sectionLabel('text-cyan-800/50')}><User size={12} /> Account Association</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4">
                  <div className="md:col-span-6 space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Select Customer <span className="text-red-500">*</span></label>
                    <CustomSelect
                      value={selectedUserId || ''}
                      onChange={(val) => setSelectedUserId(val ? Number(val) : null)}
                      options={users.map(u => {
                        const fullName = [u.firstname, u.lastname].filter(Boolean).join(' ');
                        return {
                          value: u.id,
                          label: fullName ? `${fullName} (${u.username})` : u.username || 'Unknown',
                        };
                      })}
                      placeholder="Choose a customer..."
                      isDisabled={loadingUsers}
                    />
                  </div>
                  <div className="md:col-span-6 space-y-1">
                    <label className="block text-[13px] font-semibold text-slate-900 ml-1">Company Name</label>
                    <div className="relative group">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        readOnly
                        value={customerDetails?.companyName || ''}
                        placeholder="Select a customer to see company name"
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
                  <div className="flex items-center gap-2">
                    <h4 className={sectionLabel('text-blue-800/50')}><CheckSquare size={12} /> Pending Orders Matrix</h4>
                    {orders.length > 0 && (
                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide -mt-2.5">
                        {orders.length} orders
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={selectedOrderIds.length === orders.length && orders.length > 0 ? handleUnselectAll : handleSelectAll}
                    className="text-[10px] font-black uppercase text-cyan-600 hover:text-cyan-700 tracking-widest transition-colors"
                  >
                    {selectedOrderIds.length === orders.length && orders.length > 0 ? 'Unselect All' : 'Select All'}
                  </button>
                </div>

                {selectedUserId ? (
                  loadingOrders ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-2xl border-2 border-slate-100 space-y-2">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar rounded-xl">
                      <div className="flex flex-wrap gap-3 pr-1 pb-1">
                        {orders.map(order => {
                          const isSelected = selectedOrderIds.includes(order.orderId);
                          return (
                            <label
                              key={order.orderId}
                              className={`relative flex flex-col flex-grow flex-shrink-0 basis-[calc(50%-12px)] sm:basis-[calc(33.33%-12px)] md:basis-[calc(25%-12px)] lg:basis-[calc(16.66%-12px)] min-w-[120px] max-w-[400px] gap-1.5 p-3 rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                                ? 'bg-cyan-50 border-cyan-400 shadow-sm shadow-cyan-100'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleOrder(order.orderId)}
                                className="hidden"
                              />

                              <div className={`absolute top-2 right-2 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300 bg-white'
                                }`}>
                                {isSelected && <CheckCircle2 size={8} className="text-white" />}
                              </div>

                              <span className={`text-sm font-black leading-tight truncate pr-4 text-cyan-600 ${isSelected ? 'text-cyan-700' : ''}`}>
                                {order.orderNo}
                              </span>

                              <span className="text-xs text-slate-500 font-medium truncate leading-tight">
                                {order.poNo || '—'}
                              </span>

                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                                <Calendar size={10} />
                                {new Date(order.orderDate).toLocaleDateString()}
                              </div>

                              <span className={`text-xs font-black mt-0.5 ${isSelected ? 'text-cyan-600' : 'text-slate-700'}`}>
                                {order.currency || 'USD'} {Number(order.amount || 0).toFixed(2)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full py-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <CheckCircle2 className="text-emerald-500" size={24} />
                      </div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No pending orders found</p>
                    </div>
                  )
                ) : (
                  <div className="w-full py-10 text-center bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">
                      Please select a customer first to view pending orders.
                    </p>
                  </div>
                )}
              </section>

              <div className="h-px bg-slate-100" />

              {/* Section 3 — Financial Summary */}
              <section>
                <h4 className={sectionLabel('text-amber-800/50')}><DollarSign size={12} /> Financial Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-6 bg-cyan-50/30 border border-cyan-100/50 rounded-3xl shadow-sm flex items-center justify-between group hover:bg-cyan-50/50 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase text-cyan-700/60 tracking-widest mb-1">Total Selected Amount</p>
                      <div className="flex flex-col gap-1">
                        {Object.entries(
                          orders
                            .filter(o => selectedOrderIds.includes(o.orderId))
                            .reduce((acc, o) => {
                              const curr = o.currency || 'USD';
                              acc[curr] = (acc[curr] || 0) + Number(o.amount || 0);
                              return acc;
                            }, {} as Record<string, number>)
                        ).map(([curr, amt]) => (
                          <h3 key={curr} className="text-2xl font-black text-slate-900 tracking-tight">
                            {amt.toFixed(2)} <span className="text-xs text-slate-400 font-bold uppercase ml-1">{curr}</span>
                          </h3>
                        ))}
                        {selectedOrderIds.length === 0 && (
                          <h3 className="text-2xl font-black text-slate-300 tracking-tight">0.00</h3>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-100/50 flex items-center justify-center text-cyan-600 shadow-inner group-hover:scale-110 transition-transform">
                      <DollarSign size={24} />
                    </div>
                  </div>
                  <div className="p-6 bg-amber-50/30 border border-amber-100/50 rounded-3xl shadow-sm flex items-center justify-between group hover:bg-amber-50/50 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase text-amber-700/60 tracking-widest mb-1">Total Pending Amount</p>
                      <div className="flex flex-col gap-1">
                        {Object.entries(
                          orders.reduce((acc, o) => {
                            const curr = o.currency || 'USD';
                            acc[curr] = (acc[curr] || 0) + Number(o.amount || 0);
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([curr, amt]) => (
                          <h3 key={curr} className="text-2xl font-black text-slate-900 tracking-tight">
                            {amt.toFixed(2)} <span className="text-xs text-slate-400 font-bold uppercase ml-1">{curr}</span>
                          </h3>
                        ))}
                        {orders.length === 0 && (
                          <h3 className="text-2xl font-black text-slate-300 tracking-tight">0.00</h3>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100/50 flex items-center justify-center text-amber-600 shadow-inner group-hover:scale-110 transition-transform">
                      <Clock size={24} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Center */}
              <section className="pt-6 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-2xl mx-auto">
                  <Button
                    onClick={() => handleUpdateStatus('Completed')}
                    disabled={updating || selectedOrderIds.length === 0}
                    variant="unstyled"
                    className="flex-1 min-w-[200px] h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none"
                  >
                    {updatingAction === 'Completed' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Set as Completed
                  </Button>

                  <Button
                    onClick={() => handleUpdateStatus('Bad Debt')}
                    disabled={updating || selectedOrderIds.length === 0}
                    variant="unstyled"
                    className="flex-1 min-w-[200px] h-14 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none"
                  >
                    {updatingAction === 'Bad Debt' ? <Loader2 size={18} className="animate-spin" /> : <AlertCircle size={18} />}
                    Set as Bad Debt
                  </Button>
                </div>
                {selectedOrderIds.length > 0 && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    {selectedOrderIds.length} orders selected for status update
                  </p>
                )}
              </section>

            </div>

            <div className="bg-slate-50/50 p-6 sm:p-7 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft size={16} /> Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
