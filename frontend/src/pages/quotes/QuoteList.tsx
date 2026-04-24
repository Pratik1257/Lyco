import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Eye, Trash2, Download, Plus, FileText, Pencil,
  Calendar, Clock, AlertCircle, Quote as QuoteIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';

import { quotesApi } from '../../api/quotesApi';
import { servicesApi } from '../../api/servicesApi';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import CustomSelect from '../../components/ui/CustomSelect';
import DatePicker from '../../components/ui/DatePicker';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { QuoteDetailsModal } from '../../components/ui/QuoteDetailsModal';

export default function QuoteList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedQuoteForDetails, setSelectedQuoteForDetails] = useState<any>(null);

  // Queries
  const { data: servicesData } = useQuery({
    queryKey: ['services-dropdown'],
    queryFn: () => servicesApi.getServices(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', currentPage, itemsPerPage, searchQuery, serviceFilter, startDate, endDate],
    queryFn: () => quotesApi.getQuotes(currentPage, itemsPerPage, searchQuery, serviceFilter, startDate, endDate),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => quotesApi.deleteQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote deleted successfully');
      setIsDeleteModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete quote');
    }
  });

  // Derived
  const quotes = data?.items ?? [];
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

  return (
    <div className="relative animate-in fade-in duration-500 space-y-4">
      {/* Main Unified Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header & Filter Section */}
        <div className="p-4 sm:px-6 space-y-4 border-b border-slate-100 bg-slate-50/30">
          {/* Top Row: Search & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search Quote #, User, Email, PO..."
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={() => navigate('/quotes/new')}
                className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-slate-200"
              >
                <Plus size={18} />
                Add New Quote
              </Button>
            </div>
          </div>

          {/* Bottom Row: Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            <CustomSelect
              value={serviceFilter || ''}
              onChange={(val) => { setServiceFilter(val ? Number(val) : undefined); setCurrentPage(1); }}
              options={[
                { value: '', label: 'All Services' },
                ...(servicesData?.items || []).map(s => ({ value: s.id, label: s.name }))
              ]}
              placeholder="Service"
            />
            
            <div className="hidden lg:block"></div> {/* Spacer to push dates to right */}
            
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

        {/* Main Table Section */}
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="py-2 px-6 whitespace-nowrap">Username</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Quote #</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Quote Date</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Email</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">PO No.</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Service</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Rate</TableHead>
                <TableHead className="py-2 px-6 text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j} className="py-2.5 px-6">
                        <div className="h-3 bg-slate-100 rounded-md w-full"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : quotes.length > 0 ? (
                quotes.map((quote) => (
                  <TableRow
                    key={quote.quoteId}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="px-6 text-slate-900 text-sm font-medium whitespace-nowrap">{quote.username}</TableCell>
                    <TableCell className="px-4 font-bold text-cyan-600 text-sm whitespace-nowrap">
                      {quote.quoteNo || '--'}
                    </TableCell>
                    <TableCell className="px-4 text-slate-600 text-sm font-medium whitespace-nowrap">{formatDate(quote.quoteDate)}</TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs whitespace-nowrap">{quote.email || '--'}</TableCell>
                    <TableCell className="px-4 text-slate-600 text-xs font-medium whitespace-nowrap">{quote.workTitle || '--'}</TableCell>
                    <TableCell className="px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                        {quote.serviceName}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                      {formatPrice(quote.amount, quote.currency)}
                    </TableCell>
                    <TableCell className="px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost-cyan"
                          size="icon"
                          onClick={() => {
                            setSelectedQuoteForDetails(quote);
                            setIsDetailsModalOpen(true);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-cyan-50 text-cyan-600"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost-cyan"
                          size="icon"
                          onClick={() => navigate(`/quotes/edit/${quote.quoteId}`)}
                          className="w-7 h-7 rounded-lg hover:bg-cyan-50 text-cyan-600"
                          title="Edit Quote"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost-red"
                          size="icon"
                          className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600"
                          title="Delete Quote"
                          onClick={() => {
                            setQuoteToDelete(quote);
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
                  <TableCell colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <FileText size={32} className="text-slate-200" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">No quotes found</h3>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Quote"
        message={
          <>
            Are you sure you want to delete quote <span className="font-bold text-slate-900">#{quoteToDelete?.quoteNo}</span>? This action cannot be undone.
          </>
        }
        onConfirm={() => deleteMutation.mutate(quoteToDelete.quoteId)}
        onCancel={() => setIsDeleteModalOpen(false)}
        isPending={deleteMutation.isPending}
      />
      {/* Details Modal */}
      <QuoteDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedQuoteForDetails(null);
        }}
        quoteId={selectedQuoteForDetails?.quoteId}
        initialQuoteData={selectedQuoteForDetails}
      />
    </div>
  );
}
