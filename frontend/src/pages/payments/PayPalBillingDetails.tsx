import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail, Edit2, Search, Save, X, Loader2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsApi } from '../../api/paymentsApi';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';

export default function PayPalBillingDetails() {
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState('');

  // Queries
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['paypal-config'],
    queryFn: () => paymentsApi.getPaypalConfig(),
  });

  // Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, email }: { id: number; email: string }) =>
      paymentsApi.updatePaypalConfig(id, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paypal-config'] });
      toast.success('PayPal email updated successfully');
      setEditingId(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.Message || 'Failed to update configuration';
      toast.error(msg);
    }
  });

  // Derived
  const filteredConfigs = configs.filter(c =>
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toString().includes(searchQuery)
  );

  const totalCount = filteredConfigs.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const paginatedConfigs = filteredConfigs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (config: any) => {
    setEditingId(config.id);
    setEditEmail(config.email);
  };

  const handleSave = () => {
    if (!editEmail || !editEmail.includes('@')) {
      toast.error('Please enter a valid business email');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, email: editEmail });
    }
  };

  return (
    <div className="relative animate-in fade-in duration-500 space-y-4">

      {/* Main Unified Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">

        {/* Header / Toolbar Section */}
        <div className="py-2.5 px-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search by business email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium italic hidden lg:block">
              Tip: Ensure the email is your verified PayPal business account.
            </p>
          </div>
        </div>

        {/* Table Content Area */}
        <div className="overflow-x-auto relative min-h-[300px]">
          {isLoading ? (
            <TableSkeleton rows={itemsPerPage} cols={2} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider py-4 pl-8 whitespace-nowrap">PayPal Business Email</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs uppercase tracking-wider text-right pr-8 py-4 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedConfigs.length > 0 ? (
                  paginatedConfigs.map((config) => {
                    const isEditing = editingId === config.id;
                    return (
                      <TableRow key={config.id} className={`group transition-colors ${isEditing ? 'bg-cyan-50/30' : 'hover:bg-slate-50/50'}`}>
                        <TableCell className="pl-8 whitespace-nowrap">
                          {isEditing ? (
                            <div className="relative max-w-sm animate-in slide-in-from-left-2 duration-300">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-600" size={16} />
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-white border-2 border-cyan-500/20 rounded-xl text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"
                                placeholder="example@paypal.com"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
                                <Mail size={14} />
                              </div>
                              <span className="font-bold text-slate-800 text-sm tracking-tight">{config.email || '--'}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-8 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  onClick={handleSave}
                                  disabled={updateMutation.isPending}
                                  className="h-10 px-5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                                  variant="unstyled"
                                >
                                  {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                  onClick={() => setEditingId(null)}
                                  disabled={updateMutation.isPending}
                                  className="h-10 px-4 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 font-black text-[11px] uppercase tracking-widest rounded-xl"
                                  variant="unstyled"
                                >
                                  <X size={16} />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost-cyan"
                                size="icon"
                                className="w-8 h-8 rounded-lg hover:bg-cyan-50 text-cyan-600"
                                onClick={() => handleEdit(config)}
                                title="Edit Configuration"
                              >
                                <Edit2 size={16} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Mail size={32} className="text-slate-200" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">No configurations found</h3>
                        <p className="text-xs text-slate-400 mt-1">Adjust your search or click refresh.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer / Pagination Section */}
        <div className="p-0 border-t border-slate-50 rounded-b-2xl">
          <Pagination
            totalCount={totalCount}
            indexOfFirstItem={(currentPage - 1) * itemsPerPage}
            indexOfLastItem={Math.min(currentPage * itemsPerPage, totalCount)}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
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
      </div>

      {/* Admin Notice Area */}
      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-700">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Administrative Override</p>
          <p className="text-[11px] text-amber-800/80 font-medium leading-relaxed">
            Changes to the PayPal business email are applied system-wide. This will affect all new orders, invoices, and automated payment links. Please exercise caution.
          </p>
        </div>
      </div>
    </div>
  );
}
