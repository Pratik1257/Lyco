import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Download, Plus, Eye,
  CheckCircle2, Clock, Receipt, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import CustomSelect from '../../components/ui/CustomSelect';
import DatePicker from '../../components/ui/DatePicker';
import { invoicesApi, type Invoice } from '../../api/invoicesApi';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function InvoiceList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';
  const initialCurrency = searchParams.get('currency') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [currencyFilter, setCurrencyFilter] = useState(initialCurrency);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  useEffect(() => {
    const status = searchParams.get('status');
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');
    const timeframe = searchParams.get('timeframe');
    const currency = searchParams.get('currency');

    if (status) setStatusFilter(status);
    if (start) setStartDate(start);
    if (end) setEndDate(end);
    if (timeframe) setTimeframeFilter(timeframe);
    if (currency) setCurrencyFilter(currency);
  }, [searchParams]);
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', currentPage, itemsPerPage, searchQuery, statusFilter, currencyFilter, startDate, endDate, (user as any)?.uniqueNo],
    queryFn: () => invoicesApi.getInvoices(currentPage, itemsPerPage, searchQuery, statusFilter, isAdmin ? undefined : (user as any)?.uniqueNo, startDate, endDate, currencyFilter),
  });

  const invoices = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const getStatusStyle = (status: string) => {
    if (status === 'Completed') return 'bg-green-50 text-green-700 border-green-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Completed') return <CheckCircle2 size={12} />;
    return <Clock size={12} />;
  };

  const getTypeStyle = (type: string) => {
    if (type === 'Individual') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    return 'bg-cyan-50 text-cyan-700 border-cyan-100';
  };

  const handleExport = () => toast.success('Exporting invoices...');

  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const indexOfLast = Math.min(indexOfFirst + itemsPerPage, totalCount);

  const formatPrice = (amount: any, currency: string | null) => {
    if (amount === undefined || amount === null) return '--';
    const symbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : '$';
    return `${symbol}${amount}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  };

  return (
    <div className="relative animate-in fade-in duration-500 space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header & Filter */}
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/30 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 min-w-[200px] max-w-md relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder={isAdmin ? "Search by Name, Invoice no." : "Search by Invoice no."}
                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleExport}
                className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold flex items-center gap-2 shadow-sm whitespace-nowrap hover:bg-slate-50">
                <Download size={16} /> Export
              </Button>
              {isAdmin && (
                <Button variant="primary" onClick={() => navigate(isAdmin ? '/admin/invoices/create' : '/invoices/create')}
                  className="h-11 bg-gradient-to-r from-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/20 px-5 rounded-xl text-xs whitespace-nowrap">
                  <Plus size={16} /> Create
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Row: Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val as string); setCurrentPage(1); }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Pending', label: 'Pending' },
              ]}
              placeholder="Status"
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
              onChange={(val) => { setStartDate(val); setTimeframeFilter(val || endDate ? 'Custom' : ''); setCurrentPage(1); }}
              placeholder="From Date"
            />
            <DatePicker
              value={endDate}
              onChange={(val) => { setEndDate(val); setTimeframeFilter(startDate || val ? 'Custom' : ''); setCurrentPage(1); }}
              placeholder="To Date"
              align="right"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          {isLoading ? (
            <TableSkeleton rows={itemsPerPage} cols={8} />
          ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                {isAdmin && <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider pl-6 whitespace-nowrap">Full Name</TableHead>}
                <TableHead className={`font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap ${!isAdmin ? 'pl-6' : ''}`}>Invoice #</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Invoice Date</TableHead>
                {isAdmin && <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Customer ID</TableHead>}
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Order No.</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">PO</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Type</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Amount</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider text-right pr-6 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.invoiceId} className="group hover:bg-slate-50/50 transition-colors">
                    {isAdmin && (
                      <TableCell className="pl-6 whitespace-nowrap">
                        <span className="font-medium text-slate-800 text-sm">{invoice.fullname}</span>
                      </TableCell>
                    )}
                    <TableCell className={`whitespace-nowrap ${!isAdmin ? 'pl-6' : ''}`}>
                      <span className="font-black text-slate-900 text-sm text-cyan-600 transition-colors">
                        {invoice.pdfUrl ? (
                          <a
                            href={`http://localhost:5193${invoice.pdfUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-cyan-700 hover:underline cursor-pointer"
                            title="View Invoice PDF"
                          >
                            {invoice.invoiceNo}
                          </a>
                        ) : (
                          <span
                            className="text-slate-400 cursor-help"
                            onClick={() => toast.error('PDF not available for this invoice')}
                            title="PDF not available"
                          >
                            {invoice.invoiceNo}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      {formatDate(invoice.invoiceDate)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-xs text-slate-500 font-bold whitespace-nowrap">
                        {invoice.customerId}
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-cyan-600 font-bold whitespace-nowrap">
                      {invoice.orderNos || '--'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-bold whitespace-nowrap">
                      {invoice.po || '--'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getTypeStyle(invoice.invoiceType)}`}>
                        {invoice.invoiceType || '--'}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-black text-slate-900 text-sm">
                        {formatPrice(invoice.amount, invoice.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${getStatusStyle(invoice.status)}`}
                      >
                        {getStatusIcon(invoice.status)}
                        {invoice.status || 'Pending'}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {invoice.pdfUrl && (
                          <Button
                            variant="ghost-cyan"
                            size="icon"
                            className="w-7 h-7 rounded-lg hover:bg-cyan-50 text-cyan-600"
                            title="View / Download PDF"
                            onClick={() => window.open(`http://localhost:5193${invoice.pdfUrl}`, '_blank')}
                          >
                            <Eye size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Receipt size={32} className="text-slate-200" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">No invoices found</h3>
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
        <div className="p-6 bg-slate-50/30 border-t border-slate-50">
          <Pagination
            totalCount={totalCount}
            indexOfFirstItem={indexOfFirst}
            indexOfLastItem={indexOfLast}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          />
        </div>
      </div>
    </div>
  );
}
