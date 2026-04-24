import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Trash2,
  Users,
  AlertCircle,
  Building2,
  CheckSquare,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/ordersApi';
import { customersApi, type Customer } from '../../api/customersApi';
import { Button } from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export default function RemoveOrderForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);


  // Fetch Customers
  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.getCustomers(1, 1000, '', 'all'),
  });

  // Fetch Orders for Selected User
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['user-orders-remove'],
    queryFn: () => ordersApi.getOrders(1, 500, '', 'all'),
    // Fetching a large set of orders to manually filter since backend uniqueNo might mismatch userId
  });

  // Deletion Mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const promises = ids.map(id => ordersApi.deleteOrder(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders-remove'] });
      toast.success(`${selectedOrderIds.length} order(s) removed successfully`);
      setSelectedOrderIds([]);
      // Optionally navigate away or stay to remove more
      // navigate('/orders/summary');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove orders: ${error.message || 'Unknown error'}`);
    }
  });

  // Derived
  const customers = customersData?.items || [];
  const allOrders = ordersData?.items || [];
  const orders = selectedCustomer
    ? allOrders.filter(o => o.username === selectedCustomer.username)
    : [];

  // Handlers
  const handleUserChange = (val: string) => {
    const userId = val ? Number(val) : null;
    const customer = customers.find(c => c.userId === userId);
    setSelectedUserId(userId);
    setSelectedCustomer(customer || null);
    setSelectedOrderIds([]); // Reset selection when user changes
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectableOrders = orders.filter(o => o.orderStatus !== 'In Process');

  const handleSelectAll = () => {
    if (selectedOrderIds.length === selectableOrders.length && selectableOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(selectableOrders.map(o => o.orderId));
    }
  };

  const handleRemove = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsModalOpen(true);
  };

  const confirmRemove = () => {
    deleteMutation.mutate(selectedOrderIds);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-5">
      <div className="w-full px-4 sm:px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 space-y-6">
              {/* Row 1: User & Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username Selector */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                    <Users size={16} className="text-cyan-600" />
                    Select Username
                  </label>
                  <CustomSelect
                    value={selectedUserId || ''}
                    onChange={handleUserChange}
                    options={customers.map(c => ({
                      value: c.userId,
                      label: c.username || '--'
                    }))}
                    placeholder="Choose Username"
                  />
                </div>

                {/* Company Name (Read-only) */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                    <Building2 size={16} className="text-cyan-600" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Company Name"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 focus:outline-none"
                    value={selectedCustomer?.companyname || ''}
                  />
                </div>
              </div>

              {/* Row 2: Order Selection List */}
              {selectedUserId && (
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <CheckSquare size={16} className="text-cyan-600" />
                      Select Orders to Remove
                    </label>
                    {orders.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
                      >
                        {selectedOrderIds.length === selectableOrders.length && selectableOrders.length > 0 ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {isLoadingOrders ? (
                      <div className="col-span-2 py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 size={32} className="animate-spin text-cyan-500" />
                        <p className="font-bold text-sm uppercase tracking-widest">Loading orders...</p>
                      </div>
                    ) : orders.length > 0 ? (
                      orders.map((order) => (
                        <div
                          key={order.orderId}
                          onClick={() => order.orderStatus !== 'In Process' && toggleOrderSelection(order.orderId)}
                          className={`group flex items-center gap-2 p-2 rounded-xl border transition-all ${order.orderStatus === 'In Process'
                              ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                              : selectedOrderIds.includes(order.orderId)
                                ? 'bg-red-50 border-red-200 cursor-pointer'
                                : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                            }`}
                        >
                          <div className={`shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all ${selectedOrderIds.includes(order.orderId)
                            ? 'bg-red-500 text-white shadow-sm shadow-red-200 border-red-500'
                            : 'bg-slate-50 border border-slate-300 text-transparent'
                            }`}>
                            <CheckSquare size={10} strokeWidth={3} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-700 truncate pr-1">{order.orderNo}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0 ${order.orderStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                                order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-cyan-100 text-cyan-700'
                                }`}>
                                {order.orderStatus}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">PO:</span>
                              <span className="text-[10px] font-bold text-slate-600 truncate">{order.workTitle || 'N/A'}</span>
                              <span className="text-slate-300 shrink-0">•</span>
                              <span className="text-[10px] font-bold text-slate-400 shrink-0">{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-12 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        <AlertCircle size={32} />
                        <p className="font-bold text-sm">No orders found for this user.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Section */}
              <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/orders/summary')}
                  className="px-6 h-11 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 shadow-none"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRemove}
                  disabled={selectedOrderIds.length === 0 || deleteMutation.isPending}
                  isLoading={deleteMutation.isPending}
                  className="px-6 h-11 rounded-xl text-xs font-bold shadow-lg"
                >
                  <Trash2 size={16} className="mr-2" />
                  Remove {selectedOrderIds.length > 0 ? `(${selectedOrderIds.length})` : ''} Order(s)
                </Button>
              </div>
            </div>
          </div>

          {/* Info Sidebar (Optional, maybe for safety tips) */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900 mb-1 uppercase tracking-tight">Safety Warning</h4>
              <p className="text-xs font-bold text-amber-700 leading-relaxed">
                Removing an order is a permanent action. This will delete all associated data, including notes and attachments.
                Please verify the Order # and PO # before proceeding.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        title="Delete Orders"
        message={`Are you sure you want to remove ${selectedOrderIds.length} selected order(s)? This action cannot be undone.`}
        onConfirm={confirmRemove}
        onCancel={() => setIsModalOpen(false)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
