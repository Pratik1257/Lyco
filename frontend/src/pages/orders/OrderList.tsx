import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, ShoppingBag, Eye, X, Edit2, Trash2,
  Download, Plus, Clock, CheckCircle2, AlertCircle,
  FileText, Calendar, User, Mail, Layers, Maximize2, DollarSign, Link, ExternalLink, FileIcon
} from 'lucide-react';

import { ordersApi } from '../../api/ordersApi';
import { servicesApi } from '../../api/servicesApi';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import CustomSelect from '../../components/ui/CustomSelect';
import DatePicker from '../../components/ui/DatePicker';

export default function OrderList() {
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
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: fullOrderDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['order-details', selectedOrderId],
    queryFn: () => ordersApi.getOrderById(selectedOrderId!),
    enabled: !!selectedOrderId && isViewModalOpen,
  });

  // Use full details if available, otherwise fallback to list item
  const activeOrder = fullOrderDetails || orderToView;

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
    queryFn: () => ordersApi.getOrders(currentPage, itemsPerPage, searchQuery, statusFilter, serviceFilter, undefined, startDate, endDate),
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
      const allData = await ordersApi.getOrders(1, 1000, searchQuery, statusFilter, serviceFilter, undefined, startDate, endDate);
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
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
        {/* Top Row: Search & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search Order #, User, Email, PO..."
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex items-center gap-2">
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
              onClick={() => navigate('/orders/new')}
              className="bg-gradient-to-r from-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/20 h-11 px-5 rounded-xl text-xs"
            >
              <Plus size={16} />
              Place New Order
            </Button>
          </div>
        </div>

        {/* Bottom Row: Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            onChange={(val) => { setStatusFilter(val as string); setCurrentPage(1); }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'In Process', label: 'In Process' },
              { value: 'Cancelled', label: 'Cancelled' },
              { value: 'Completed', label: 'Completed' },
            ]}
            placeholder="Status"
          />
          <DatePicker
            value={startDate}
            onChange={(v) => { setStartDate(v); setCurrentPage(1); }}
            placeholder="From Date"
          />
          <DatePicker
            value={endDate}
            onChange={(v) => { setEndDate(v); setCurrentPage(1); }}
            placeholder="To Date"
            align="right"
          />
        </div>
      </div>


      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="py-2 px-6 whitespace-nowrap">Order #</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Ordered On</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Username</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Email</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">PO No.</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Service</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Price</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Status</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Completed Date</TableHead>
                <TableHead className="py-2 px-6 text-right whitespace-nowrap">Actions</TableHead>
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
                  <TableRow 
                    key={order.orderId} 
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
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
                    <TableCell className="px-4 text-slate-900 text-sm font-medium whitespace-nowrap">{order.username}</TableCell>
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
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all ${getStatusStyle(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs font-medium whitespace-nowrap">{formatDate(order.completedDate)}</TableCell>
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
       {isViewModalOpen && activeOrder && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
             onClick={() => {
               setIsViewModalOpen(false);
               setSelectedOrderId(null);
             }}
           />
           
           <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             {/* Header */}
             <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
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
                 onClick={() => {
                   setIsViewModalOpen(false);
                   setSelectedOrderId(null);
                 }}
                 className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
 
             <div className="p-8 overflow-y-auto max-h-[calc(100vh-160px)]">
               {isLoadingDetails ? (
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
                             {activeOrder.serviceName || orderToView?.serviceName}
                           </span>
                         </span>
                       </div>
                     </div>
                   </div>
 
                   <div className="space-y-4">
                     <div className="flex items-start gap-4">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                         <ShoppingBag size={16} className="text-slate-400" />
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
                         <CheckCircle2 size={16} className="text-slate-400" />
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
                   onClick={() => {
                     setIsViewModalOpen(false);
                     setSelectedOrderId(null);
                   }}
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
