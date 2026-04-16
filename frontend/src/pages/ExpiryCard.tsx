import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, AlertCircle, Trash2, CreditCard, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { cardsApi, type CardDetail } from '../api/cardsApi';

import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';

export default function ExpiryCard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // UI State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<CardDetail | null>(null);

  // Fetch Cards
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cards', currentPage, itemsPerPage, searchQuery],
    queryFn: () => cardsApi.getCards(currentPage, itemsPerPage, searchQuery),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => cardsApi.deleteCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      closeDeleteModal();
      toast.success('Card details deleted successfully.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message;
      setCardToDelete(null);
      setIsDeleteModalOpen(false);
      toast.error(`Failed to delete card: ${msg}`);
    }
  });

  // Handlers
  const handleDeleteClick = (card: CardDetail) => {
    setCardToDelete(card);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (cardToDelete) {
      deleteMutation.mutate(cardToDelete.cardId);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCardToDelete(null);
  };

  // Derived Values
  const cards = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const safeCurrentPage = data?.page ?? 1;

  const indexOfFirstItem = (safeCurrentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + cards.length;

  const maskCardNumber = (cardNo: string | null) => {
    if (!cardNo) return '--';
    if (cardNo.length < 4) return cardNo;
    return `**** **** **** ${cardNo.slice(-4)}`;
  };

  const isExpired = (expDate: string | null) => {
    if (!expDate) return false;
    try {
      const [month, year] = expDate.split('/').map(Number);
      if (!month || !year) return false;

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      if (year < currentYear) return true;
      if (year === currentYear && month < currentMonth) return true;
      return false;
    } catch {
      return false;
    }
  };

  const getStatusBadge = (expDate: string | null) => {
    if (!expDate) return <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-gray-100 text-gray-500">Unknown</span>;
    const expired = isExpired(expDate);
    return (
      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${!expired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {!expired ? 'Valid' : 'Expired'}
      </span>
    );
  };

  const CardSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-12 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-20 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-32 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-28 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-16 shadow-sm"></div></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-lg shadow-sm"></div>
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
          <p className="text-sm font-medium">Failed to fetch cards: {(error as Error).message}</p>
        </div>
      )}

      {/* Page Header */}


      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="py-2.5 px-6 border-b border-gray-100 flex items-center justify-between gap-4">
          <SearchBar
            containerClassName="flex-1 max-w-md"
            placeholder="Search by username or card no..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Button
            variant="primary"
            onClick={() => navigate('/customers/card-details')}
          >
            <Plus size={18} />
            Add Card Details
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative min-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Card Id</TableHead>
                <TableHead className="whitespace-nowrap">Username</TableHead>
                <TableHead className="whitespace-nowrap">Card Type</TableHead>
                <TableHead className="whitespace-nowrap">Card No.</TableHead>
                <TableHead className="whitespace-nowrap">Expiry Date</TableHead>
                <TableHead className="whitespace-nowrap">Holder Name</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <CardSkeleton />
              ) : cards.length > 0 ? (
                cards.map((card) => (
                  <TableRow key={card.cardId} className="group hover:bg-gray-50/50">
                    <TableCell className="text-sm font-bold text-gray-700 whitespace-nowrap">{card.cardId}</TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800 whitespace-nowrap">{card.username || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <CreditCard size={14} className="text-gray-400" />
                        {card.cardType || '--'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-800 whitespace-nowrap font-mono">{maskCardNumber(card.cardNo)}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{card.expDate || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">{`${card.firstName || ''} ${card.lastName || ''}`.trim() || '--'}</TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(card.expDate)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost-cyan"
                          size="icon"
                          onClick={() => navigate(`/customers/card-details?id=${card.cardId}`)}
                          title="Edit Card"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost-red"
                          size="icon"
                          onClick={() => handleDeleteClick(card)}
                          title="Delete Card"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-500">No cards found.</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or add a new card.</p>
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

              <h3 className="text-xl font-black text-gray-900 mb-3">Delete Card Details</h3>
              <p className="text-sm text-gray-500 leading-relaxed px-2 font-medium">
                Are you sure you want to delete card <span className="font-bold text-gray-900">"{maskCardNumber(cardToDelete?.cardNo || '')}"</span>? This action cannot be undone.
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
