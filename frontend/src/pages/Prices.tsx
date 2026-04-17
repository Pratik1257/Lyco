import { useState, useMemo, Fragment, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, X, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { pricesApi, usersApi } from '../api/pricesApi';
import { servicesApi } from '../api/servicesApi';
import CustomSelect from '../components/ui/CustomSelect';
import CurrencySelect from '../components/ui/CurrencySelect';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';

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
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [formServiceId, setFormServiceId] = useState<number | ''>('');
  const [formCurrencyPrices, setFormCurrencyPrices] = useState<Record<string, number | ''>>({});
  const [formCurrencyIds, setFormCurrencyIds] = useState<Record<string, number>>({}); // Tracks existing IDs for update
  const [formUserId, setFormUserId] = useState<number | ''>('');
  const [baselinePrice, setBaselinePrice] = useState<number | null>(null);

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

  // Auto-set currency when user is selected in Userwise tab
  useEffect(() => {
    if (activeTab === 'userwise' && formUserId && usersList.length > 0 && !editingId) {
      const selectedUser = usersList.find(u => u.id === Number(formUserId));
      if (selectedUser?.currency) {
        setFormCurrencyPrices({ [selectedUser.currency]: '' });
      } else {
        setFormCurrencyPrices({});
      }
    }
  }, [formUserId, activeTab, usersList, editingId]);

  // Fetch baseline general price when service + user currency are both known
  useEffect(() => {
    const currency = Object.keys(formCurrencyPrices)[0];
    if (activeTab === 'userwise' && formServiceId && currency) {
      pricesApi.getGeneralPriceLookup(Number(formServiceId), currency)
        .then(price => setBaselinePrice(price))
        .catch(() => setBaselinePrice(null));
    } else {
      setBaselinePrice(null);
    }
  }, [formServiceId, formCurrencyPrices, activeTab]);

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
    
    // Initialize currencies based on active tab
    const initPrices: Record<string, number | ''> = {};
    if (activeTab === 'general') {
      currenciesList.forEach(c => {
        initPrices[c.code] = '';
      });
    }
    setFormCurrencyPrices(initPrices);
    
    setFormUserId('');
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditGeneralGroupModal = (group: any) => {
    setEditingId(null);
    setFormServiceId(group.serviceId);
    
    const pricesMap: Record<string, number | ''> = {};
    const idsMap: Record<string, number> = {};
    
    // Populate existing prices
    group.prices.forEach((p: any) => {
      pricesMap[p.currency] = p.price;
      idsMap[p.currency] = p.id;
    });

    // Ensure all other currencies are also present with empty values
    currenciesList.forEach(c => {
      if (!(c.code in pricesMap)) {
        pricesMap[c.code] = '';
      }
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

  const selectedCurrencies = useMemo(() => 
    Object.entries(formCurrencyPrices)
      .filter(([_, val]) => val !== '' && val !== undefined)
      .map(([code]) => code),
  [formCurrencyPrices]);

  // toggleCurrency removed - all currencies are now visible by default

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
        } else if (Number(val) <= 0) {
          errors[`price_${c}`] = "Price must be greater than zero.";
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    
    // Frontend duplication validation
    if (activeTab === 'userwise' && Object.keys(formCurrencyIds).length === 0 && !editingId) {
      const isDuplicate = items.some((item: any) => 
        item.userId === Number(formUserId) && 
        item.serviceId === Number(formServiceId) &&
        selectedCurrencies.includes(item.currency)
      );
      if (isDuplicate) {
        setFormError("A price for this currency already exists for the selected user and service.");
        return;
      }
    }
    setFieldErrors({});
    
    try {
      if (activeTab === 'general') {
        const isGroupEdit = Object.keys(formCurrencyIds).length > 0;
        
        if (isGroupEdit) {
          const selectedSet = new Set(selectedCurrencies);
          const existingCurrencies = Object.keys(formCurrencyIds);
          
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

          for (const currency of existingCurrencies) {
            if (!selectedSet.has(currency)) {
              await pricesApi.deleteGeneralPrice(formCurrencyIds[currency]);
            }
          }
        } else if (editingId) {
          const currency = selectedCurrencies[0];
          await updateGeneralMutation.mutateAsync({ 
            id: editingId, 
            serviceId: Number(formServiceId), 
            currency, 
            price: Number(formCurrencyPrices[currency]) 
          });
        } else {
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
            <SearchBar
              containerClassName="flex-1 max-w-md"
              placeholder={`Search ${activeTab === 'general' ? 'general prices' : 'userwise prices'}...`}
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
              Add {activeTab === 'general' ? 'General Price' : 'Userwise Price'}
            </Button>
          </div>

          <div className="overflow-x-auto relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-cyan-600" size={32} />
              </div>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === 'general' && <TableHead className="w-10 pl-6"></TableHead>}
                  {activeTab === 'userwise' && <TableHead className="pl-6">Full Name</TableHead>}
                  <TableHead>Service</TableHead>
                  <TableHead>{activeTab === 'general' ? 'Currencies' : 'Currency'}</TableHead>
                  {activeTab === 'userwise' && <TableHead>Price</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTab === 'userwise' ? (
                  items.length > 0 ? (
                    items.map((price: any) => (
                      <TableRow key={price.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors">
                        <TableCell className="pl-6 text-sm font-medium text-gray-700">
                          {price.firstname || price.lastname ? `${price.firstname} ${price.lastname}` : price.username}
                        </TableCell>
                        <TableCell className="text-sm font-bold text-gray-800">{price.serviceName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-600 text-white text-xs font-medium shadow-sm">
                              {getCurrencySymbol(price.currency)}
                            </span>
                            <span className="text-sm font-bold text-gray-900">{price.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-black text-gray-800 tracking-tight">
                          {price.price?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost-cyan"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(price.id);
                                setFormUserId(price.userId);
                                setFormServiceId(price.serviceId);
                                setFormCurrencyPrices({ [price.currency]: price.price });
                                setFormError(null);
                                setFieldErrors({});
                                setIsModalOpen(true);
                              }}
                              title="Edit Price"
                            >
                              <Edit2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-sm text-gray-500">
                        {isLoading ? 'Fetching data...' : 'No prices found.'}
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  groupedItems.length > 0 ? (
                    groupedItems.map((group: any) => {
                      const isExpanded = expandedRows.has(group.key);
                      const currencyCodes = group.prices.map((p: any) => p.currency);
                      
                      return (
                        <Fragment key={group.key}>
                          <TableRow 
                            onClick={() => toggleRow(group.key)}
                            className={`group cursor-pointer ${isExpanded ? 'bg-cyan-50/30' : 'hover:bg-gray-50/50'}`}
                          >
                            <TableCell className="pl-6">
                              <ChevronDown 
                                size={18} 
                                className={`text-gray-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} 
                              />
                            </TableCell>
                            <TableCell className="text-sm font-bold text-gray-800">
                              {group.serviceName}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-gray-400">
                              {currencyCodes.join(', ')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost-cyan"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditGeneralGroupModal(group);
                                  }}
                                  title="Edit Prices"
                                >
                                  <Edit2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow className="bg-white">
                              <TableCell colSpan={4} className="p-0">
                                <div className="px-6 py-2 animate-in slide-in-from-top-2 duration-300">
                                  <div className="rounded-xl border border-cyan-100/50 overflow-hidden bg-white shadow-sm">
                                    <Table>
                                      <thead className="bg-cyan-50/50">
                                        <tr>
                                          <th className="py-1.5 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-700/60">Currency Details</th>
                                          <th className="py-1.5 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-700/60 text-right">Price</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-cyan-50/50">
                                        {group.prices.map((price: any) => (
                                          <TableRow key={price.id} className="hover:bg-cyan-50/20 transition-colors">
                                            <TableCell>
                                              <div className="flex items-center gap-2">
                                                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-600 text-white text-xs font-medium shadow-sm">
                                                  {getCurrencySymbol(price.currency)}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">{price.currency}</span>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <span className="text-sm font-black text-gray-800 tracking-tight">
                                                {price.price?.toFixed(2)}
                                              </span>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-sm text-gray-500">
                        {isLoading ? 'Fetching data...' : 'No prices found.'}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>

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

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
              onClick={closeModal}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingId || Object.keys(formCurrencyIds).length > 0 
                      ? `Edit ${activeTab === 'general' ? 'General' : 'Userwise'} Price` 
                      : `New ${activeTab === 'general' ? 'General' : 'Userwise'} Price`}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeModal}
                >
                  <X size={20} />
                </Button>
              </div>

              <form onSubmit={handleSavePrice}>
                <div className="p-6">
                  <div className="space-y-4">
                    {activeTab === 'userwise' && (
                      <div className="space-y-1">
                        <CustomSelect
                          label="Full Name"
                          required
                          value={formUserId}
                          onChange={(v: string) => {
                            setFormUserId(v ? Number(v) : '');
                            setFieldErrors((e: Record<string, string>) => { const { user, ...rest } = e; return rest; });
                          }}
                          options={usersList.map((u: any) => ({ 
                            value: u.id, 
                            label: u.firstname || u.lastname ? `${u.firstname} ${u.lastname}` : u.username 
                          }))}
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Currencies & prices <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-400 mb-3">Select currencies and enter price for each.</p>
                        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto bg-slate-50/20">
                          {currenciesList.map(c => {
                            const hasValue = formCurrencyPrices[c.code] !== '' && formCurrencyPrices[c.code] !== undefined;
                            
                            return (
                              <div
                                key={c.code}
                                className={`flex items-center gap-4 px-5 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                                  hasValue ? 'bg-cyan-50/40' : 'hover:bg-gray-50/50'
                                }`}
                              >
                                {/* Currency Details */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-bold shadow-sm ring-1 ring-gray-900/5">
                                    {c.symbol}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-black text-gray-800 leading-none mb-0.5">{c.code}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">— {c.name}</span>
                                  </div>
                                </div>

                                {/* Inline price input */}
                                <div className="ml-auto w-[164px] flex flex-col shrink-0 relative">
                                  <div className="flex items-center shadow-sm rounded-lg overflow-hidden group">
                                    <div className={`flex items-center justify-center w-8 h-9 bg-teal-50 border ${fieldErrors[`price_${c.code}`] ? 'border-red-300' : 'border-[#1ab3c8]/30'} border-r-0 transition-colors group-hover:bg-teal-100/50`}>
                                      <span className="text-sm font-bold text-[#1ab3c8]">
                                        {c.symbol}
                                      </span>
                                    </div>
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
                                      className={`w-[132px] h-9 px-3 bg-white border ${fieldErrors[`price_${c.code}`] ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-cyan-500/20 focus:border-cyan-500'} text-sm focus:outline-none focus:ring-2 transition-all font-bold text-gray-800`}
                                    />
                                  </div>
                                  {fieldErrors[`price_${c.code}`] && (
                                    <span className="absolute -bottom-5 right-1 text-[10px] font-bold text-red-500 text-right whitespace-nowrap">{fieldErrors[`price_${c.code}`]}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4 pt-1">
                        {/* Left: User Price Entry */}
                        <div className="flex-[0.4]">
                          <label className="block text-xs font-medium text-gray-600 mb-2 ml-1">
                            Price <span className="text-red-500">*</span>
                          </label>
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

                        {/* Right: General Price Reference */}
                        <div className="flex-[0.6]">
                          <label className="block text-xs font-medium text-gray-600 mb-2 ml-1">
                            General price <span className="text-red-500">*</span>
                          </label>
                          <div className={`flex flex-col justify-center h-[42px] px-4 rounded-[20px] border mt-0.5 transition-colors ${
                            baselinePrice !== null
                              ? 'bg-amber-50/60 border-amber-200'
                              : 'bg-gray-50/60 border-gray-200'
                          }`}>
                            {baselinePrice !== null ? (
                              <span className="text-sm font-black text-amber-900 leading-none">
                                {getCurrencySymbol(Object.keys(formCurrencyPrices)[0] || '')} {baselinePrice.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-gray-400">
                                {formUserId && formServiceId
                                  ? 'No general price set'
                                  : formUserId
                                  ? 'Pick a service'
                                  : 'Choose a User First'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {fieldErrors.general && (
                      <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
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

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isPending || formServiceId === '' || selectedCurrencies.length === 0 || !allPricesFilled || (activeTab === 'userwise' && formUserId === '')}
                    isLoading={isPending}
                  >
                    {editingId || Object.keys(formCurrencyIds).length > 0 ? 'Update Price' : `Create Price${selectedCurrencies.length > 1 ? 's' : ''}`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
