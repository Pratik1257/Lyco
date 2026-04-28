import { useState } from 'react';
import {
  Search, Download, Eye, Clock, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';

export default function PendingInvoiceList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mock Data
  const invoices = [
    { 
      id: 2, 
      orderNo: 'ORD-1022',
      orderedOn: '2024-04-20',
      username: 'j.smith',
      email: 'jane.smith@example.com',
      poNo: 'PO-8821',
      service: 'Logo Digitizing',
      price: '45.00', 
      currency: 'USD',
      completedDate: '2024-04-26',
      status: 'Pending' 
    },
    { 
      id: 3, 
      orderNo: 'ORD-5521',
      orderedOn: '2024-04-21',
      username: 'admin.lyco',
      email: 'admin@lyco.com',
      poNo: 'LYCO_Logo_Update',
      service: 'Vector Conversion',
      price: '300.00', 
      currency: 'USD',
      completedDate: '2024-04-27',
      status: 'Overdue' 
    },
    { 
      id: 4, 
      orderNo: 'ORD-9932',
      orderedOn: '2024-04-22',
      username: 'global.tech',
      email: 'billing@globaltech.com',
      poNo: 'GLOBAL_Q2_ASSETS',
      service: 'Custom Embroidery',
      price: '120.00', 
      currency: 'USD',
      completedDate: '2024-04-28',
      status: 'Pending' 
    },
  ];


  const handleExport = () => {
    toast.success('Exporting pending invoices...');
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
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Outstanding</span>
             <span className="text-lg font-black text-white">USD 465.00</span>
           </div>
        </div>
      </div>

      {/* Main Unified Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header & Filter Section */}
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search Order #, Username, Email, PO..."
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            </div>
          </div>
        </div>

        {/* Table Section */}
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
                <TableHead className="py-2 px-4 whitespace-nowrap">Completed Date</TableHead>
                <TableHead className="py-2 px-6 text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="px-6 font-bold text-cyan-600 hover:text-cyan-700 cursor-pointer text-sm whitespace-nowrap transition-colors">
                      {invoice.orderNo}
                    </TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs font-medium whitespace-nowrap">{invoice.orderedOn}</TableCell>
                    <TableCell className="px-4 text-slate-900 text-sm font-bold whitespace-nowrap">{invoice.username}</TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs whitespace-nowrap">{invoice.email}</TableCell>
                    <TableCell className="px-4 text-slate-600 text-xs font-bold whitespace-nowrap">{invoice.poNo}</TableCell>
                    <TableCell className="px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {invoice.service}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                      {invoice.currency} {invoice.price}
                    </TableCell>
                    <TableCell className="px-4 text-slate-500 text-xs font-medium whitespace-nowrap">{invoice.completedDate}</TableCell>
                    <TableCell className="px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost-cyan"
                          size="icon"
                          className="w-7 h-7 rounded-lg hover:bg-cyan-50 text-cyan-600"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Button>
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
            totalCount={invoices.length}
            indexOfFirstItem={0}
            indexOfLastItem={invoices.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={1}
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
