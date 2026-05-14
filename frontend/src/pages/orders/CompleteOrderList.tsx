import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ordersApi } from '../../api/ordersApi';
import { useAuth } from '../../context/AuthContext';

import { Button } from '../../components/ui/Button';
import { SearchBar } from '../../components/ui/SearchBar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { OrderDetailsModal } from '../../components/ui/OrderDetailsModal';
import CompleteOrderModal from './CompleteOrderModal';
import { CheckCircle } from 'lucide-react';

export default function CompleteOrderList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderToView, setOrderToView] = useState<any>(null);
  const [orderToComplete, setOrderToComplete] = useState<any>(null);

  // Fetch Orders (Filtered by In Process status)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orders', 'in-process', currentPage, itemsPerPage, searchQuery],
    queryFn: () => ordersApi.getOrders(currentPage, itemsPerPage, searchQuery, 'In Process'),
  });

  // Derived Values
  const orders = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const safeCurrentPage = data?.page ?? 1;

  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + orders.length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  };

  const OrderSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-32 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-28 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-32 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="relative max-w-[1400px] mx-auto space-y-3">
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">Failed to fetch orders: {(error as Error).message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="py-2.5 px-4 sm:px-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SearchBar
            containerClassName="w-full sm:flex-1 max-w-md"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />

          <Button
            variant="primary"
            onClick={() => navigate(isAdmin ? '/admin/orders/complete/manual' : '/orders/complete/manual')}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            <CheckCircle2 size={18} />
            Complete Order Manually
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider pl-6 whitespace-nowrap">Full Name</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Order #</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Order Date</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">PO No.</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Service</TableHead>
                <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider text-right pr-6 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <OrderSkeleton />
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.orderId} className="group hover:bg-gray-50/50 transition-colors">
                    <TableCell className="pl-6 whitespace-nowrap">
                      <span className="font-bold text-slate-800 text-sm">{order.fullname}</span>
                    </TableCell>
                    <TableCell
                      className="whitespace-nowrap cursor-pointer hover:text-cyan-700 transition-colors"
                      onClick={() => {
                        setSelectedOrderId(order.orderId);
                        setOrderToView(order);
                        setIsViewModalOpen(true);
                      }}
                    >
                      <span className="font-black text-cyan-600 text-sm">{order.orderNo || '--'}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      {formatDate(order.orderDate)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap font-medium">
                      {order.workTitle || '--'}
                    </TableCell>
                    <TableCell className="px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                        {order.serviceName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6 whitespace-nowrap">
                      <Button
                        variant="ghost-green"
                        size="sm"
                        className="h-8 px-3 text-xs font-bold gap-1.5 hover:bg-emerald-50 text-emerald-600"
                        onClick={() => {
                          setOrderToComplete(order);
                          setIsCompleteModalOpen(true);
                        }}
                      >
                        <CheckCircle size={14} />
                        Complete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-gray-500">
                    No orders ready to complete found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination
          totalCount={totalCount}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={indexOfLastItem}
          itemsPerPage={itemsPerPage}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          isLoading={isLoading}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>

      <OrderDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedOrderId(null);
        }}
        orderId={selectedOrderId}
        initialOrderData={orderToView}
      />
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

