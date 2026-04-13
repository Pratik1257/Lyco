import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, X, ChevronDown, ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { servicesApi, type Service } from '../api/servicesApi';

export default function Services() {
  const queryClient = useQueryClient();

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
    },
    onError: (err: Error) => {
      setNameError(err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => servicesApi.updateService(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
    onError: (err: Error) => {
      setNameError(err.message);
    }
  });

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">Failed to connect to backend: {(error as Error).message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium"
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-cyan-200 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            Add Service
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-cyan-600" size={32} />
            </div>
          )}
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Service Name
                </th>
                <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.length > 0 ? (
                services.map((service) => (
                  <tr key={service.id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-cyan-700 transition-colors">
                        {service.name}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(service)}
                          className="p-1.5 text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-12 text-center text-sm text-gray-500">
                    {isLoading ? 'Fetching data...' : 'No services found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info / Box */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{totalCount === 0 ? 0 : indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-700">{Math.min(indexOfLastItem, totalCount)}</span> of <span className="font-semibold text-gray-700">{totalCount}</span> results
            </div>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                className="flex items-center gap-2 pl-3 pr-8 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all cursor-pointer shadow-sm active:bg-gray-50 whitespace-nowrap"
              >
                {itemsPerPage} per page
                <ChevronDown size={14} className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 min-w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1.5 z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {[10, 20, 50].map(value => (
                    <button
                      key={value}
                      onClick={() => {
                        setItemsPerPage(value);
                        setCurrentPage(1);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors hover:bg-cyan-600 hover:text-white whitespace-nowrap cursor-pointer ${
                        itemsPerPage === value 
                          ? 'text-cyan-600 font-bold bg-cyan-50/10' 
                          : 'text-gray-600'
                      }`}
                    >
                      <span>{value} per page</span>
                      {itemsPerPage === value && <Check size={14} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1 || isLoading}
                className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-200 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-500 font-bold px-1">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages || isLoading}
                className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-200 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
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
              <button
                onClick={closeModal}
                className="p-1.5 text-cyan-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveService}>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="serviceName" className="block text-sm font-bold text-gray-700 mb-2">
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
                      <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
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
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !newServiceName.trim() || 
                    createMutation.isPending || 
                    updateMutation.isPending ||
                    (!!editingServiceId && services.find(s => s.id === editingServiceId)?.name === newServiceName.trim())
                  }
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 rounded-xl transition-all shadow-md shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="animate-spin" size={16} />}
                  {editingServiceId ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
