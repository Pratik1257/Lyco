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
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Others']);
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
    ? allOrders.filter(o => {
        const matchesUser = o.username === selectedCustomer.username;
        if (!matchesUser) return false;

        // Special logic for 'Others'
        const isCompleted = o.orderStatus === 'Completed';
        const isInvoiced = o.orderStatus === 'Invoiced';
        
        const showCompleted = selectedStatuses.includes('Completed');
        const showInvoiced = selectedStatuses.includes('Invoiced');
        const showOthers = selectedStatuses.includes('Others');

        if (isCompleted) return showCompleted;
        if (isInvoiced) return showInvoiced;
        return showOthers;
      })
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

  const selectableOrders = orders;

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
                    options={customers.map(c => {
                      const fullName = [c.firstname, c.lastname].filter(Boolean).join(' ');
                      return {
                        value: c.userId,
                        label: fullName ? `${fullName} (${c.username})` : (c.username || '--')
                      };
                    })}
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

              {/* Row 1.5: Status Filter (Checkboxes) */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
                  <AlertCircle size={14} className="text-cyan-600" />
                  Filter by Status
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Others', 'Completed', 'Invoiced'].map((status) => {
                    const isChecked = selectedStatuses.includes(status);
                    return (
                      <label
                        key={status}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-sm'
                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedStatuses(prev =>
                              prev.includes(status)
                                ? prev.filter(s => s !== status)
                                : [...prev, status]
                            );
                            setSelectedOrderIds([]);
                          }}
                        />
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-cyan-600 border-cyan-600' : 'bg-white border-slate-300'
                        }`}>
                          {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="text-[11px] font-bold">{status}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

               {/* Row 2: Order Selection List */}
              {selectedUserId && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <CheckSquare size={16} className="text-cyan-600" />
                        Select Orders to Remove
                      </label>
                      {orders.length > 0 && (
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {orders.length} orders
                        </span>
                      )}
                    </div>
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

                  {/* Mini-card grid in fixed-height scroll container */}
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar rounded-xl">
                    {isLoadingOrders ? (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 size={28} className="animate-spin text-cyan-500" />
                        <p className="font-bold text-xs uppercase tracking-widest">Loading orders...</p>
                      </div>
                    ) : orders.length > 0 ? (
                      <div className="flex flex-wrap gap-3 pr-1 pb-1">
                        {orders.map((order) => {
                          const isSelected = selectedOrderIds.includes(order.orderId);
                          return (
                            <div
                              key={order.orderId}
                              onClick={() => toggleOrderSelection(order.orderId)}
                              className={`relative flex flex-col flex-grow flex-shrink-0 basis-[calc(50%-12px)] sm:basis-[calc(33.33%-12px)] md:basis-[calc(25%-12px)] lg:basis-[calc(16.66%-12px)] min-w-[120px] max-w-[400px] gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                                isSelected
                                  ? 'bg-red-50 border-red-400 cursor-pointer shadow-sm shadow-red-100'
                                  : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer hover:shadow-md'
                              }`}
                            >
                              {/* Checkbox dot */}
                              <div className={`absolute top-2 right-2 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <CheckSquare size={8} strokeWidth={3} className="text-white" />}
                              </div>

                              {/* Status badge */}
                              <span className={`self-start text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                                order.orderStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                                order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                order.orderStatus === 'Invoiced' ? 'bg-purple-100 text-purple-700' :
                                'bg-cyan-100 text-cyan-700'
                              }`}>
                                {order.orderStatus}
                              </span>

                              {/* Order No */}
                              <span className={`text-sm font-black leading-tight truncate pr-4 ${isSelected ? 'text-red-700' : 'text-slate-800'}`}>
                                {order.orderNo}
                              </span>

                              {/* PO Title */}
                              <span className="text-xs text-slate-500 font-medium truncate leading-tight">
                                {order.workTitle || '—'}
                              </span>

                              {/* Date */}
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <AlertCircle size={28} />
                        <p className="font-bold text-sm">No orders found for this user.</p>
                      </div>
                    )}
                  </div>

                  {/* Selection summary footer */}
                  {selectedOrderIds.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-red-600">
                        {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? 's' : ''} selected for removal
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderIds([])}
                        className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
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
