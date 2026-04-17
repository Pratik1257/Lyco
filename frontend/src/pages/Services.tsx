import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, X, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi, type Service } from '../api/servicesApi';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';

export default function Services() {
  const queryClient = useQueryClient();

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Fetch Services (Server-side Search & pagination)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['services', currentPage, itemsPerPage, searchQuery],
    queryFn: () => servicesApi.getServices(currentPage, itemsPerPage, searchQuery),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (name: string) => servicesApi.createService(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
      toast.success('Service created successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      toast.error(`Failed to create service: ${msg}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => servicesApi.updateService(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
      toast.success('Service updated successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      toast.error(`Failed to update service: ${msg}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => servicesApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
      toast.success('Service deleted successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
      toast.error(`Failed to delete service: ${msg}`);
    }
  });

  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteMutation.mutate(serviceToDelete.id);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setServiceToDelete(null);
  };

  // Derived Values
  const services = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const safeCurrentPage = data?.page ?? 1;

  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + services.length;

  // Modal Actions
  const openAddModal = () => {
    setEditingServiceId(null);
    setNewServiceName('');
    setNameError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingServiceId(service.id);
    setNewServiceName(service.name);
    setNameError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setNewServiceName('');
    setNameError(null);
    setIsModalOpen(false);
    setEditingServiceId(null);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newServiceName.trim();
    if (!cleanName) return;

    if (editingServiceId) {
      updateMutation.mutate({ id: editingServiceId, name: cleanName });
    } else {
      createMutation.mutate(cleanName);
    }
  };

  const ServiceSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell>
            <div className="h-5 bg-gray-200 rounded-lg w-1/3 shadow-sm"></div>
          </TableCell>
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
    <div className="relative max-w-6xl mx-auto space-y-3">
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
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Button
              variant="primary"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Add Service
            </Button>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <ServiceSkeleton />
              ) : services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id} className="group hover:bg-gray-50/50">
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-cyan-700 transition-colors">
                        {service.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost-cyan"
                          size="icon"
                          onClick={() => openEditModal(service)}
                          title="Edit Service"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost-red"
                          size="icon"
                          onClick={() => handleDeleteService(service)}
                          disabled={service.canDelete === false || deleteMutation.isPending}
                          title={service.canDelete !== false ? "Delete Service" : "Service is associated with orders"}
                          className={service.canDelete === false ? 'text-gray-300 bg-gray-50' : ''}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="py-12 text-center text-sm text-gray-500">
                    No services found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

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

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
              onClick={closeModal}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cyan-600 to-cyan-500">
                <div>
                  <h3 className="text-lg font-bold text-white">{editingServiceId ? 'Edit Service' : 'New Service'}</h3>
                  <p className="text-xs text-cyan-100 mt-0.5">{editingServiceId ? 'Update existing service details' : 'Configure a new customer service'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeModal}
                >
                  <X size={20} />
                </Button>
              </div>

              <form onSubmit={handleSaveService}>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="serviceName" className="block text-xs font-medium text-gray-600 mb-2">
                        Service Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="serviceName"
                        type="text"
                        autoFocus
                        required
                        placeholder="e.g. Executive Consultation"
                        value={newServiceName}
                        onChange={(e) => {
                          setNewServiceName(e.target.value);
                          if (nameError) setNameError(null);
                        }}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal ${
                          nameError 
                            ? 'border-red-300 focus:ring-red-500/10 focus:border-red-500' 
                            : 'border-gray-200 focus:ring-cyan-500/10 focus:border-cyan-500'
                        }`}
                      />
                      {nameError && (
                        <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
                          <AlertCircle size={14} /> {nameError}
                        </p>
                      )}
                      
                      {editingServiceId && newServiceName.trim() !== (services.find(s => s.id === editingServiceId)?.name ?? '') && (
                        <div className="mt-3 flex gap-2 items-start text-[11px] text-gray-500 bg-gray-50/50 p-3 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle size={14} className="text-cyan-600 mt-0.5 shrink-0" />
                          <p className="leading-normal">
                            <span className="font-bold text-gray-700">System Impact:</span> Retitling this service will automatically update all linked orders, invoices, and quotes across the platform.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
                   <Button
                    variant="secondary"
                    type="button"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={
                      !newServiceName.trim() || 
                      createMutation.isPending || 
                      updateMutation.isPending ||
                      (!!editingServiceId && services.find(s => s.id === editingServiceId)?.name === newServiceName.trim())
                    }
                    isLoading={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingServiceId ? 'Update Service' : 'Create Service'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                
                <h3 className="text-xl font-black text-gray-900 mb-3">Delete Service</h3>
                <p className="text-sm text-gray-500 leading-relaxed px-2 font-medium">
                  Are you sure you want to delete <span className="font-bold text-gray-900">"{serviceToDelete?.name}"</span>? This action cannot be undone.
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
