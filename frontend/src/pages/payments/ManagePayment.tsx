import { useState, useEffect } from 'react';
import {
  Search as SearchIcon, 
  X as XIcon, 
  Loader2 as LoaderIcon, 
  ShoppingCart as CartIcon, 
  CreditCard as CardIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { paymentsApi } from '../../api/paymentsApi';
import type { PaymentOrder } from '../../api/paymentsApi';
import { usersApi } from '../../api/pricesApi';
import type { UserDto } from '../../api/pricesApi';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import CustomSelect from '../../components/ui/CustomSelect';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const currencySymbol = (currency: string | null) => {
  if (!currency) return '$';
  if (currency === 'GBP') return '£';
  if (currency === 'EUR') return '€';
  if (currency === 'INR') return '₹';
  if (currency === 'AUD') return 'A$';
  return '$';
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
};

export default function ManagePayment() {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(isAdmin);

  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Pagination State ───────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [initiating, setInitiating] = useState(false);

  // ── Load users (Admins Only) ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) {
      if (user?.userId) setSelectedUserId(Number(user.userId));
      return;
    }
    const fetch = async () => {
      try {
        const data = await usersApi.getUsers();
        setUsers(data);
      } catch {
        toast.error('Could not load customer list');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetch();
  }, [isAdmin, user?.userId]);

  // ── Load orders ────────────────────────────────────────────────────────────
  useEffect(() => {
    // If not admin, we MUST wait for the userId to be resolved from session
    if (!isAdmin && !selectedUserId) return;

    const fetchOrders = async () => {
      setLoadingOrders(true);
      setSelectedOrderIds([]);
      try {
        const data = await paymentsApi.getPendingForPayment(selectedUserId);
        setOrders(data);
      } catch {
        toast.error('Could not load pending orders');
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [selectedUserId, isAdmin]);

  // ── Filtering & Pagination ────────────────────────────────────────────────
  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    return (
      order.orderNo.toLowerCase().includes(query) ||
      order.username.toLowerCase().includes(query) ||
      (order.poNo || '').toLowerCase().includes(query) ||
      order.serviceName.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleOrder = (id: number) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const isAllSelected = filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;
  const hasSelections = selectedOrderIds.length > 0;

  const handleToggleAll = () => {
    if (hasSelections) {
      setSelectedOrderIds([]);
    } else {
      if (filteredOrders.length === 0) return;
      
      const targetCurrency = filteredOrders[0].currency;
      const validOrders = filteredOrders.filter(o => o.currency === targetCurrency);
      
      setSelectedOrderIds(validOrders.map(o => o.orderId));

      if (validOrders.length < filteredOrders.length) {
        toast.success(`Selected all ${targetCurrency} orders. Other currencies skipped.`);
      }
    }
  };

  // ── Totals ─────────────────────────────────────────────────────────────────
  const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.orderId));
  const selectedTotal = selectedOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);

  const activeCurrency = selectedOrders.length > 0 ? selectedOrders[0].currency : 'USD';
  const activeSymbol = currencySymbol(activeCurrency);

  // ── Initiate payment ───────────────────────────────────────────────────────
  const handleMakePayment = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order');
      return;
    }

    const currencies = new Set(selectedOrders.map(o => o.currency));
    if (currencies.size > 1) {
      toast.error('Please select orders with the same currency only');
      return;
    }

    if (selectedTotal <= 0) {
      toast.error('Total amount must be greater than zero');
      return;
    }

    setInitiating(true);
    try {
      const result = await paymentsApi.initiatePayment({
        userId: selectedUserId || 0,
        orderIds: selectedOrderIds,
      });
      toast.success('Payment initiated! Opening PayPal...');
      window.open(result.paypalUrl, '_blank', 'noopener,noreferrer');

      const refreshed = await paymentsApi.getPendingForPayment(selectedUserId);
      setOrders(refreshed);
      setSelectedOrderIds([]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to initiate payment';
      toast.error(msg);
    } finally {
      setInitiating(false);
    }
  };

  return (
    <div className="relative animate-in fade-in duration-500 space-y-4">
      
      {/* Checkout Summary Bar — Moved to Top */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Orders Selected</span>
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {selectedOrderIds.length} <span className="text-xs text-slate-300 font-bold uppercase ml-1">Items</span>
              </span>
            </div>
            <div className="h-10 w-px bg-slate-100 hidden md:block" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Total Amount:</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {activeSymbol}{selectedTotal.toFixed(2)} <span className="text-xs text-slate-400 font-bold uppercase ml-1">{activeCurrency}</span>
              </span>
            </div>
            {selectedOrderIds.length > 0 && (
              <>
                <div className="h-10 w-px bg-slate-100 hidden lg:block" />
                <div className="hidden lg:flex flex-col">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Checkout Note:</span>
                  <p className="text-[10px] font-bold text-slate-400 leading-tight max-w-[200px]">
                    Showing orders for <span className="text-slate-600">{activeCurrency}</span> only. 
                    Uncheck to select other currencies.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button
              onClick={handleMakePayment}
              disabled={initiating || selectedOrderIds.length === 0}
              className="flex-1 md:flex-none h-14 px-10 bg-[#fbb03b] hover:bg-[#e89d2a] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              variant="unstyled"
            >
              {initiating ? (
                <LoaderIcon className="animate-spin" size={20} />
              ) : (
                <CardIcon size={20} />
              )}
              {initiating ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Unified Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* Header & Filter Bar */}
        <div className="p-4 sm:px-6 space-y-4 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {isAdmin && (
                <div className="w-64">
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
                    placeholder="Choose Username"
                    isDisabled={loadingUsers}
                  />
                </div>
              )}
              <div className="relative flex-1 max-w-md group">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search orders, usernames, PO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleAll}
                className="px-4 h-11 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-cyan-600 rounded-xl border border-transparent hover:border-slate-200 transition-all"
              >
                {hasSelections ? 'Uncheck All' : 'Check All'}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content Area */}
        <div className="overflow-x-auto min-h-[400px]">
          {loadingOrders && orders.length === 0 ? (
            <TableSkeleton rows={8} cols={7} />
          ) : paginatedOrders.length > 0 ? (
            <Table>
              <TableHeader className="bg-white">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="w-12 pl-6">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleAll}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />
                  </TableHead>
                  {isAdmin && <TableHead className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-4">Full Name</TableHead>}
                  <TableHead className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-4">Order #</TableHead>
                  <TableHead className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-4 whitespace-nowrap">Order Date</TableHead>
                  <TableHead className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-4">PO No.</TableHead>
                  <TableHead className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-4">Service</TableHead>
                  <TableHead className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-4 text-right pr-6">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map(order => {
                  const isSelected = selectedOrderIds.includes(order.orderId);
                const sym = currencySymbol(order.currency);
                
                // Logic to disable incompatible currencies
                const firstSelectedOrder = selectedOrders[0];
                const isCurrencyDisabled = firstSelectedOrder && firstSelectedOrder.currency !== order.currency;

                return (
                  <TableRow
                    key={order.orderId}
                    onClick={() => !isCurrencyDisabled && toggleOrder(order.orderId)}
                    className={`group transition-colors ${
                      isSelected ? 'bg-slate-50/80' : 
                      isCurrencyDisabled ? 'opacity-40 cursor-not-allowed bg-slate-50/20' : 
                      'hover:bg-slate-50/30 cursor-pointer'
                    }`}
                  >
                    <TableCell className="pl-6">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!!isCurrencyDisabled}
                        onChange={() => toggleOrder(order.orderId)}
                        onClick={e => e.stopPropagation()}
                        className={`rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 ${
                          isCurrencyDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <span className="text-[13px] font-medium text-slate-600">{order.fullname}</span>
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="text-[13px] font-black text-cyan-600">
                        {order.orderNo}
                      </span>
                    </TableCell>
                    <TableCell className="text-[13px] text-slate-500 font-medium">
                      {formatDate(order.orderDate)}
                    </TableCell>
                    <TableCell className="text-[13px] text-slate-500 font-medium">
                      {order.poNo || '--'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                        {order.serviceName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex flex-col items-end">
                        <span className={`text-[13px] font-black ${isSelected ? 'text-cyan-700' : 'text-slate-900'}`}>
                          {sym}{Number(order.amount || 0).toFixed(2)}
                        </span>
                        {isCurrencyDisabled && (
                          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">
                            Diff. Currency ({order.currency})
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CartIcon className="text-slate-300" size={32} />
              </div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No pending orders found</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {filteredOrders.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={filteredOrders.length}
              itemsPerPage={itemsPerPage}
              indexOfFirstItem={(currentPage - 1) * itemsPerPage}
              indexOfLastItem={Math.min(currentPage * itemsPerPage, filteredOrders.length)}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
