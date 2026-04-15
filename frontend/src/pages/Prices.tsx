import { useState, useMemo, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, X, ChevronDown, ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { pricesApi, usersApi } from '../api/pricesApi';
import { servicesApi } from '../api/servicesApi';
import CustomSelect from '../components/ui/CustomSelect';
import CurrencySelect from '../components/ui/CurrencySelect';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [formServiceId, setFormServiceId] = useState<number | ''>('');
  const [formCurrencyPrices, setFormCurrencyPrices] = useState<Record<string, number | ''>>({});
  const [formCurrencyIds, setFormCurrencyIds] = useState<Record<string, number>>({}); // Tracks existing IDs for update
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
    mutationFn: async (entries: { serviceId: number, currency: string, price: number }[]) => {
      for (const entry of entries) {
        await pricesApi.createGeneralPrice(entry.serviceId, entry.currency, entry.price);
      }
    },
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
    mutationFn: async (entries: { userId: number, serviceId: number, currency: string, price: number }[]) => {
      for (const entry of entries) {
        await pricesApi.createUserwisePrice(entry.userId, entry.serviceId, entry.currency, entry.price);
      }
    },
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
          serviceId: item.serviceId,
          userId: item.userId,
          canDelete: item.canDelete,
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

  const getCurrencyFlag = (code: string) => {
    const flags: Record<string, string> = {
      USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', INR: '🇮🇳',
      AED: '🇦🇪', AUD: '🇦🇺', CAD: '🇨🇦', JPY: '🇯🇵'
    };
    return flags[code] || '🏳️';
  };

  // Modal Actions
  const openAddModal = () => {
    setEditingId(null);
    setFormServiceId('');
    setFormCurrencyPrices({});
    setFormUserId('');
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };


  const openEditGeneralGroupModal = (group: any) => {
    setEditingId(null); // We are in group edit mode
    setFormServiceId(group.serviceId);
    
    const pricesMap: Record<string, number | ''> = {};
    const idsMap: Record<string, number> = {};
    group.prices.forEach((p: any) => {
      pricesMap[p.currency] = p.price;
      idsMap[p.currency] = p.id;
    });
    
    setFormCurrencyPrices(pricesMap);
    setFormCurrencyIds(idsMap);
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditUserwiseGroupModal = (group: any) => {
    setEditingId(null); // We are in group edit mode
    setFormUserId(group.userId);
    setFormServiceId(group.serviceId);
    
    const pricesMap: Record<string, number | ''> = {};
    const idsMap: Record<string, number> = {};
    group.prices.forEach((p: any) => {
      pricesMap[p.currency] = p.price;
      idsMap[p.currency] = p.id;
    });
    
    setFormCurrencyPrices(pricesMap);
    setFormCurrencyIds(idsMap);
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormCurrencyIds({});
    setFieldErrors({});
  };

  const selectedCurrencies = Object.keys(formCurrencyPrices);

  const toggleCurrency = (code: string) => {
    setFormCurrencyPrices((prev: Record<string, number | ''>) => {
      const next = { ...prev };
      if (code in next) {
        delete next[code];
        setFieldErrors((e: Record<string, string>) => {
          const newE = { ...e };
          delete newE[`price_${code}`];
          return newE;
        });
      } else {
        next[code] = '';
      }
      return next;
    });
  };

  const setCurrencyPrice = (code: string, value: number | '') => {
    setFormCurrencyPrices((prev: Record<string, number | ''>) => ({ ...prev, [code]: value }));
    if (value !== '' && Number(value) >= 0) {
      setFieldErrors((e: Record<string, string>) => {
        const newE = { ...e };
        delete newE[`price_${code}`];
        return newE;
      });
    }
  };

  const allPricesFilled = selectedCurrencies.length > 0 && selectedCurrencies.every(c => formCurrencyPrices[c] !== '' && formCurrencyPrices[c] !== undefined);

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicit Validation before proceeding
    const errors: Record<string, string> = {};
    if (formServiceId === '') errors.service = "A valid service is required.";
    if (activeTab === 'userwise' && formUserId === '') errors.user = "A valid user is required.";
    
    if (selectedCurrencies.length === 0) {
      errors.general = "Please select at least one currency.";
    } else {
      selectedCurrencies.forEach(c => {
        const val = formCurrencyPrices[c];
        if (val === '' || val === undefined) {
          errors[`price_${c}`] = "Price is required.";
        } else if (Number(val) < 0) {
          errors[`price_${c}`] = "Cannot be negative.";
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    
    try {
      if (activeTab === 'general') {
        const isGroupEdit = Object.keys(formCurrencyIds).length > 0;
        
        if (isGroupEdit) {
          // Sync Group: Update existing, Create new, Delete removed
          const selectedSet = new Set(selectedCurrencies);
          const existingCurrencies = Object.keys(formCurrencyIds);
          
          // 1. Update/Create
          for (const currency of selectedCurrencies) {
            const price = Number(formCurrencyPrices[currency]);
            if (formCurrencyIds[currency]) {
              await updateGeneralMutation.mutateAsync({ 
                id: formCurrencyIds[currency], 
                serviceId: Number(formServiceId), 
                currency, 
                price 
              });
            } else {
              await createGeneralMutation.mutateAsync([{ 
                serviceId: Number(formServiceId), 
                currency, 
                price 
              }]);
            }
          }

          // 2. Delete removed
          for (const currency of existingCurrencies) {
            if (!selectedSet.has(currency)) {
              await pricesApi.deleteGeneralPrice(formCurrencyIds[currency]);
            }
          }
        } else if (editingId) {
          // Single Edit
          const currency = selectedCurrencies[0];
          await updateGeneralMutation.mutateAsync({ 
            id: editingId, 
            serviceId: Number(formServiceId), 
            currency, 
            price: Number(formCurrencyPrices[currency]) 
          });
        } else {
          // New Create
          const payload = selectedCurrencies.map(currency => ({
            serviceId: Number(formServiceId),
            currency,
            price: Number(formCurrencyPrices[currency])
          }));
          await createGeneralMutation.mutateAsync(payload);
        }
        
        queryClient.invalidateQueries({ queryKey: ['generalPrices'] });
        closeModal();
      } else {
        // Userwise logic
        const isGroupEdit = Object.keys(formCurrencyIds).length > 0;
        
        if (isGroupEdit) {
          const selectedSet = new Set(selectedCurrencies);
          const existingCurrencies = Object.keys(formCurrencyIds);

          for (const currency of selectedCurrencies) {
            const price = Number(formCurrencyPrices[currency]);
            if (formCurrencyIds[currency]) {
              await updateUserwiseMutation.mutateAsync({ 
                id: formCurrencyIds[currency], 
                userId: Number(formUserId), 
                serviceId: Number(formServiceId), 
                currency, 
                price 
              });
            } else {
              await createUserwiseMutation.mutateAsync([{ 
                userId: Number(formUserId), 
                serviceId: Number(formServiceId), 
                currency, 
                price 
              }]);
            }
          }

          // Delete removed
          for (const currency of existingCurrencies) {
            if (!selectedSet.has(currency)) {
              await pricesApi.deleteUserwisePrice(formCurrencyIds[currency]);
            }
          }
        } else if (editingId) {
          const currency = selectedCurrencies[0];
          await updateUserwiseMutation.mutateAsync({ 
            id: editingId, 
            userId: Number(formUserId), 
            serviceId: Number(formServiceId), 
            currency, 
            price: Number(formCurrencyPrices[currency]) 
          });
        } else {
          const payload = selectedCurrencies.map(currency => ({
            userId: Number(formUserId),
            serviceId: Number(formServiceId),
            currency,
            price: Number(formCurrencyPrices[currency])
          }));
          await createUserwiseMutation.mutateAsync(payload);
        }
        
        queryClient.invalidateQueries({ queryKey: ['userwisePrices'] });
        closeModal();
      }
    } catch (err) {
      // Mutations handle their own error states, but we catch to stop execution
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
          <div className="py-2.5 px-6 border-b border-gray-100 flex items-center justify-between gap-4">
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
          <div className="overflow-x-auto relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-cyan-600" size={32} />
              </div>
            )}
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="w-10 py-2 pl-6"></th>
                  {activeTab === 'userwise' && (
                    <th className="py-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Username</th>
                  )}
                  <th className="py-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Service</th>
                  <th className="py-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Currencies</th>
                  <th className="py-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {groupedItems.length > 0 ? (
                  groupedItems.map((group: any) => {
                    const isExpanded = expandedRows.has(group.key);
                    const currencyCodes = group.prices.map((p: any) => p.currency);
                    
                    return (
                      <Fragment key={group.key}>
                        {/* Parent Row */}
                        <tr 
                          onClick={() => toggleRow(group.key)}
                          className={`group cursor-pointer transition-all ${isExpanded ? 'bg-cyan-50/30' : 'hover:bg-gray-50/50'}`}
                        >
                          <td className="py-1.5 pl-6">
                            <ChevronDown 
                              size={18} 
                              className={`text-gray-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} 
                            />
                          </td>
                          {activeTab === 'userwise' && (
                            <td className="py-1.5 px-4 text-sm font-medium text-gray-700">{group.username}</td>
                          )}
                          <td className="py-1.5 px-4 text-sm font-bold text-gray-800">
                            {group.serviceName}
                          </td>
                          <td className="py-1.5 px-4 text-xs font-medium text-gray-400">
                            {currencyCodes.join(', ')}
                          </td>
                          <td className="py-1.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  activeTab === 'general' ? openEditGeneralGroupModal(group) : openEditUserwiseGroupModal(group);
                                }}
                                className="p-1.5 text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-all cursor-pointer"
                                title="Edit Prices"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Child Rows (Sub-table) */}
                        {isExpanded && (
                          <tr className="bg-white">
                            <td colSpan={activeTab === 'userwise' ? 5 : 4} className="p-0">
                              <div className="px-6 py-2 animate-in slide-in-from-top-2 duration-300">
                                <div className="rounded-xl border border-cyan-100/50 overflow-hidden bg-white shadow-sm">
                                  <table className="w-full text-left">
                                    <thead className="bg-cyan-50/50">
                                      <tr>
                                        <th className="py-1.5 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-700/60">Currency Details</th>
                                        <th className="py-1.5 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-700/60 text-right">Price</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cyan-50/50">
                                      {group.prices.map((price: any) => (
                                        <tr key={price.id} className="hover:bg-cyan-50/20 transition-colors">
                                          <td className="py-1.5 px-4">
                                            <div className="flex items-center gap-2">
                                              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-600 text-white text-xs font-bold shadow-sm">
                                                {getCurrencySymbol(price.currency)}
                                              </span>
                                              <span className="text-sm font-bold text-gray-900">{price.currency}</span>
                                            </div>
                                          </td>
                                          <td className="py-1.5 px-4 text-right">
                                            <span className="text-sm font-black text-gray-800 tracking-tight">
                                              {price.price.toFixed(2)}
                                            </span>
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
          <div className="py-2.5 px-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 flex-wrap gap-4">
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
                  onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1 || isLoading}
                  className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-200 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-500 font-bold px-1">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
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
                    {editingId || Object.keys(formCurrencyIds).length > 0 
                      ? `Edit ${activeTab === 'general' ? 'General' : 'Userwise'} Price` 
                      : `New ${activeTab === 'general' ? 'General' : 'Userwise'} Price`}
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
                      <div className="space-y-1">
                        <CustomSelect
                          label="Username"
                          required
                          value={formUserId}
                          onChange={(v: string) => {
                            setFormUserId(v ? Number(v) : '');
                            setFieldErrors((e: Record<string, string>) => { const { user, ...rest } = e; return rest; });
                          }}
                          options={usersList.map((u: any) => ({ value: u.id, label: u.username }))}
                          placeholder="Choose User"
                        />
                        {fieldErrors.user && <p className="text-red-500 text-xs font-medium ml-1">{fieldErrors.user}</p>}
                      </div>
                    )}

                    <div className="space-y-1">
                      <CustomSelect
                        label="Service"
                        required
                        value={formServiceId}
                        onChange={(v: string) => {
                          setFormServiceId(v ? Number(v) : '');
                          setFieldErrors((e: Record<string, string>) => { const { service, ...rest } = e; return rest; });
                        }}
                        options={servicesList.map((s: any) => ({ value: s.id, label: s.name }))}
                        placeholder="Choose Service"
                      />
                      {fieldErrors.service && <p className="text-red-500 text-xs font-medium ml-1">{fieldErrors.service}</p>}
                    </div>

                    {activeTab === 'general' ? (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Currencies & prices <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-400 mb-3">Select currencies and enter price for each.</p>
                        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[260px] overflow-y-auto">
                          {currenciesList.map(c => {
                            const isChecked = c.code in formCurrencyPrices;
                            const isDisabledRow = editingId !== null && !isChecked;
                            return (
                              <div
                                key={c.code}
                                className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-b-0 transition-colors ${
                                  isChecked ? 'bg-cyan-50/40' : 'hover:bg-gray-50/50'
                                } ${isDisabledRow ? 'opacity-40 pointer-events-none' : ''}`}
                              >
                                {/* Checkbox */}
                                <label className="flex items-center cursor-pointer shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCurrency(c.code)}
                                    disabled={editingId !== null && !isChecked}
                                    className="sr-only peer"
                                  />
                                  <span className="w-[18px] h-[18px] rounded-[5px] border-2 border-gray-300 flex items-center justify-center transition-all peer-checked:bg-cyan-600 peer-checked:border-cyan-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-500/30">
                                    {isChecked && (
                                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                        <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                  </span>
                                </label>

                                {/* Currency symbol + info */}
                                <span className="text-sm font-bold text-gray-500 w-5 text-center shrink-0">{c.symbol}</span>
                                <span className="text-sm font-bold text-gray-800 shrink-0">{c.code}</span>
                                <span className="text-xs text-gray-400 truncate">— {c.name}</span>

                                {/* Inline price input */}
                                {isChecked && (
                                  <div className="ml-auto w-[164px] flex flex-col shrink-0 relative">
                                    <div className="flex items-center">
                                      <span className={`flex items-center justify-center w-8 h-9 bg-gray-100 border ${fieldErrors[`price_${c.code}`] ? 'border-red-300' : 'border-gray-200'} border-r-0 rounded-l-lg text-sm font-bold text-gray-500 transition-colors`}>{c.symbol}</span>
                                      <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="0"
                                        value={formCurrencyPrices[c.code] ?? ''}
                                        onKeyDown={(e) => {
                                          if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                                        }}
                                        onChange={(e) => {
                                          const val = e.target.value ? Number(e.target.value) : '';
                                          if (typeof val === 'number' && val < 0) return;
                                          setCurrencyPrice(c.code, val);
                                        }}
                                        className={`w-[132px] h-9 px-3 bg-white border ${fieldErrors[`price_${c.code}`] ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-cyan-500/20 focus:border-cyan-500'} rounded-r-lg text-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800`}
                                        autoFocus
                                      />
                                    </div>
                                    {fieldErrors[`price_${c.code}`] && (
                                      <span className="absolute -bottom-5 right-1 text-[10px] font-bold text-red-500 text-right whitespace-nowrap">{fieldErrors[`price_${c.code}`]}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                          Currency & price <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-start gap-4">
                          <div className="flex-[0.6]">
                            <CurrencySelect
                              value={Object.keys(formCurrencyPrices)[0] || ''}
                              onChange={(val) => {
                                setFormCurrencyPrices(val ? { [val]: '' } : {});
                                setFieldErrors((e: Record<string, string>) => { const newE = { ...e }; delete newE[`price_${val}`]; delete newE.general; return newE; });
                              }}
                              options={currenciesList.map(c => ({
                                value: c.code,
                                label: `${getCurrencyFlag(c.code)}, ${c.code}, ${c.name}`,
                                name: c.name,
                                symbol: c.symbol
                              }))}
                            />
                          </div>
                          <div className="flex-[0.4] pr-1">
                            <div className={`flex w-full h-[42px] bg-white border ${fieldErrors[`price_${Object.keys(formCurrencyPrices)[0]}`] ? 'border-red-300 focus-within:ring-red-500/20 focus-within:border-red-500' : 'border-gray-200 focus-within:ring-cyan-500/20 focus-within:border-cyan-500'} rounded-[20px] shadow-sm overflow-hidden transition-all group mt-0.5`}>
                              <div className="flex justify-center items-center px-3.5 bg-teal-50 border-r border-[#1ab3c8]/30">
                                <span className="text-base font-bold text-[#1ab3c8]">
                                  {Object.keys(formCurrencyPrices)[0] ? getCurrencySymbol(Object.keys(formCurrencyPrices)[0]) : '$'}
                                </span>
                              </div>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                placeholder="Enter price"
                                value={formCurrencyPrices[Object.keys(formCurrencyPrices)[0]] ?? ''}
                                onKeyDown={(e) => {
                                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                                }}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : '';
                                  if (typeof val === 'number' && val < 0) return;
                                  setCurrencyPrice(Object.keys(formCurrencyPrices)[0], val);
                                }}
                                disabled={!Object.keys(formCurrencyPrices)[0]}
                                className="flex-1 px-3 w-full text-[13px] font-bold text-gray-800 bg-transparent focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
                              />
                            </div>
                            {fieldErrors[`price_${Object.keys(formCurrencyPrices)[0]}`] && (
                              <p className="text-red-500 text-[11px] font-bold ml-1 mt-1 text-right">{fieldErrors[`price_${Object.keys(formCurrencyPrices)[0]}`]}</p>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                    
                    {fieldErrors.general && (
                      <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                        <AlertCircle size={14} /> {fieldErrors.general}
                      </p>
                    )}

                    {formError && (
                      <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-100">
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
                    disabled={isPending || formServiceId === '' || selectedCurrencies.length === 0 || !allPricesFilled || (activeTab === 'userwise' && formUserId === '')}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 rounded-xl transition-all shadow-md shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    {isPending && <Loader2 className="animate-spin" size={16} />}
                    {editingId || Object.keys(formCurrencyIds).length > 0 ? 'Update Price' : `Create Price${selectedCurrencies.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
