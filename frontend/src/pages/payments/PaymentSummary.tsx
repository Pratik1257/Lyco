import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, Download, CheckCircle2, Clock, XCircle, AlertCircle, ShoppingBag, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { paymentsApi } from '../../api/paymentsApi';
import { servicesApi } from '../../api/servicesApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import CustomSelect from '../../components/ui/CustomSelect';
import DatePicker from '../../components/ui/DatePicker';
import { TableSkeleton } from '../../components/ui/Skeleton';

export default function PaymentSummary() {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  const customerUniqueNo = isAdmin ? undefined : (user?.uniqueNo || (user as any)?.UniqueNo);

  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch Services for dropdown
  const { data: servicesData } = useQuery({
    queryKey: ['services-dropdown'],
    queryFn: async () => {
      const response = await servicesApi.getServices(1, 1000);
      // Handle both camelCase and PascalCase from backend
      return (response as any).items || (response as any).Items || [];
    }
  });

  // Fetch Payment History data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['payment-summary', currentPage, itemsPerPage, searchQuery, serviceFilter, statusFilter, startDate, endDate, customerUniqueNo],
    queryFn: () => paymentsApi.getSummary(
      currentPage, 
      itemsPerPage, 
      searchQuery, 
      serviceFilter === 'all' ? undefined : Number(serviceFilter), 
      statusFilter, 
      startDate || undefined, 
      endDate || undefined,
      customerUniqueNo ? Number(customerUniqueNo) : undefined
    ),
    enabled: isAdmin || !!customerUniqueNo
  });

  const items = (data as any)?.items || (data as any)?.Items || [];
  const totalCount = (data as any)?.totalCount || (data as any)?.TotalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getPaymentStatusStyle = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'paid') return 'bg-green-50 text-green-700 border-green-100';
    if (s.includes('bad')) return 'bg-red-50 text-red-700 border-red-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  const getOrderStatusStyle = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return 'bg-green-50 text-green-700 border-green-100';
    if (s.includes('process')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (s.includes('cancel')) return 'bg-red-50 text-red-700 border-red-100';
    if (s.includes('pending')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (s.includes('invoice')) return 'bg-purple-50 text-purple-700 border-purple-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const getOrderStatusIcon = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete')) return <CheckCircle2 size={12} />;
    if (s.includes('process')) return <Clock size={12} />;
    if (s.includes('cancel')) return <AlertCircle size={12} />;
    if (s.includes('invoice')) return <Receipt size={12} />;
    return <Clock size={12} />;
  };

  const getPaymentStatusIcon = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'paid') return <CheckCircle2 size={12} />;
    if (s === 'bad debt') return <XCircle size={12} />;
    return <Clock size={12} />;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  };

  const formatPrice = (amount: any, currency: string | null) => {
    if (amount === undefined || amount === null) return '--';
    const symbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AUD' ? 'A$' : '$';
    return `${symbol}${amount}`;
  };

  const handleExport = async () => {
    const loadingToast = toast.loading('Preparing professional Excel export...');
    try {
      const allData = await paymentsApi.getSummary(
        1, 
        10000, 
        searchQuery, 
        serviceFilter === 'all' ? undefined : Number(serviceFilter), 
        statusFilter, 
        startDate || undefined, 
        endDate || undefined
      );
      const exportItems = (allData as any).items || (allData as any).Items || [];

      if (exportItems.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No records to export');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payment History');

      worksheet.columns = [
        { header: 'Full Name', key: 'fullname', width: 25 },
        { header: 'Company Name', key: 'companyName', width: 25 },
        { header: 'Order #', key: 'orderNo', width: 15 },
        { header: 'Order Date', key: 'orderDate', width: 15 },
        { header: 'PO No.', key: 'poNo', width: 25 },
        { header: 'Service', key: 'serviceName', width: 20 },
        { header: 'Rate', key: 'rate', width: 15 },
        { header: 'Invoice #', key: 'invoiceNo', width: 15 },
        { header: 'Order Status', key: 'orderStatus', width: 15 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 20;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        cell.font = { bold: true, name: 'Calibri', size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      exportItems.forEach((item: any) => {
        const row = worksheet.addRow({
          fullname: item.fullname || item.Fullname,
          companyName: item.companyName || item.CompanyName,
          orderNo: item.orderNo || item.OrderNo,
          orderDate: formatDate(item.orderDate || item.OrderDate),
          poNo: item.workTitle || item.WorkTitle || '--',
          serviceName: item.serviceName || item.ServiceName,
          rate: `${(item.currency || item.Currency) === 'GBP' ? '£' : '$'}${item.amount || item.Amount}`,
          invoiceNo: item.invoiceNo || item.InvoiceNo || '--',
          orderStatus: item.orderStatus || item.OrderStatus,
          paymentStatus: item.paymentStatus || item.PaymentStatus || 'Pending'
        });

        row.eachCell((cell) => {
          cell.font = { name: 'Calibri', size: 11 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEDEDED' } },
            left: { style: 'thin', color: { argb: 'FFEDEDED' } },
            bottom: { style: 'thin', color: { argb: 'FFEDEDED' } },
            right: { style: 'thin', color: { argb: 'FFEDEDED' } }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Payment_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.dismiss(loadingToast);
      toast.success(`Exported ${exportItems.length} records successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="relative animate-in fade-in duration-500 space-y-4">
      {/* Header Section (Empty as per user edit) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {/* Header & Filter Section */}
        <div className="p-4 sm:px-6 space-y-4 border-b border-slate-100 bg-slate-50/30 rounded-t-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search Username, Order #, Customer..."
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleExport}
                className="h-11 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-2 shadow-none hover:bg-white transition-all"
              >
                <Download size={16} />
                Export
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-48">
              <CustomSelect
                value={serviceFilter}
                onChange={(val) => { setServiceFilter(val as string); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'All Services' },
                  ...(Array.isArray(servicesData) 
                    ? servicesData.map((s: any) => ({ value: s.id?.toString() || s.Id?.toString(), label: s.name || s.Name })) 
                    : [])
                ]}
                placeholder="Service"
              />
            </div>

            <div className="w-full sm:w-40">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val as string); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Bad Debt', label: 'Bad Debt' },
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
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto relative">
          {isLoading ? (
            <TableSkeleton rows={itemsPerPage} cols={9} />
          ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-transparent hover:bg-transparent">
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider pl-6 whitespace-nowrap">Full Name</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Order #</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Order Date</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">PO No.</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Service</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Rate</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Invoice #</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider text-center whitespace-nowrap">Order Status</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider text-center pr-6 whitespace-nowrap">Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-rose-500">
                      <AlertCircle size={32} />
                      <p className="text-sm font-bold">Failed to load data</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ShoppingBag size={32} strokeWidth={1.5} />
                      <p className="text-sm font-medium">No records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(items) ? items : []).map((order: any) => (
                  <TableRow key={order.orderId || order.OrderId} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 whitespace-nowrap">
                      <span className="font-medium text-slate-800 text-sm leading-tight">{order.fullname || order.Fullname}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-black text-cyan-600 text-sm">{order.orderNo || order.OrderNo}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-slate-500 text-xs font-medium">{formatDate(order.orderDate || order.OrderDate)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-slate-500 text-xs font-bold">{order.workTitle || order.WorkTitle || '--'}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                        {order.serviceName || order.ServiceName}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-black text-slate-900 text-sm">
                        {formatPrice(order.amount || order.Amount, order.currency || order.Currency)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {order.invoiceNo || order.InvoiceNo ? (
                        <span className="text-slate-900 font-bold text-sm">{order.invoiceNo || order.InvoiceNo}</span>
                      ) : (
                        <span className="text-slate-300 font-medium text-xs">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all ${getOrderStatusStyle(order.orderStatus || order.OrderStatus)}`}>
                        {getOrderStatusIcon(order.orderStatus || order.OrderStatus)}
                        {order.orderStatus || order.OrderStatus}
                      </div>
                    </TableCell>
                    <TableCell className="text-center pr-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPaymentStatusStyle(order.paymentStatus || order.PaymentStatus)}`}>
                        {getPaymentStatusIcon(order.paymentStatus || order.PaymentStatus)}
                        {order.paymentStatus || order.PaymentStatus || 'Pending'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          )}
        </div>

        {/* Pagination Section */}
        {totalCount > 0 && (
          <Pagination
            totalCount={totalCount}
            indexOfFirstItem={(currentPage - 1) * itemsPerPage}
            indexOfLastItem={Math.min(currentPage * itemsPerPage, totalCount)}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          />
        )}
      </div>
    </div>
  );
}
