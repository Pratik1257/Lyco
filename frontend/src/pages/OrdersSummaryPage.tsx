import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, ShoppingBag, Eye, X, Edit2, Trash2,
  Download, Plus, Clock, CheckCircle2, AlertCircle,
  FileText, Calendar, User, Mail, Layers, Maximize2, DollarSign, Layout
} from 'lucide-react';

import { ordersApi } from '../api/ordersApi';
import { servicesApi } from '../api/servicesApi';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import CustomSelect from '../components/ui/CustomSelect';
import DatePicker from '../components/ui/DatePicker';

export default function OrdersSummaryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [orderToView, setOrderToView] = useState<any>(null);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);

  // Queries
  const { data: servicesData } = useQuery({
    queryKey: ['services-dropdown'],
    queryFn: () => servicesApi.getServices(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', currentPage, itemsPerPage, searchQuery, statusFilter, serviceFilter, startDate, endDate],
    queryFn: () => ordersApi.getOrders(currentPage, itemsPerPage, searchQuery, statusFilter, serviceFilter, startDate, endDate),
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
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

  const getStatusIcon = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return <CheckCircle2 size={12} />;
    if (s.includes('process')) return <Clock size={12} />;
    if (s.includes('cancel')) return <AlertCircle size={12} />;
    return <Clock size={12} />;
  };

  const handleExport = async () => {
    const loadingToast = toast.loading('Preparing export...');
    try {
      // Fetch all filtered orders (using a large pageSize to get all matching results)
      const allData = await ordersApi.getOrders(1, 1000, searchQuery, statusFilter, serviceFilter, startDate, endDate);
      const items = allData.items;

      if (items.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No orders to export');
        return;
      }

      // Create CSV header
      const headers = ['Order #', 'Date', 'Username', 'Email', 'PO No.', 'Service', 'Price', 'Status', 'Completed Date'];
      const csvRows = [headers.join(',')];

      // Add data rows
      items.forEach(order => {
        const row = [
          `"${order.orderNo || ''}"`,
          `"${order.orderDate ? (new Date(order.orderDate).getMonth() + 1) + '/' + new Date(order.orderDate).getDate() + '/' + new Date(order.orderDate).getFullYear() : ''}"`,
          `"${order.username || ''}"`,
          `"${order.email || ''}"`,
          `"${order.workTitle || ''}"`,
          `"${order.serviceName || ''}"`,
          `"${order.amount || '0'}"`,
          `"${order.orderStatus || ''}"`,
          `"${order.completedDate ? (new Date(order.completedDate).getMonth() + 1) + '/' + new Date(order.completedDate).getDate() + '/' + new Date(order.completedDate).getFullYear() : ''}"`
        ];
        csvRows.push(row.join(','));
      });

      // Download CSV with BOM for Excel compatibility
      const csvString = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(loadingToast);
      toast.success(`Exported ${items.length} orders successfully`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to export orders');
    }
  };


  return (
    <div className="relative space-y-4 animate-in fade-in duration-500">
      {/* Unified Header & Filter Card */}
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-500/10">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">Order Summary</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleExport}
              className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/orders/new')}
              className="bg-gradient-to-r from-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/20 h-10 px-5 rounded-xl text-xs"
            >
              <Plus size={16} />
              Place New Order
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search Order #, User, Email, PO..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Service Filter */}
          <div>
            <CustomSelect
              value={serviceFilter || ''}
              onChange={(val) => { setServiceFilter(val ? Number(val) : undefined); setCurrentPage(1); }}
              options={[
                { value: '', label: 'All Services' },
                ...(servicesData?.items || []).map(s => ({ value: s.id, label: s.name }))
              ]}
              placeholder="Service"
            />
          </div>

          {/* Status Filter */}
          <div>
            <CustomSelect
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val as string); setCurrentPage(1); }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'In Process', label: 'In Process' },
                { value: 'Cancelled', label: 'Cancelled' },
                { value: 'Completed', label: 'Completed' },
              ]}
              placeholder="Status"
            />
          </div>

          {/* Date Pickers */}
          <div className="lg:col-span-1 flex items-center gap-2">
            <DatePicker
              value={startDate}
              onChange={(v) => { setStartDate(v); setCurrentPage(1); }}
              placeholder="From Date"
              className="flex-1"
            />
          </div>
          <div className="lg:col-span-1 flex items-center gap-2">
            <DatePicker
              value={endDate}
              onChange={(v) => { setEndDate(v); setCurrentPage(1); }}
              placeholder="To Date"
              className="flex-1"
              align="right"
            />
          </div>
        </div>


      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="py-3 px-6 font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">Order #</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">Ordered On</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">Username</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">Email</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">PO No.</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">Service</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">Price</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">Status</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400 whitespace-nowrap">Completed Date</TableHead>
                <TableHead className="py-3 px-6 font-black uppercase text-[9px] tracking-widest text-slate-400 text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                /* Skeleton rows */
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j} className="py-2.5 px-6">
                        <div className="h-3 bg-slate-100 rounded-md w-full"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.orderId} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-2 px-6 font-bold text-slate-900 text-[12px] whitespace-nowrap">{order.orderNo || '--'}</TableCell>
                    <TableCell className="py-2 px-4 text-slate-600 text-[12px] font-medium whitespace-nowrap">{formatDate(order.orderDate)}</TableCell>
                    <TableCell className="py-2 px-4 text-slate-900 text-[12px] font-bold whitespace-nowrap">{order.username}</TableCell>
                    <TableCell className="py-2 px-4 text-slate-500 text-[11px] whitespace-nowrap">{order.email || '--'}</TableCell>
                    <TableCell className="py-2 px-4 text-slate-600 text-[11px] font-medium whitespace-nowrap">{order.workTitle || '--'}</TableCell>
                    <TableCell className="py-2 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {order.serviceName}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-4 font-bold text-slate-900 text-[12px] whitespace-nowrap">
                      {formatPrice(order.amount, order.currency)}
                    </TableCell>
                    <TableCell className="py-2 px-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${getStatusStyle(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-4 text-slate-500 text-[11px] font-medium whitespace-nowrap">{formatDate(order.completedDate)}</TableCell>
                    <TableCell className="py-2 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost-cyan"
                          size="icon"
                          className="w-7 h-7 rounded-lg hover:bg-cyan-50 text-cyan-600"
                          title="View Details"
                          onClick={() => {
                            setOrderToView(order);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost-blue"
                          size="icon"
                          className="w-7 h-7 rounded-lg hover:bg-blue-50 text-blue-600"
                          title="Edit Order"
                          onClick={() => {
                            navigate(`/orders/edit/${order.orderId}`);
                          }}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost-red"
                          size="icon"
                          className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600"
                          title="Delete Order"
                          onClick={() => {
                            setOrderToDelete(order);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="py-24 text-center">
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
        </div>

        {/* Pagination */}
        <div className="p-6 bg-slate-50/30 border-t border-slate-50">
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
      {isViewModalOpen && orderToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsViewModalOpen(false)}
          />

          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                  <FileText size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Order Details</h3>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{orderToView.orderNo}</p>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {/* Column 1: Order Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Calendar size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Order Date</span>
                      <span className="text-[13px] font-bold text-slate-700">{formatDate(orderToView.orderDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <User size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Username</span>
                      <span className="text-[13px] font-bold text-slate-700">{orderToView.username}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Email</span>
                      <span className="text-[13px] font-bold text-slate-700">{orderToView.email || '--'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Layout size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Service</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {orderToView.serviceName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Specifics */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Layers size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">PO / Artwork</span>
                      <span className="text-[13px] font-bold text-slate-700">{orderToView.workTitle || '--'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Maximize2 size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Size</span>
                      <span className="text-[13px] font-bold text-slate-700">{orderToView.size ? `${orderToView.size} ${orderToView.sizetype}` : '--'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <DollarSign size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Price</span>
                      <span className="text-[13px] font-bold text-slate-700">{formatPrice(orderToView.amount, orderToView.currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">Status</span>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getStatusStyle(orderToView.orderStatus)}`}>
                        {orderToView.orderStatus || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions - Full Width */}
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Instructions</span>
                  <div className="bg-slate-50 rounded-2xl p-4 text-[13px] text-slate-600 leading-relaxed min-h-[100px] border border-slate-100">
                    {orderToView.instructions || 'No specific instructions provided.'}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={() => setIsViewModalOpen(false)}
                  variant="primary"
                  className="px-10 rounded-xl"
                >
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsDeleteModalOpen(false)}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Order?</h3>
              <p className="text-slate-500 text-sm mb-8">
                Are you sure you want to delete order <span className="font-bold text-slate-900">#{orderToDelete.orderNo}</span>? This action cannot be undone.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="h-11 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <Button
                  variant="danger"
                  className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                  isLoading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(orderToDelete.orderId)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
