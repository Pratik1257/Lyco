import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Download, Plus, Eye,
  CheckCircle2, Clock, Receipt, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import CustomSelect from '../../components/ui/CustomSelect';
import DatePicker from '../../components/ui/DatePicker';
import { invoicesApi, type Invoice } from '../../api/invoicesApi';

export default function InvoiceList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Fetch real invoices from API
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', currentPage, itemsPerPage, searchQuery, statusFilter, startDate, endDate],
    queryFn: () => invoicesApi.getInvoices(currentPage, itemsPerPage, searchQuery, statusFilter, startDate, endDate)
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

  return (
    <div className="relative animate-in fade-in duration-500 space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header & Filter */}
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="flex-1 min-w-[200px] max-w-md xl:max-w-[290px] relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search by Name, Invoice no."
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1 xl:justify-end">
              <div className="w-full sm:w-32">
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
              </div>
              <div className="w-full sm:w-40">
                <DatePicker
                  value={startDate}
                  onChange={(val) => { setStartDate(val); setCurrentPage(1); }}
                  placeholder="From Date"
                />
              </div>
              <div className="w-full sm:w-40">
                <DatePicker
                  value={endDate}
                  onChange={(val) => { setEndDate(val); setCurrentPage(1); }}
                  placeholder="To Date"
                  align="right"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="secondary" onClick={handleExport}
                  className="h-11 flex-1 sm:flex-none px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 shadow-none whitespace-nowrap">
                  <Download size={16} /> Export
                </Button>
                <Button variant="primary" onClick={() => navigate('/invoices/create')}
                  className="h-11 flex-1 sm:flex-none bg-gradient-to-r from-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/20 px-5 rounded-xl text-xs whitespace-nowrap">
                  <Plus size={16} /> Create
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <RefreshCw size={20} className="animate-spin text-cyan-600" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="py-2 px-6 whitespace-nowrap">Full Name</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Invoice #</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Invoice Date</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Customer ID</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Order No.</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Type</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Amount</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Status</TableHead>
                <TableHead className="py-2 px-6 text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.invoiceId} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-6 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {invoice.fullname}
                    </TableCell>
                    <TableCell
                      className="px-4 font-bold text-cyan-600 text-sm whitespace-nowrap transition-colors"
                    >
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
                    </TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                      {invoice.invoiceDate
                        ? new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '--'}
                    </TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs font-bold whitespace-nowrap">
                      {invoice.customerId}
                    </TableCell>
                    <TableCell className="px-4 text-slate-600 text-xs font-semibold whitespace-nowrap">
                      {invoice.orderNos || '--'}
                    </TableCell>
                    <TableCell className="px-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${getTypeStyle(invoice.invoiceType)}`}>
                        {invoice.invoiceType || '--'}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                      {invoice.currency || 'USD'} {invoice.amount}
                    </TableCell>
                    <TableCell className="px-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${getStatusStyle(invoice.status)}`}
                      >
                        {getStatusIcon(invoice.status)}
                        {invoice.status || 'Unpaid'}
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
