import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi, type Customer } from '../api/customersApi';

import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';

export default function CustomerPage() {
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

  const getStatusBadge = (isActive: string) => {
    const active = isActive === 'Y';
    return (
        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
  };

  const CustomerSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-12 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-20 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-32 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-32 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-16 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-16 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-12 shadow-sm"></div></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end">
              <div className="h-8 w-8 bg-gray-200 rounded-lg shadow-sm"></div>
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="py-2.5 px-6 border-b border-gray-100 flex items-center justify-between gap-4">
            <SearchBar
              containerClassName="flex-1 max-w-md"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
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
                    <TableHead className="whitespace-nowrap">Client Id</TableHead>
                    <TableHead className="whitespace-nowrap">Username</TableHead>
                    <TableHead className="whitespace-nowrap">Company Name</TableHead>
                    <TableHead className="whitespace-nowrap">Full Name</TableHead>
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
                        <TableCell className="text-sm font-bold text-gray-700 whitespace-nowrap">{customer.userId}</TableCell>
                        <TableCell className="text-sm font-semibold text-gray-800 whitespace-nowrap">{customer.username}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{customer.companyname || '--'}</TableCell>
                        <TableCell className="text-sm font-medium text-gray-800 whitespace-nowrap">{`${customer.firstname || ''} ${customer.lastname || ''}`.trim() || '--'}</TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">{customer.primaryEmail || '--'}</TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">{customer.telephone || '--'}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{customer.city || '--'}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{customer.state || '--'}</TableCell>
                        <TableCell className="whitespace-nowrap">{getStatusBadge(customer.isActive)}</TableCell>
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
                    <TableCell colSpan={10} className="py-12 text-center text-sm text-gray-500">
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
          />
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={closeDeleteModal}
            />

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
                  <Trash2 size={32} />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-3">Delete Customer</h3>
                <p className="text-sm text-gray-500 leading-relaxed px-2 font-medium">
                  Are you sure you want to delete <span className="font-bold text-gray-900">"{customerToDelete?.username}"</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 p-6 pt-0">
                <Button
                  variant="secondary"
                  className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-2xl py-3 border-0 shadow-none"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 py-3 border-0"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  isLoading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
