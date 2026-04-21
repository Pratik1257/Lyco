import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingBag, Eye, 
  Download, Plus, Clock, CheckCircle2, AlertCircle
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

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Queries
  const { data: servicesData } = useQuery({
    queryKey: ['services-dropdown'],
    queryFn: () => servicesApi.getServices(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', currentPage, itemsPerPage, searchQuery, statusFilter, serviceFilter, startDate, endDate],
    queryFn: () => ordersApi.getOrders(currentPage, itemsPerPage, searchQuery, statusFilter, serviceFilter, startDate, endDate),
  });

  // Derived
  const orders = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            <button className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all border border-slate-100">
              <Download size={14} />
              Export
            </button>
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
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
                { value: 'Pending', label: 'Pending' },
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
                <TableHead className="py-3 px-6 font-black uppercase text-[9px] tracking-widest text-slate-400">Order #</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400">Ordered On</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400">Username</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400">Email</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400">PO No.</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400">Service</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400">Price</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400">Status</TableHead>
                <TableHead className="py-3 px-4 font-black uppercase text-[9px] tracking-widest text-slate-400">Completed Date</TableHead>
                <TableHead className="py-3 px-6 font-black uppercase text-[9px] tracking-widest text-slate-400 text-right">Actions</TableHead>
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
                    <TableCell className="py-2 px-6 font-bold text-slate-900 text-[12px]">{order.orderNo || '--'}</TableCell>
                    <TableCell className="py-2 px-4 text-slate-600 text-[12px] font-medium">{formatDate(order.orderDate)}</TableCell>
                    <TableCell className="py-2 px-4 text-slate-900 text-[12px] font-bold">{order.username}</TableCell>
                    <TableCell className="py-2 px-4 text-slate-500 text-[11px]">{order.email || '--'}</TableCell>
                    <TableCell className="py-2 px-4 text-slate-600 text-[11px] font-medium max-w-[150px] truncate">{order.workTitle || '--'}</TableCell>
                    <TableCell className="py-2 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {order.serviceName}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-4 font-bold text-slate-900 text-[12px]">
                      {formatPrice(order.amount, order.currency)}
                    </TableCell>
                    <TableCell className="py-2 px-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${getStatusStyle(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-4 text-slate-500 text-[11px] font-medium">{formatDate(order.completedDate)}</TableCell>
                    <TableCell className="py-2 px-6 text-right">
                      <Button
                        variant="ghost-cyan"
                        size="icon"
                        className="w-7 h-7 rounded-lg hover:bg-cyan-50 text-cyan-600"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </Button>
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
    </div>
  );
}
