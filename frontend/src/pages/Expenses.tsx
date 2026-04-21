import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, Search, AlertCircle, X,
  Receipt, DollarSign, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

import { expensesApi, type Expense, type CreateExpensePayload } from '../api/expensesApi';
import { servicesApi } from '../api/servicesApi';
import { pricesApi } from '../api/pricesApi';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import CustomSelect from '../components/ui/CustomSelect';
import DatePicker from '../components/ui/DatePicker';

// ── Form defaults ────────────────────────────────────────────────────────────
const emptyForm: CreateExpensePayload = {
  serviceId: 0,
  title: '',
  amount: 0,
  currency: 'USD',
  expenseDate: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function Expenses() {
  const queryClient = useQueryClient();

  // ── List State ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterServiceId, setFilterServiceId] = useState<number | undefined>(undefined);

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateExpensePayload>({ ...emptyForm });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // ── Delete Modal ────────────────────────────────────────────────────────────
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // ── Data Queries ────────────────────────────────────────────────────────────
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['expenses', currentPage, itemsPerPage, searchQuery, filterServiceId],
    queryFn: () => expensesApi.getExpenses(currentPage, itemsPerPage, searchQuery, filterServiceId),
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services-all'],
    queryFn: () => servicesApi.getServices(1, 500, ''),
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: pricesApi.getCurrencies,
  });

  const servicesList = servicesData?.items ?? [];
  const expenses = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const safeCurrentPage = data?.page ?? 1;
  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + expenses.length;

  // ── Summary ─────────────────────────────────────────────────────────────────
  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      editingId
        ? expensesApi.updateExpense(editingId, payload)
        : expensesApi.createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(editingId ? 'Expense updated successfully' : 'Expense created successfully');
      closeForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setFormError(`Failed: ${msg}`);
      toast.error('Operation failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
      closeDeleteModal();
    },
    onError: (err: any) => {
      toast.error(`Delete failed: ${err.response?.data?.error || err.message}`);
      closeDeleteModal();
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFieldErrors({});
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditingId(e.expenseId);
    setFormData({
      serviceId: e.serviceId || 0,
      title: e.title || '',
      amount: e.amount || 0,
      currency: e.currency || 'USD',
      expenseDate: e.expenseDate ? e.expenseDate.split('T')[0] : '',
      notes: e.notes || '',
    });
    setFieldErrors({});
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFieldErrors({});
    setFormError(null);
  };

  const openDeleteModal = (e: Expense) => {
    setExpenseToDelete(e);
    setIsDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteOpen(false);
    setExpenseToDelete(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.serviceId) errors.serviceId = 'Service is required';
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.amount || formData.amount <= 0) errors.amount = 'Amount must be greater than zero';
    if (!formData.currency) errors.currency = 'Currency is required';
    if (!formData.expenseDate) errors.expenseDate = 'Date is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateForm()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    saveMutation.mutate(formData);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const premiumInput = 'w-full h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all outline-none';

  const formatDate = (d: string | null) => {
    if (!d) return '--';
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
  };

  const formatAmount = (amount: number | null) => {
    if (amount == null) return '--';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ── Skeleton ────────────────────────────────────────────────────────────────
  const TableSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm" /></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-32 shadow-sm" /></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-20 shadow-sm" /></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm" /></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-28 shadow-sm" /></TableCell>
          <TableCell className="text-right"><div className="h-8 bg-gray-200 rounded-lg w-20 ml-auto shadow-sm" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="relative max-w-[1400px] mx-auto space-y-3">
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">Failed to fetch expenses: {(error as Error).message}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Receipt size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Expenses</p>
            <p className="text-2xl font-black text-gray-900">{totalCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Page Total</p>
            <p className="text-2xl font-black text-gray-900">
              {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="py-2.5 px-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <SearchBar
              containerClassName="flex-1 max-w-xs"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <div className="w-52">
              <CustomSelect
                value={filterServiceId || ''}
                onChange={(val) => {
                  setFilterServiceId(val ? Number(val) : undefined);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Services' },
                  ...servicesList.map(s => ({ value: s.id, label: s.name }))
                ]}
                placeholder="Filter by Service"
              />
            </div>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={18} />
            Add Expense
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Service</TableHead>
                <TableHead className="whitespace-nowrap">Title</TableHead>
                <TableHead className="whitespace-nowrap">Amount</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Notes</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.expenseId} className="group hover:bg-gray-50/50">
                    <TableCell className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-cyan-50 border border-cyan-100/50 flex items-center justify-center">
                          <FileText size={12} className="text-cyan-600" />
                        </div>
                        {expense.serviceName || '--'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700 max-w-[200px] truncate">{expense.title || '--'}</TableCell>
                    <TableCell className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatAmount(expense.amount)}</TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">{formatDate(expense.expenseDate)}</TableCell>
                    <TableCell className="text-sm text-gray-400 max-w-[180px] truncate">{expense.notes || '--'}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost-cyan" size="icon" onClick={() => openEdit(expense)} title="Edit">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost-red" size="icon" onClick={() => openDeleteModal(expense)} title="Delete">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-500">No expenses found.</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or add a new expense.</p>
                    </div>
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

      {/* ── Create/Edit Modal ──────────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeForm} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 border border-white/20">
            {/* Modal Header */}
            <div className="relative h-20 bg-gradient-to-br from-[#0891b2] to-[#06b6d4] flex items-center px-8">
              <div className="absolute top-0 right-0 p-4">
                <button onClick={closeForm} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Receipt size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">{editingId ? 'Edit Expense' : 'New Expense'}</h3>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Service-based tracking</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {formError && (
                <div className="text-red-600 text-sm font-bold flex items-center gap-3 bg-red-50 p-3 rounded-xl border border-red-100/50">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}

              {/* Service */}
              <div className="space-y-1">
                <label className="block text-[13px] font-semibold text-slate-900 ml-1">Service <span className="text-red-500">*</span></label>
                <CustomSelect
                  value={formData.serviceId || ''}
                  onChange={(val) => {
                    setFormData(p => ({ ...p, serviceId: val ? Number(val) : 0 }));
                    if (fieldErrors.serviceId) setFieldErrors(p => { const n = { ...p }; delete n.serviceId; return n; });
                  }}
                  options={servicesList.map(s => ({ value: s.id, label: s.name }))}
                  placeholder="Select Service"
                  error={fieldErrors.serviceId}
                />
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-[13px] font-semibold text-slate-900 ml-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(p => ({ ...p, title: e.target.value }));
                    if (fieldErrors.title) setFieldErrors(p => { const n = { ...p }; delete n.title; return n; });
                  }}
                  placeholder="Brief description of expense"
                  maxLength={250}
                  className={`${premiumInput} ${fieldErrors.title ? 'border-red-500 ring-4 ring-red-500/5' : ''}`}
                />
                {fieldErrors.title && <p className="text-red-500 text-xs font-medium ml-1">{fieldErrors.title}</p>}
              </div>

              {/* Amount + Currency row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Amount <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.amount || ''}
                    onChange={(e) => {
                      const rawVal = parseFloat(e.target.value) || 0;
                      // Round to 2 decimal places to prevent floating point issues (e.g. 0.020000000001)
                      const val = Math.round(rawVal * 100) / 100;
                      setFormData(p => ({ ...p, amount: val }));
                      if (fieldErrors.amount) setFieldErrors(p => { const n = { ...p }; delete n.amount; return n; });
                    }}
                    placeholder="0.00"
                    className={`${premiumInput} ${fieldErrors.amount ? 'border-red-500 ring-4 ring-red-500/5' : ''}`}
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                  />
                  {fieldErrors.amount && <p className="text-red-500 text-xs font-medium ml-1">{fieldErrors.amount}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-[13px] font-semibold text-slate-900 ml-1">Currency <span className="text-red-500">*</span></label>
                  <CustomSelect
                    value={formData.currency}
                    onChange={(val) => {
                      setFormData(p => ({ ...p, currency: val as string }));
                      if (fieldErrors.currency) setFieldErrors(p => { const n = { ...p }; delete n.currency; return n; });
                    }}
                    options={currencies.map(c => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
                    placeholder="Currency"
                    error={fieldErrors.currency}
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="block text-[13px] font-semibold text-slate-900 ml-1">Expense Date <span className="text-red-500">*</span></label>
                <DatePicker
                  direction="up"
                  value={formData.expenseDate}
                  onChange={(val) => {
                    setFormData(p => ({ ...p, expenseDate: val }));
                    if (fieldErrors.expenseDate) setFieldErrors(p => { const n = { ...p }; delete n.expenseDate; return n; });
                  }}
                  placeholder="Select expense date"
                  error={fieldErrors.expenseDate}
                />
                {fieldErrors.expenseDate && <p className="text-red-500 text-xs font-medium ml-1">{fieldErrors.expenseDate}</p>}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-[13px] font-semibold text-slate-900 ml-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional internal notes..."
                  maxLength={1000}
                  rows={3}
                  className={`${premiumInput} h-auto py-3 resize-none`}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-2">
                <button type="button" onClick={closeForm} className="text-[11px] font-black uppercase text-slate-400 hover:text-cyan-700 tracking-widest transition-colors px-6">
                  Cancel
                </button>
                <Button
                  variant="primary"
                  type="submit"
                  className={`px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-white border-0 ${
                    saveMutation.isPending
                      ? 'bg-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-xl shadow-cyan-500/20 active:scale-[0.98]'
                  }`}
                  disabled={saveMutation.isPending}
                  isLoading={saveMutation.isPending}
                >
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {isDeleteOpen && expenseToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeDeleteModal} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3">Delete Expense</h3>
            <p className="text-sm text-gray-500 leading-relaxed px-2 font-medium">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{expenseToDelete.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <button onClick={closeDeleteModal} className="text-[11px] font-black uppercase text-slate-400 hover:text-slate-700 tracking-widest transition-colors px-6 py-3">
                Cancel
              </button>
              <Button
                variant="primary"
                onClick={() => deleteMutation.mutate(expenseToDelete.expenseId)}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-xl shadow-red-500/20 text-white font-black text-xs uppercase tracking-widest border-0"
                isLoading={deleteMutation.isPending}
                disabled={deleteMutation.isPending}
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
