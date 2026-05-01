import { useState } from 'react';
import {
  Search, Download, Clock, AlertCircle, Eye
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../../api/invoicesApi';
import DatePicker from '../../components/ui/DatePicker';
import CustomSelect from '../../components/ui/CustomSelect';

export default function PendingInvoiceList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [headerCurrency, setHeaderCurrency] = useState('USD');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pendingInvoices', currentPage, itemsPerPage, searchQuery, startDate, endDate],
    queryFn: () => invoicesApi.getInvoices(currentPage, itemsPerPage, searchQuery, 'Pending', startDate, endDate),
    refetchOnWindowFocus: false,
  });

  const invoices = data?.items || [];
  const totalCount = data?.totalCount || 0;
  
  // Calculate total outstanding for the selected currency only
  const totalOutstanding = invoices
    .filter(inv => (inv.currency || 'USD') === headerCurrency)
    .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  const handleExport = async () => {
    const loadingToast = toast.loading('Preparing professional Excel export...');
    try {
      // Fetch all pending invoices matching current filters (bypassing current pagination)
      const allData = await invoicesApi.getInvoices(1, 1000, searchQuery, 'Pending', startDate, endDate);
      const allInvoices = allData?.items || [];

      if (allInvoices.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No invoices to export');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Pending Invoices');

      // 1. Define Columns
      worksheet.columns = [
        { header: 'Invoice #', key: 'invoiceNo', width: 15 },
        { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
        { header: 'Full Name', key: 'fullname', width: 25 },
        { header: 'Company', key: 'companyName', width: 25 },
        { header: 'PO No.', key: 'poNo', width: 30 },
        { header: 'Orders', key: 'orderNos', width: 20 },
        { header: 'Type', key: 'invoiceType', width: 15 },
        { header: 'Amount', key: 'amount', width: 12 },
      ];

      // 2. Style Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 20;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' }
        };
        cell.font = { bold: true, name: 'Calibri', size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // 3. Add Empty Spacer Row
      worksheet.addRow({});
      worksheet.getRow(2).height = 10;

      // 4. Add Data
      allInvoices.forEach(inv => {
        const row = worksheet.addRow({
          invoiceNo: inv.invoiceNo,
          invoiceDate: new Date(inv.invoiceDate).toLocaleDateString(),
          fullname: inv.fullname,
          companyName: inv.companyName,
          poNo: inv.po,
          orderNos: inv.orderNos,
          invoiceType: inv.invoiceType,
          amount: parseFloat(inv.amount) || 0
        });

        row.eachCell((cell, colNumber) => {
          const colKey = worksheet.columns[colNumber - 1].key;
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center'
          };
          cell.font = { name: 'Calibri', size: 11 };

          // Format Price
          if (colKey === 'amount') {
            cell.numFmt = `"$"#,##0.00`;
          }

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
      saveAs(blob, `Pending_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.dismiss(loadingToast);
      toast.success('Exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss(loadingToast);
      toast.error('Export failed');
    }
  };

  return (
    <div className="relative animate-in fade-in duration-500 space-y-4">
      {/* Summary Highlight */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Pending Invoice Summary</h1>
          <p className="text-slate-400 text-xs mt-1">Track and manage outstanding payments.</p>
        </div>
        <div className="flex items-center gap-3 py-3 px-5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl">
           <AlertCircle size={20} className="text-amber-400" />
           <div className="flex flex-col">
             <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Outstanding (Page)</span>
               <select
                 value={headerCurrency}
                 onChange={(e) => setHeaderCurrency(e.target.value)}
                 className="bg-transparent text-[10px] text-cyan-400 font-bold outline-none cursor-pointer border-b border-cyan-400/30 pb-0.5"
               >
                 <option value="USD" className="text-slate-900">USD</option>
                 <option value="GBP" className="text-slate-900">GBP</option>
                 <option value="EURO" className="text-slate-900">EURO</option>
                 <option value="AUD" className="text-slate-900">AUD</option>
               </select>
             </div>
             <span className="text-lg font-black text-white">{headerCurrency} {totalOutstanding.toFixed(2)}</span>
           </div>
        </div>
      </div>

      {/* Main Unified Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header & Filter Section */}
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 max-w-sm relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 lg:justify-end">
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
              <Button
                variant="secondary"
                onClick={handleExport}
                className="h-11 w-full sm:w-auto px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 shadow-none whitespace-nowrap"
              >
                <Download size={16} />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="py-2 px-6 whitespace-nowrap">Invoice #</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Date</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Customer</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Company</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Orders</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Type</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">PO</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Amount</TableHead>
                <TableHead className="py-2 px-6 text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-slate-500 font-medium">
                    Loading pending invoices...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-red-500 font-medium">
                    Error loading invoices: {(error as Error)?.message}
                  </TableCell>
                </TableRow>
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow
                    key={invoice.invoiceId}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="px-6 font-bold text-cyan-600 hover:text-cyan-700 cursor-pointer text-sm whitespace-nowrap transition-colors">
                      {invoice.invoiceNo}
                    </TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 text-slate-900 text-sm font-bold whitespace-nowrap">
                      {invoice.fullname}
                    </TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs whitespace-nowrap">
                      {invoice.companyName}
                    </TableCell>
                    <TableCell className="px-4 text-slate-600 text-xs font-bold whitespace-nowrap">
                      {invoice.orderNos}
                    </TableCell>
                    <TableCell className="px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {invoice.invoiceType}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs whitespace-nowrap">
                      {invoice.po || '--'}
                    </TableCell>
                    <TableCell className="px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                      {invoice.currency || 'USD'} {parseFloat(invoice.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {invoice.pdfUrl && (
                          <a
                            href={`http://localhost:5193${invoice.pdfUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-cyan-50 text-cyan-600 transition-colors"
                            title="View PDF"
                          >
                            <Eye size={14} />
                          </a>
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
                        <Clock size={32} className="text-slate-200" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">No pending invoices</h3>
                      <p className="text-sm text-slate-400 mt-1">All payments are up to date.</p>
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
            totalPages={data?.totalPages || 1}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val: number) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
