import { useState, useMemo, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, X, ChevronDown, ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { pricesApi, usersApi, type GeneralPrice, type UserwisePrice } from '../api/pricesApi';
import { servicesApi } from '../api/servicesApi';
import CustomSelect from '../components/ui/CustomSelect';

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
  const [formUserId, setFormUserId] = useState<number | ''>('');

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

  // Fetch Users for Dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers()
  });
  const usersList = usersData ?? [];

  // Fetch Currencies for Dropdown
  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => pricesApi.getCurrencies()
  });
  const currenciesList = currenciesData ?? [];

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
    mutationFn: (data: { serviceId: number, currency: string, price: number }) => 
      pricesApi.createGeneralPrice(data.serviceId, data.currency, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generalPrices'] });
      closeModal();
    },
    onError: (err: any) => setFormError(err.response?.data?.error || err.message)
  });

  const updateGeneralMutation = useMutation({
    mutationFn: (data: { id: number, serviceId: number, currency: string, price: number }) => 
      pricesApi.updateGeneralPrice(data.id, data.serviceId, data.currency, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generalPrices'] });
      closeModal();
    },
    onError: (err: any) => setFormError(err.response?.data?.error || err.message)
  });

  const createUserwiseMutation = useMutation({
    mutationFn: (data: { userId: number, serviceId: number, currency: string, price: number }) => 
      pricesApi.createUserwisePrice(data.userId, data.serviceId, data.currency, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userwisePrices'] });
      closeModal();
    },
    onError: (err: any) => setFormError(err.response?.data?.error || err.message)
  });

  const updateUserwiseMutation = useMutation({
    mutationFn: (data: { id: number, userId: number, serviceId: number, currency: string, price: number }) => 
      pricesApi.updateUserwisePrice(data.id, data.userId, data.serviceId, data.currency, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userwisePrices'] });
      closeModal();
    },
    onError: (err: any) => setFormError(err.response?.data?.error || err.message)
  });

  // Expansion State
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) newExpanded.delete(key);
    else newExpanded.add(key);
    setExpandedRows(newExpanded);
  };

  // Derived Values - Grouping Logic
  const activeData = activeTab === 'general' ? generalData : userwiseData;
  const isLoading = activeTab === 'general' ? isGeneralLoading : isUserwiseLoading;
  const isError = activeTab === 'general' ? isGeneralError : isUserwiseError;
  const error = activeTab === 'general' ? generalError : userwiseError;

  const items = activeData?.items ?? [];
  const totalCount = activeData?.totalCount ?? 0;
  const totalPages = activeData?.totalPages ?? 1;
  const safeCurrentPage = activeData?.page ?? 1;

  const groupedItems = useMemo(() => {
    const groups: any[] = [];
    items.forEach((item: any) => {
      const key = activeTab === 'general' ? `s-${item.serviceId}` : `u-${item.userId}-s-${item.serviceId}`;
      let group = groups.find(g => g.key === key);
      if (!group) {
        group = {
          key,
          serviceName: item.serviceName,
          username: item.username, // Only for userwise
          prices: []
        };
        groups.push(group);
      }
      group.prices.push(item);
    });
    return groups;
  }, [items, activeTab]);

  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + groupedItems.length;

  // Helpers
  const getCurrencySymbol = (code: string) => {
    return currenciesList.find(c => c.code === code)?.symbol || '?';
  };

  // Modal Actions
  const openAddModal = () => {
    setEditingId(null);
    setFormServiceId('');
    setFormCurrency('USD');
    setFormPrice('');
    setFormUserId('');
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
    setFormUserId(price.userId);
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

    if (activeTab === 'general') {
      if (editingId) {
        updateGeneralMutation.mutate({ id: editingId, serviceId: Number(formServiceId), currency: formCurrency, price: Number(formPrice) });
      } else {
        createGeneralMutation.mutate({ serviceId: Number(formServiceId), currency: formCurrency, price: Number(formPrice) });
      }
    } else {
      if (formUserId === '') return;

      if (editingId) {
        updateUserwiseMutation.mutate({ id: editingId, userId: Number(formUserId), serviceId: Number(formServiceId), currency: formCurrency, price: Number(formPrice) });
      } else {
        createUserwiseMutation.mutate({ userId: Number(formUserId), serviceId: Number(formServiceId), currency: formCurrency, price: Number(formPrice) });
      }
    }
  };

  const isPending = createGeneralMutation.isPending || updateGeneralMutation.isPending || createUserwiseMutation.isPending || updateUserwiseMutation.isPending;

  return (
    <div className="relative max-w-6xl mx-auto space-y-2">
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
                  <th className="w-10 py-3.5 pl-6"></th>
                  {activeTab === 'userwise' && (
                    <th className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Username</th>
                  )}
                  <th className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Service</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Currencies</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {groupedItems.length > 0 ? (
                  groupedItems.map((group) => {
                    const isExpanded = expandedRows.has(group.key);
                    const currencyCodes = group.prices.map((p: any) => p.currency);
                    
                    return (
                      <Fragment key={group.key}>
                        {/* Parent Row */}
                        <tr 
                          onClick={() => toggleRow(group.key)}
                          className={`group cursor-pointer transition-all ${isExpanded ? 'bg-cyan-50/30' : 'hover:bg-gray-50/50'}`}
                        >
                          <td className="py-4 pl-6">
                            <ChevronDown 
                              size={18} 
                              className={`text-gray-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} 
                            />
                          </td>
                          {activeTab === 'userwise' && (
                            <td className="py-4 px-4 text-sm font-medium text-gray-700">{group.username}</td>
                          )}
                          <td className="py-4 px-4 text-sm font-bold text-gray-800">
                            {group.serviceName}
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-gray-400">
                            {currencyCodes.join(', ')}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-cyan-100 text-cyan-700 text-[11px] font-black tracking-tighter">
                              {group.prices.length}
                            </span>
                          </td>
                        </tr>

                        {/* Child Rows (Sub-table) */}
                        {isExpanded && (
                          <tr className="bg-white">
                            <td colSpan={activeTab === 'userwise' ? 5 : 4} className="p-0">
                              <div className="px-6 py-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="rounded-xl border border-cyan-100/50 overflow-hidden bg-white shadow-sm">
                                  <table className="w-full text-left">
                                    <thead className="bg-cyan-50/50">
                                      <tr>
                                        <th className="py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-700/60">Currency Details</th>
                                        <th className="py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-700/60 text-right">Price</th>
                                        <th className="py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-700/60 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cyan-50/50">
                                      {group.prices.map((price: any) => (
                                        <tr key={price.id} className="hover:bg-cyan-50/20 transition-colors">
                                          <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-600 text-white text-xs font-bold shadow-sm">
                                                {getCurrencySymbol(price.currency)}
                                              </span>
                                              <span className="text-sm font-bold text-gray-900">{price.currency}</span>
                                            </div>
                                          </td>
                                          <td className="py-3 px-4 text-right">
                                            <span className="text-sm font-black text-gray-800 tracking-tight">
                                              {price.price.toFixed(2)}
                                            </span>
                                          </td>
                                          <td className="py-3 px-4 text-right">
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                activeTab === 'general' ? openEditGeneralModal(price) : openEditUserwiseModal(price);
                                              }}
                                              className="p-1.5 text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-all cursor-pointer"
                                            >
                                              <Edit2 size={14} />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
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

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-t-2xl">
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
                      <CustomSelect
                        label="Username"
                        required
                        value={formUserId}
                        onChange={setFormUserId}
                        options={usersList.map((u: any) => ({ value: u.id, label: u.username }))}
                        placeholder="Choose User"
                      />
                    )}

                    <CustomSelect
                      label="Service"
                      required
                      value={formServiceId}
                      onChange={setFormServiceId}
                      options={servicesList.map((s: any) => ({ value: s.id, label: s.name }))}
                      placeholder="Choose Service"
                    />

                    <CustomSelect
                      label="Currency"
                      required
                      value={formCurrency}
                      onChange={setFormCurrency}
                      options={currenciesList.map(c => ({ value: c.code, label: `${c.symbol}, ${c.code}, ${c.name}` }))}
                      placeholder="Choose Currency"
                      maxMenuHeight={activeTab === 'userwise' ? 200 : 250}
                    />

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
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || formServiceId === '' || formPrice === '' || (activeTab === 'userwise' && formUserId === '')}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 rounded-xl transition-all shadow-md shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 cursor-pointer"
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
