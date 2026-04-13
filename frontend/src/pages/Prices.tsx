import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, X, ChevronDown, ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { pricesApi, type GeneralPrice, type UserwisePrice, MOCK_USERS, MOCK_CURRENCIES } from '../api/pricesApi';
import { servicesApi } from '../api/servicesApi';

type TabType = 'general' | 'userwise';

export default function Prices() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formServiceId, setFormServiceId] = useState<number | ''>('');
  const [formCurrency, setFormCurrency] = useState<string>('USD');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formUsername, setFormUsername] = useState<string>('');

  // Reset pagination when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
    setItemsPerPage(10);
  };

  // Fetch Services for Dropdown
  const { data: servicesData } = useQuery({
    queryKey: ['services', 1, 100, ''],
    queryFn: () => servicesApi.getServices(1, 100, '') // fetch first 100 for dropdown
  });
  const servicesList = servicesData?.items ?? [];

  // Fetch General Prices
  const { data: generalData, isLoading: isGeneralLoading, isError: isGeneralError, error: generalError } = useQuery({
    queryKey: ['generalPrices', currentPage, itemsPerPage, searchQuery],
    queryFn: () => pricesApi.getGeneralPrices(currentPage, itemsPerPage, searchQuery),
    enabled: activeTab === 'general'
  });

  // Fetch Userwise Prices
  const { data: userwiseData, isLoading: isUserwiseLoading, isError: isUserwiseError, error: userwiseError } = useQuery({
    queryKey: ['userwisePrices', currentPage, itemsPerPage, searchQuery],
    queryFn: () => pricesApi.getUserwisePrices(currentPage, itemsPerPage, searchQuery),
    enabled: activeTab === 'userwise'
  });

  // Mutations
  const createGeneralMutation = useMutation({
    mutationFn: (data: { serviceId: number, serviceName: string, currency: string, price: number }) => 
      pricesApi.createGeneralPrice(data.serviceId, data.serviceName, data.currency, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generalPrices'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message)
  });

  const updateGeneralMutation = useMutation({
    mutationFn: (data: { id: number, serviceId: number, serviceName: string, currency: string, price: number }) => 
      pricesApi.updateGeneralPrice(data.id, data.serviceId, data.serviceName, data.currency, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generalPrices'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message)
  });

  const createUserwiseMutation = useMutation({
    mutationFn: (data: { username: string, serviceId: number, serviceName: string, currency: string, price: number }) => 
      pricesApi.createUserwisePrice(data.username, data.serviceId, data.serviceName, data.currency, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userwisePrices'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message)
  });

  const updateUserwiseMutation = useMutation({
    mutationFn: (data: { id: number, username: string, serviceId: number, serviceName: string, currency: string, price: number }) => 
      pricesApi.updateUserwisePrice(data.id, data.username, data.serviceId, data.serviceName, data.currency, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userwisePrices'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message)
  });

  // Derived Values
  const activeData = activeTab === 'general' ? generalData : userwiseData;
  const isLoading = activeTab === 'general' ? isGeneralLoading : isUserwiseLoading;
  const isError = activeTab === 'general' ? isGeneralError : isUserwiseError;
  const error = activeTab === 'general' ? generalError : userwiseError;

  const items = activeData?.items ?? [];
  const totalCount = activeData?.totalCount ?? 0;
  const totalPages = activeData?.totalPages ?? 1;
  const safeCurrentPage = activeData?.page ?? 1;

  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + items.length;

  // Modal Actions
  const openAddModal = () => {
    setEditingId(null);
    setFormServiceId('');
    setFormCurrency('USD');
    setFormPrice('');
    setFormUsername(MOCK_USERS[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditGeneralModal = (price: GeneralPrice) => {
    setEditingId(price.id);
    setFormServiceId(price.serviceId);
    setFormCurrency(price.currency);
    setFormPrice(price.price);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditUserwiseModal = (price: UserwisePrice) => {
    setEditingId(price.id);
    setFormUsername(price.username);
    setFormServiceId(price.serviceId);
    setFormCurrency(price.currency);
    setFormPrice(price.price);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (formServiceId === '' || formPrice === '') return;
    
    const serviceName = servicesList.find(s => s.id === Number(formServiceId))?.name || 'Unknown Service';

    if (activeTab === 'general') {
      if (editingId) {
        updateGeneralMutation.mutate({ id: editingId, serviceId: Number(formServiceId), serviceName, currency: formCurrency, price: Number(formPrice) });
      } else {
        createGeneralMutation.mutate({ serviceId: Number(formServiceId), serviceName, currency: formCurrency, price: Number(formPrice) });
      }
    } else {
      if (!formUsername) return;
      if (editingId) {
        updateUserwiseMutation.mutate({ id: editingId, username: formUsername, serviceId: Number(formServiceId), serviceName, currency: formCurrency, price: Number(formPrice) });
      } else {
        createUserwiseMutation.mutate({ username: formUsername, serviceId: Number(formServiceId), serviceName, currency: formCurrency, price: Number(formPrice) });
      }
    }
  };

  const isPending = createGeneralMutation.isPending || updateGeneralMutation.isPending || createUserwiseMutation.isPending || updateUserwiseMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">Failed to fetch data: {(error as Error)?.message}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-gray-100/80 rounded-2xl max-w-sm">
        <button
          onClick={() => handleTabChange('general')}
          className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl transition-all duration-200 ${
            activeTab === 'general' 
              ? 'bg-white text-cyan-700 shadow-sm ring-1 ring-gray-900/5' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          General Price
        </button>
        <button
          onClick={() => handleTabChange('userwise')}
          className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl transition-all duration-200 ${
            activeTab === 'userwise' 
              ? 'bg-white text-cyan-700 shadow-sm ring-1 ring-gray-900/5' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Userwise Price
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'general' ? 'general prices' : 'userwise prices'}...`}
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
            Add {activeTab === 'general' ? 'General Price' : 'Userwise Price'}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative min-h-[200px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-cyan-600" size={32} />
            </div>
          )}
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                {activeTab === 'userwise' && (
                  <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Username</th>
                )}
                <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Service</th>
                <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Currency</th>
                <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Price</th>
                <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length > 0 ? (
                items.map((item: any) => (
                  <tr key={item.id} className="group hover:bg-gray-50/50 transition-all">
                    {activeTab === 'userwise' && (
                      <td className="py-4 px-6 text-sm font-medium text-gray-700">{item.username}</td>
                    )}
                    <td className="py-4 px-6 text-sm font-semibold text-gray-700">{item.serviceName}</td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-600">{item.currency}</td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-800">{item.price.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => activeTab === 'general' ? openEditGeneralModal(item) : openEditUserwiseModal(item)}
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
                  <td colSpan={activeTab === 'userwise' ? 5 : 4} className="py-12 text-center text-sm text-gray-500">
                    {isLoading ? 'Fetching data...' : 'No prices found.'}
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
                <h3 className="text-lg font-bold text-white">
                  {editingId ? `Edit ${activeTab === 'general' ? 'General' : 'Userwise'} Price` : `New ${activeTab === 'general' ? 'General' : 'Userwise'} Price`}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-cyan-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePrice}>
              <div className="p-6">
                <div className="space-y-4">
                  {activeTab === 'userwise' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-gray-800"
                      >
                        <option value="" disabled>Choose Username</option>
                        {MOCK_USERS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Service <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formServiceId}
                      onChange={(e) => setFormServiceId(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-gray-800"
                    >
                      <option value="" disabled>Choose Service</option>
                      {servicesList.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-gray-800"
                    >
                      <option value="" disabled>Choose Currency</option>
                      {MOCK_CURRENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="Enter price"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium text-gray-800"
                    />
                  </div>
                  
                  {formError && (
                    <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                      <AlertCircle size={14} /> {formError}
                    </p>
                  )}
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
                  disabled={isPending || formServiceId === '' || formPrice === '' || (activeTab === 'userwise' && !formUsername)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 rounded-xl transition-all shadow-md shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isPending && <Loader2 className="animate-spin" size={16} />}
                  {editingId ? 'Update Price' : 'Create Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
