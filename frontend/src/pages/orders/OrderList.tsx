import { useState, useEffect, useLayoutEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Download, Plus, Clock, CheckCircle2, AlertCircle, Info,
  CreditCard, Loader2,
  Search, ShoppingBag, Eye, Edit2, Trash2, Receipt, XCircle
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth } from '../../context/AuthContext';

import { ordersApi } from '../../api/ordersApi';
import { paymentsApi } from '../../api/paymentsApi';
import { servicesApi } from '../../api/servicesApi';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import CustomSelect from '../../components/ui/CustomSelect';
import DatePicker from '../../components/ui/DatePicker';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { OrderDetailsModal } from '../../components/ui/OrderDetailsModal';
import CompleteOrderModal from './CompleteOrderModal';
import type { Order } from '../../api/ordersApi';

export default function OrderList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const initialPaymentStatus = searchParams.get('paymentStatus') || 'all';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';
  const initialCurrency = searchParams.get('currency') || '';

  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  const queryClient = useQueryClient();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(initialPaymentStatus);
  const [serviceFilter, setServiceFilter] = useState<number | undefined>(undefined);
  const [currencyFilter, setCurrencyFilter] = useState(initialCurrency);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [timeframeFilter, setTimeframeFilter] = useState(
    (initialStartDate && initialEndDate) ? 'Custom' : ''
  );
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);

  const handleTimeframeChange = (val: string) => {
    setTimeframeFilter(val);
    if (!val || val === 'Custom') {
      setStartDate('');
      setEndDate('');
      if (val === 'Custom') {
        setTimeout(() => setIsStartDateOpen(true), 0);
      }
      setCurrentPage(1);
      return;
    }
    
    const now = new Date();
    const etString = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(now);
    
    const [m, d, y] = etString.split('/');
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    if (val === 'This Week') {
      const etDate = new Date(year, month - 1, day);
      const dayOfWeek = etDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startOfWeek = new Date(year, month - 1, day + diffToMonday);
      const endOfWeek = new Date(year, month - 1, day + diffToMonday + 6);
      setStartDate(formatDate(startOfWeek));
      setEndDate(formatDate(endOfWeek));
    } else if (val === 'This Month') {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      setStartDate(formatDate(startOfMonth));
      setEndDate(formatDate(endOfMonth));
    } else if (val === 'This Year') {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      setStartDate(formatDate(startOfYear));
      setEndDate(formatDate(endOfYear));
    }
    setCurrentPage(1);
  };

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [orderToView, setOrderToView] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);

  // Payment Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [initiating, setInitiating] = useState(false);

  // Sync state to URL
  const syncToUrl = (newFilters: any) => {
    const params = new URLSearchParams();
    const currentParams = new URLSearchParams(location.search);
    
    // Preserve existing params but overwrite with new ones
    const merged = {
      status: statusFilter,
      paymentStatus: paymentStatusFilter,
      startDate,
      endDate,
      timeframe: timeframeFilter,
      currency: currencyFilter,
      ...newFilters
    };

    Object.entries(merged).forEach(([key, val]) => {
      if (val && val !== 'all') {
        params.set(key, val.toString());
      }
    });

    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  useLayoutEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status') || 'all';
    const paymentStatus = params.get('paymentStatus') || 'all';
    const start = params.get('startDate') || '';
    const end = params.get('endDate') || '';
    const timeframe = params.get('timeframe') || (params.get('startDate') && params.get('endDate') ? 'Custom' : '');
    const currency = params.get('currency') || '';

    console.log('OrderList Sync From URL:', { status, paymentStatus, search: location.search });

    setStatusFilter(status);
    setPaymentStatusFilter(paymentStatus);
    setStartDate(start);
    setEndDate(end);
    setTimeframeFilter(timeframe);
    setCurrencyFilter(currency);
    
    setCurrentPage(1);
  }, [location.search]);

  // Queries
  const { data: servicesData } = useQuery({
    queryKey: ['services-dropdown'],
    queryFn: () => servicesApi.getServices(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', currentPage, itemsPerPage, searchQuery, statusFilter, paymentStatusFilter, serviceFilter, currencyFilter, startDate, endDate, (user as any)?.uniqueNo],
    queryFn: () => ordersApi.getOrders(currentPage, itemsPerPage, searchQuery, statusFilter, paymentStatusFilter, serviceFilter, isAdmin ? undefined : (user as any)?.uniqueNo, startDate, endDate, currencyFilter),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ordersApi.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted successfully');
      setIsDeleteModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete order');
    }
  });

  // Derived
  const orders = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ── Payment Selection Logic ───────────────────────────────────────────────
  const validOrdersForSelection = orders.filter((o: any) => (o.orderStatus === 'Completed' || o.orderStatus === 'Invoiced') && (o.paymentStatus === 'Pending' || !o.paymentStatus));

  const toggleOrder = (id: number) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const selectedOrders = orders.filter((o: any) => selectedOrderIds.includes(o.orderId));
  const hasSelections = selectedOrderIds.length > 0;

  // Determine the "anchor" for selection (the first selected order, or the first valid one on the page)
  const selectionAnchor = selectedOrders.length > 0 ? selectedOrders[0] : validOrdersForSelection[0];

  // Orders that match the anchor's currency (and user, if Admin)
  const compatibleMatches = selectionAnchor ? validOrdersForSelection.filter((o: any) =>
    o.currency === selectionAnchor.currency &&
    (!isAdmin || (o.userId || o.uniqueNo) === (selectionAnchor.userId || selectionAnchor.uniqueNo))
  ) : [];

  const isAllSelected = compatibleMatches.length > 0 && compatibleMatches.every(m => selectedOrderIds.includes(m.orderId));

  const handleToggleAll = () => {
    if (!selectionAnchor) return;

    if (isAllSelected) {
      // If everything compatible is already selected, clear the selection
      setSelectedOrderIds([]);
    } else {
      // Otherwise, select all compatible orders
      setSelectedOrderIds(compatibleMatches.map(m => m.orderId));

      if (compatibleMatches.length < validOrdersForSelection.length) {
        toast.success(`Selected all orders for ${selectionAnchor.username || selectionAnchor.fullname} (${selectionAnchor.currency}).`);
      }
    }
  };

  const selectedTotal = selectedOrders.reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0);
  const activeCurrency = selectedOrders.length > 0 ? selectedOrders[0].currency : 'USD';
  const activeSymbol = activeCurrency === 'GBP' ? '£' : (activeCurrency === 'EUR' || activeCurrency === 'EURO') ? '€' : activeCurrency === 'AUD' ? 'A$' : activeCurrency === 'INR' ? '₹' : '$';

  const handleMakePayment = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Please select at least one order');
      return;
    }

    setInitiating(true);
    try {
      const targetUserId = isAdmin ? (selectedOrders[0].userId || selectedOrders[0].uniqueNo) : ((user as any)?.userId || selectedOrders[0].uniqueNo);

      const result = await paymentsApi.initiatePayment({
        userId: targetUserId || 0,
        orderIds: selectedOrderIds,
      });
      toast.success('Payment initiated! Opening PayPal...');
      window.open(result.paypalUrl, '_blank', 'noopener,noreferrer');

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrderIds([]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to initiate payment';
      toast.error(msg);
    } finally {
      setInitiating(false);
    }
  };


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
    const symbol = currency === 'GBP' ? '£' : (currency === 'EUR' || currency === 'EURO') ? '€' : currency === 'AUD' ? 'A$' : currency === 'INR' ? '₹' : '$';
    return `${symbol}${amount}`;
  };

  const getStatusStyle = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return 'bg-green-50 text-green-700 border-green-100';
    if (s.includes('process')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (s.includes('cancel')) return 'bg-red-50 text-red-700 border-red-100';
    if (s.includes('pending')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (s.includes('invoice')) return 'bg-purple-50 text-purple-700 border-purple-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const getStatusIcon = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return <CheckCircle2 size={12} />;
    if (s.includes('process')) return <Clock size={12} />;
    if (s.includes('cancel')) return <AlertCircle size={12} />;
    if (s.includes('invoice')) return <Receipt size={12} />;
    return <Clock size={12} />;
  };

  const getPaymentStatusStyle = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'paid') return 'bg-green-50 text-green-700 border-green-100';
    if (s === 'pending' || s === '') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (s.includes('bad')) return 'bg-red-50 text-red-700 border-red-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const getPaymentStatusIcon = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'paid') return <CheckCircle2 size={12} />;
    if (s.includes('bad')) return <XCircle size={12} />;
    return <Clock size={12} />;
  };

  const handleExport = async () => {
    const loadingToast = toast.loading('Preparing professional Excel export...');
    try {
      const allData = await ordersApi.getOrders(1, 1000, searchQuery, statusFilter, paymentStatusFilter, serviceFilter, isAdmin ? undefined : (user as any)?.uniqueNo, startDate, endDate);
      const items = allData.items;

      if (items.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No orders to export');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Orders Summary');

      // 1. Define Columns
      worksheet.columns = [
        { header: 'Order #', key: 'orderNo', width: 15 },
        { header: 'Ordered On', key: 'orderedOn', width: 15 },
        { header: 'Username', key: 'username', width: 25 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'PO No.', key: 'poNo', width: 30 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'Price', key: 'price', width: 12 },
        { header: 'Order Status', key: 'orderStatus', width: 15 },
        { header: 'Completed Date', key: 'completedDate', width: 18 }
      ];

      // 2. Style Header Row (Gray Background, Centered, Bold)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 20; // Reduced height to match legacy
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' } // Light Gray matching screenshot
        };
        cell.font = {
          bold: true,
          name: 'Calibri',
          size: 11,
          color: { argb: 'FF000000' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // 3. Add Empty Row for spacing (matches legacy Row 2)
      worksheet.addRow({});
      worksheet.getRow(2).height = 10;

      // 4. Add Data Rows
      items.forEach((order) => {
        const rowData = {
          orderNo: order.orderNo || '',
          orderedOn: order.orderDate ? formatDate(order.orderDate) : '',
          username: order.username || '',
          email: order.email || '',
          poNo: order.workTitle || '',
          service: order.serviceName || '',
          price: order.amount ? parseFloat(order.amount) : 0, // Store as actual number
          orderStatus: order.orderStatus || '',
          completedDate: order.completedDate ? formatDate(order.completedDate) : '--'
        };

        const row = worksheet.addRow(rowData);

        // Style Data Cells
        row.eachCell((cell, colNumber) => {
          const colKey = worksheet.columns[colNumber - 1].key;

          // Center all columns as requested
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center'
          };

          cell.font = { name: 'Calibri', size: 11 };

          // Format Price as Currency (removes green triangle)
          if (colKey === 'price') {
            const symbol = order.currency === 'GBP' ? '£' : '$';
            cell.numFmt = `"${symbol}"#,##0.00`;
          }

          // Thin borders for data
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEDEDED' } },
            left: { style: 'thin', color: { argb: 'FFEDEDED' } },
            bottom: { style: 'thin', color: { argb: 'FFEDEDED' } },
            right: { style: 'thin', color: { argb: 'FFEDEDED' } }
          };
        });
      });

      // 5. Generate and Save File
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Orders_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.dismiss(loadingToast);
      toast.success(`Exported ${items.length} orders successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to export orders');
    }
  };


  console.log('OrderList Render - paymentStatusFilter:', paymentStatusFilter);

  return (
    <div className="relative animate-in fade-in duration-500 space-y-4">
      {/* Checkout Summary Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-in slide-in-from-top-2">
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
              <div className="h-10 w-px bg-slate-100 hidden lg:block" />
              <div className="hidden lg:flex flex-col">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Checkout Note:</span>
                <p className="text-[10px] font-bold text-slate-400 leading-tight max-w-[200px]">
                  Showing valid orders matching selected currency{isAdmin ? ' and user' : ''}. Uncheck to select others.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <Button
                onClick={handleMakePayment}
                disabled={initiating || selectedOrderIds.length === 0}
                className="flex-1 md:flex-none h-14 px-10 bg-[#fbb03b] hover:bg-[#e89d2a] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                variant="unstyled"
              >
                {initiating ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <CreditCard size={20} />
                )}
                {initiating ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Unified Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {/* Header & Filter Section */}
        <div className="p-4 sm:px-6 space-y-4 border-b border-slate-100 bg-slate-50/30 rounded-t-2xl">
          {/* Top Row: Search & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search Order #, Full Name, User, Email, PO..."
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group/rules hidden sm:block">
                <button
                  type="button"
                  className="h-11 px-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-help"
                >
                  <Info size={14} className="text-cyan-600" />
                  Payment Rules
                </button>
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 opacity-0 invisible group-hover/rules:opacity-100 group-hover/rules:visible transition-all z-50">
                  <h4 className="text-[11px] font-black uppercase text-slate-800 mb-2 border-b border-slate-100 pb-2">Payment Rules</h4>
                  <ul className="text-[11px] text-slate-600 space-y-2 list-disc pl-4">
                    <li>Only <b>Completed</b> and <b>Invoiced</b> orders can be paid</li>
                    <li><b>Paid</b>, <b>Cancelled</b>, and <b>In-Process</b> orders cannot be selected</li>
                    {isAdmin && <li>Batch payments are limited to <b>one customer</b> at a time</li>}
                  </ul>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handleExport}
                className="h-11 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-2 shadow-none"
              >
                <Download size={16} />
                Export
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate(isAdmin ? '/admin/orders/new' : '/orders/new')}
                className="bg-gradient-to-r from-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/20 h-11 px-5 rounded-xl text-xs"
              >
                <Plus size={16} />
                Place New Order
              </Button>
            </div>
          </div>

          {/* Bottom Row: Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <CustomSelect
              value={serviceFilter || ''}
              onChange={(val) => { setServiceFilter(val ? Number(val) : undefined); setCurrentPage(1); }}
              options={[
                { value: '', label: 'All Services' },
                ...(servicesData?.items || []).map(s => ({ value: s.id, label: s.name }))
              ]}
              placeholder="Service"
            />
            <CustomSelect
              value={statusFilter}
              onChange={(val) => { 
                const s = val as string;
                setStatusFilter(s); 
                syncToUrl({ status: s });
                setCurrentPage(1); 
              }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'In Process', label: 'In Process' },
                { value: 'Cancelled', label: 'Cancelled' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Invoiced', label: 'Invoiced' },
              ]}
              placeholder="Status"
            />
            <CustomSelect
              value={paymentStatusFilter}
              onChange={(val) => { 
                const p = val as string;
                setPaymentStatusFilter(p); 
                syncToUrl({ paymentStatus: p });
                setCurrentPage(1); 
              }}
              options={[
                { value: 'all', label: 'All Payment' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Bad Debt', label: 'Bad Debt' },
              ]}
              placeholder="Payment Status"
            />
            <CustomSelect
              value={timeframeFilter}
              onChange={handleTimeframeChange}
              options={[
                { value: '', label: 'All Time' },
                { value: 'This Week', label: 'This Week' },
                { value: 'This Month', label: 'This Month' },
                { value: 'This Year', label: 'This Year' },
                { value: 'Custom', label: 'Custom' }
              ]}
              placeholder="Timeframe"
            />
            <DatePicker
              value={startDate}
              isOpen={isStartDateOpen}
              onOpenChange={setIsStartDateOpen}
              onChange={(v) => { setStartDate(v); setTimeframeFilter(v || endDate ? 'Custom' : ''); setCurrentPage(1); }}
              placeholder="From Date"
            />
            <DatePicker
              value={endDate}
              onChange={(v) => { setEndDate(v); setTimeframeFilter(startDate || v ? 'Custom' : ''); setCurrentPage(1); }}
              placeholder="To Date"
              align="right"
            />
          </div>
        </div>

        {/* Main Table Section */}
        <div className="overflow-x-auto relative">
          {isLoading ? (
            <TableSkeleton rows={itemsPerPage} cols={9} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="w-12 pl-6">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleAll}
                      disabled={validOrdersForSelection.length === 0}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </TableHead>
                  <TableHead className="py-2 px-6 whitespace-nowrap">Order #</TableHead>
                  <TableHead className="py-2 px-4 whitespace-nowrap">Ordered On</TableHead>
                  {isAdmin && <TableHead className="py-2 px-4 whitespace-nowrap">Full Name</TableHead>}
                  <TableHead className="py-2 px-4 whitespace-nowrap">Email</TableHead>
                  <TableHead className="py-2 px-4 whitespace-nowrap">PO No.</TableHead>
                  <TableHead className="py-2 px-4 whitespace-nowrap">Service</TableHead>
                  <TableHead className="py-2 px-4 whitespace-nowrap">Price</TableHead>
                  <TableHead className="py-2 px-4 text-center whitespace-nowrap">Order Status</TableHead>
                  <TableHead className="py-2 px-4 whitespace-nowrap">Completed Date</TableHead>
                  <TableHead className="py-2 px-4 text-center whitespace-nowrap">Payment Status</TableHead>
                  <TableHead className="py-2 px-6 text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  /* Skeleton rows */
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell className="py-2.5 px-6">
                        <div className="h-4 w-4 bg-slate-100 rounded"></div>
                      </TableCell>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j} className="py-2.5 px-6">
                          <div className="h-3 bg-slate-100 rounded-md w-full"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => {
                    const isSelected = selectedOrderIds.includes(order.orderId);
                    const firstSelectedOrder = selectedOrders[0];

                    let isCheckboxDisabled = false;
                    let disabledReason = '';

                    if (order.orderStatus !== 'Completed' && order.orderStatus !== 'Invoiced') {
                      isCheckboxDisabled = true;
                      disabledReason = `Cannot select ${order.orderStatus || 'In-Process'} orders. Only Completed or Invoiced orders are eligible.`;
                    } else if (order.paymentStatus !== 'Pending' && order.paymentStatus !== null && order.paymentStatus !== '') {
                      isCheckboxDisabled = true;
                      disabledReason = `Order's Payment already ${order.paymentStatus}.`;
                    } else if (firstSelectedOrder) {
                      if (firstSelectedOrder.currency !== order.currency) {
                        isCheckboxDisabled = true;
                        disabledReason = `Diff. Currency`;
                      } else if (isAdmin && (firstSelectedOrder.userId || firstSelectedOrder.uniqueNo) !== (order.userId || order.uniqueNo)) {
                        isCheckboxDisabled = true;
                        disabledReason = 'Diff. User';
                      }
                    }

                    return (
                      <TableRow
                        key={order.orderId}
                        className={`group transition-colors ${isSelected ? 'bg-slate-50/80' :
                          isCheckboxDisabled && hasSelections ? 'opacity-40 bg-slate-50/20' :
                            'hover:bg-slate-50/50'
                          }`}
                      >
                        <TableCell className="pl-6">
                          <div className="flex flex-col gap-1 w-12" title={isCheckboxDisabled ? disabledReason : undefined}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isCheckboxDisabled}
                              onChange={() => toggleOrder(order.orderId)}
                              className={`rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 ${isCheckboxDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                                }`}
                            />
                          </div>
                        </TableCell>
                        <TableCell
                          className="px-6 font-bold text-cyan-600 hover:text-cyan-700 cursor-pointer text-sm whitespace-nowrap transition-colors"
                          onClick={() => {
                            setOrderToView(order);
                            setSelectedOrderId(order.orderId);
                            setIsViewModalOpen(true);
                          }}
                        >
                          {order.orderNo || '--'}
                        </TableCell>
                        <TableCell className="px-4 text-slate-600 text-sm font-medium whitespace-nowrap">{formatDate(order.orderDate)}</TableCell>
                        {isAdmin && <TableCell className="px-4 text-slate-900 text-sm font-medium whitespace-nowrap">{order.fullname}</TableCell>}
                        <TableCell className="px-4 text-slate-500 text-xs whitespace-nowrap">{order.email || '--'}</TableCell>
                        <TableCell className="px-4 text-slate-600 text-xs font-medium whitespace-nowrap">{order.workTitle || '--'}</TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                            {order.serviceName}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                          {formatPrice(order.amount, order.currency)}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          <div className={`flex items-center justify-center gap-1 w-[100px] py-1 rounded-lg border text-[11px] font-bold transition-all ${getStatusStyle(order.orderStatus)}`}>
                            {getStatusIcon(order.orderStatus)}
                            {order.orderStatus || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-slate-500 text-xs font-medium whitespace-nowrap">{formatDate(order.completedDate)}</TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          <div className={`flex items-center justify-center gap-1 w-[100px] py-1 rounded-lg border text-[11px] font-bold transition-all ${getPaymentStatusStyle(order.paymentStatus)}`}>
                            {getPaymentStatusIcon(order.paymentStatus)}
                            {order.paymentStatus || 'Pending'}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost-cyan"
                              size="icon"
                              className="w-7 h-7 rounded-lg hover:bg-cyan-50 text-cyan-600"
                              title="View Details"
                              onClick={() => {
                                setOrderToView(order);
                                setSelectedOrderId(order.orderId);
                                setIsViewModalOpen(true);
                              }}
                            >
                              <Eye size={14} />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost-blue"
                                size="icon"
                                className="w-7 h-7 rounded-lg hover:bg-blue-50 text-blue-600"
                                title="Edit Order"
                                onClick={() => {
                                  navigate(isAdmin ? `/admin/orders/edit/${order.orderId}` : `/orders/edit/${order.orderId}`);
                                }}
                              >
                                <Edit2 size={14} />
                              </Button>
                            )}
                            {isAdmin && order.orderStatus !== 'Completed' && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Invoiced' && (
                              <Button
                                variant="ghost-green"
                                size="icon"
                                className="w-7 h-7 rounded-lg hover:bg-green-50 text-green-600"
                                title="Complete Order"
                                onClick={() => {
                                  setOrderToComplete(order);
                                  setIsCompleteModalOpen(true);
                                }}
                              >
                                <CheckCircle2 size={14} />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost-red"
                                size="icon"
                                className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  order.orderStatus === 'Completed' ? "Cannot delete completed orders" :
                                    order.orderStatus === 'Invoiced' ? "Cannot delete invoiced orders" :
                                      "Delete Order"
                                }
                                disabled={order.orderStatus === 'Completed' || order.orderStatus === 'Invoiced'}
                                onClick={() => {
                                  setOrderToDelete(order);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                          <ShoppingBag size={32} className="text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
                        <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search query.</p>

                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-6 bg-slate-50/30 border-t border-slate-50 rounded-b-2xl">
          <Pagination
            totalCount={totalCount}
            indexOfFirstItem={(currentPage - 1) * itemsPerPage}
            indexOfLastItem={Math.min(currentPage * itemsPerPage, totalCount)}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* View Order Modal */}
      <OrderDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedOrderId(null);
        }}
        orderId={selectedOrderId}
        initialOrderData={orderToView}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Order"
        message={
          <>
            Are you sure you want to delete order <span className="font-bold text-slate-900">#{orderToDelete?.orderNo}</span>? This action cannot be undone.
          </>
        }
        onConfirm={() => deleteMutation.mutate(orderToDelete.orderId)}
        onCancel={() => setIsDeleteModalOpen(false)}
        isPending={deleteMutation.isPending}
      />

      {/* Complete Order Modal */}
      <CompleteOrderModal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setOrderToComplete(null);
        }}
        order={orderToComplete}
      />
    </div>
  );
}
