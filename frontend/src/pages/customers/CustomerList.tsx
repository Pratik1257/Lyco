import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, AlertCircle, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi, type Customer } from '../../api/customersApi';


import { Button } from '../../components/ui/Button';
import { SearchBar } from '../../components/ui/SearchBar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export default function CustomerList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // UI State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Fetch Customers (Server-side Search & pagination)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['customers', currentPage, itemsPerPage, searchQuery],
    queryFn: () => customersApi.getCustomers(currentPage, itemsPerPage, searchQuery),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      closeDeleteModal();
      toast.success('Customer deleted successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      closeDeleteModal();
      toast.error(`Failed to delete customer: ${msg}`);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => customersApi.toggleActive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Customer ${data.isActive === 'Y' ? 'activated' : 'deactivated'} successfully.`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      toast.error(`Failed to toggle status: ${msg}`);
    }
  });

  // Handlers
  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.userId);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  const handleAddCustomer = () => {
    navigate('/customers/add-two');
  };

  const handleEditCustomer = (customer: Customer) => {
    navigate(`/customers/add-two?id=${customer.userId}`);
  };

  // Derived Values
  const customers = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const safeCurrentPage = data?.page ?? 1;

  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + customers.length;

  const CustomerSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          {/* <TableCell><div className="h-5 bg-gray-200 rounded-lg w-12 shadow-sm"></div></TableCell> */}
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-20 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-32 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-32 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-16 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-16 shadow-sm"></div></TableCell>
          {/* <TableCell><div className="h-5 bg-gray-200 rounded-lg w-12 shadow-sm"></div></TableCell> */}
          <TableCell className="text-right">
            <div className="flex justify-end">
              {/* <div className="h-8 w-8 bg-gray-200 rounded-lg shadow-sm"></div> */}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="relative max-w-[1400px] mx-auto space-y-3">
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">Failed to connect to backend: {(error as Error).message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        {/* Toolbar */}
        <div className="py-2.5 px-4 sm:px-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <SearchBar
              containerClassName="w-full max-w-md"
              placeholder="Search by name or company..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <p className="text-[11px] text-slate-400 font-medium italic hidden lg:block">
              Tip: Click on a customer's status to activate/deactivate them.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleAddCustomer}
          >
            <Plus size={18} />
            Add Customer
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead className="whitespace-nowrap">Client Id</TableHead> */}
                <TableHead className="whitespace-nowrap">Full Name</TableHead>
                <TableHead className="whitespace-nowrap">Company Name</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Telephone</TableHead>
                <TableHead className="whitespace-nowrap">City</TableHead>
                <TableHead className="whitespace-nowrap">State</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <CustomerSkeleton />
              ) : customers.length > 0 ? (
                customers.map((customer) => (
                  <TableRow key={customer.userId} className="group hover:bg-gray-50/50">
                    {/* <TableCell className="text-sm font-bold text-gray-700 whitespace-nowrap">{customer.userId}</TableCell> */}
                    <TableCell className="text-sm font-medium text-gray-800 whitespace-nowrap">{customer.fullname || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{customer.companyname || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">{customer.primaryEmail || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">{customer.telephone || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{customer.city || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{customer.state || '--'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="relative group/status inline-block">
                        <button
                          onClick={() => toggleMutation.mutate(customer.userId)}
                          disabled={toggleMutation.isPending && toggleMutation.variables === customer.userId}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all active:scale-95 disabled:opacity-50 ${
                            customer.isActive === 'Y'
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          }`}
                        >
                          {toggleMutation.isPending && toggleMutation.variables === customer.userId ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : customer.isActive === 'Y' ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}
                          <span className="text-[11px] font-black uppercase tracking-wider">
                            {customer.isActive === 'Y' ? 'Active' : 'Inactive'}
                          </span>
                        </button>

                        {/* Fancy Status Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-900 text-white text-[10px] text-center font-bold rounded-lg shadow-xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all duration-200 translate-y-1 group-hover/status:translate-y-0 z-50 pointer-events-none">
                          Click to {customer.isActive === 'Y' ? 'Deactivate' : 'Activate'}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost-cyan"
                          size="icon"
                          onClick={() => handleEditCustomer(customer)}
                          title="Edit Customer"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost-red"
                          size="icon"
                          onClick={() => handleDeleteClick(customer)}
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-gray-500">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer info / Box */}
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
          className="rounded-b-2xl"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Customer"
        message={
          <>
            Are you sure you want to delete <span className="font-bold text-gray-900">"{customerToDelete ? customerToDelete.fullname : ''}"</span>? This action cannot be undone.
          </>
        }
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
