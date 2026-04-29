import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, ShoppingBag, Eye, Edit2, Trash2,
  Download, Plus, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { ordersApi } from '../../api/ordersApi';
import { servicesApi } from '../../api/servicesApi';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import CustomSelect from '../../components/ui/CustomSelect';
import DatePicker from '../../components/ui/DatePicker';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { OrderDetailsModal } from '../../components/ui/OrderDetailsModal';
import CompleteOrderModal from './CompleteOrderModal';
import type { Order } from '../../api/ordersApi';

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
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);

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
    const symbol = currency === 'GBP' ? '£' : (currency === 'EUR' || currency === 'EURO') ? '€' : currency === 'AUD' ? 'A$' : currency === 'INR' ? '₹' : '$';
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
    const loadingToast = toast.loading('Preparing professional Excel export...');
    try {
      const allData = await ordersApi.getOrders(1, 1000, searchQuery, statusFilter, serviceFilter, undefined, startDate, endDate);
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
        { header: 'Payment Status', key: 'paymentStatus', width: 18 },
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
          paymentStatus: order.paymentStatus || 'Pending',
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


  return (
    <div className="relative animate-in fade-in duration-500 space-y-4">
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

      {/* Main Table Section */}
      <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="py-2 px-6 whitespace-nowrap">Order #</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Ordered On</TableHead>
                <TableHead className="py-2 px-4 whitespace-nowrap">Full Name</TableHead>
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
                    <TableCell className="px-4 text-slate-900 text-sm font-medium whitespace-nowrap">{order.fullname}</TableCell>
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
                        {order.orderStatus !== 'Completed' && order.orderStatus !== 'Cancelled' && (
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
                        <Button
                          variant="ghost-red"
                          size="icon"
                          className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            order.orderStatus === 'In Process' ? "Cannot delete orders in process" : 
                            order.orderStatus === 'Completed' ? "Cannot delete completed orders" :
                            order.orderStatus === 'Invoiced' ? "Cannot delete invoiced orders" :
                            "Delete Order"
                          }
                          disabled={order.orderStatus === 'In Process' || order.orderStatus === 'Completed' || order.orderStatus === 'Invoiced'}
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
