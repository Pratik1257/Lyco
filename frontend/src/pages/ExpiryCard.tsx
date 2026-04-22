import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, AlertCircle, Trash2, CreditCard, Search, Eye, EyeOff, X, User, Mail, Phone, Building2, ShieldCheck, Mail as MailIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { cardsApi, type CardDetail } from '../api/cardsApi';

import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import CustomSelect from '../components/ui/CustomSelect';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';

export default function ExpiryCard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');

  // UI State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<CardDetail | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [cardToView, setCardToView] = useState<CardDetail | null>(null);
  const [showFullCardNumber, setShowFullCardNumber] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Fetch Cards
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cards', currentPage, itemsPerPage, searchQuery, statusFilter],
    queryFn: () => cardsApi.getCards(currentPage, itemsPerPage, searchQuery, statusFilter),
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

  const handleViewClick = (card: CardDetail) => {
    setCardToView(card);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setCardToView(null);
    setShowFullCardNumber(false);
    setIsFlipped(false);
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

  const formatFullCardNumber = (cardNo: string | null) => {
    if (!cardNo) return '--';
    // Remove any existing spaces and group by 4 digits
    return cardNo.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
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
        {!expired ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const CardSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          {/* <TableCell><div className="h-5 bg-gray-200 rounded-lg w-12 shadow-sm"></div></TableCell> */}
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-20 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-32 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-24 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-28 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-16 shadow-sm"></div></TableCell>
          <TableCell><div className="h-5 bg-gray-200 rounded-lg w-20 shadow-sm mx-auto"></div></TableCell>
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
            placeholder="Search by name or company..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="w-[180px]">
            <CustomSelect
              label=""
              value={statusFilter}
              onChange={(val: string) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Cards' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              placeholder="Status"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/customers/card-details')}
          >
            <Plus size={18} />
            Add Card Details
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead className="whitespace-nowrap">Client Id</TableHead> */}
                <TableHead className="whitespace-nowrap">Username</TableHead>
                <TableHead className="whitespace-nowrap">Company Name</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Telephone</TableHead>
                <TableHead className="whitespace-nowrap">Expiry Date</TableHead>
                <TableHead className="whitespace-nowrap text-center">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <CardSkeleton />
              ) : cards.length > 0 ? (
                cards.map((card) => (
                  <TableRow key={card.cardId} className="group hover:bg-gray-50/50">
                    {/* <TableCell className="text-sm font-bold text-gray-700 whitespace-nowrap">{card.userId || '--'}</TableCell> */}
                    <TableCell className="text-sm font-semibold text-gray-800 whitespace-nowrap">{card.username || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{card.companyName || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{card.email || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{card.telephone || '--'}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{card.expDate || '--'}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {getStatusBadge(card.expDate)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost-cyan"
                          size="icon"
                          onClick={() => handleViewClick(card)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
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

      {/* View Card Modal */}
      {isViewModalOpen && cardToView && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={closeViewModal}
          />

          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">
            {/* Header with Gradient */}
            <div className="relative h-24 bg-gradient-to-br from-[#0891b2] to-[#06b6d4] flex items-center px-8">
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={closeViewModal}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <CreditCard size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">Card & Client Details</h3>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Summary View</p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8 space-y-8">
              {/* Card Visualization */}
              {/* 3D Flip Card Container */}
              <div 
                className="perspective-1000 w-full h-[200px] cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                  
                  {/* FRONT SIDE */}
                  <div className="absolute inset-0 backface-hidden">
                    <div className="relative h-full p-6 rounded-2xl bg-[#0d1525] text-white overflow-hidden shadow-xl shadow-gray-200 border border-white/5">
                      <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl" />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{cardToView.cardType || 'Credit Card'}</span>
                          <ShieldCheck size={20} className="text-cyan-400" />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-xl font-mono tracking-[0.2em] drop-shadow-md">
                              {showFullCardNumber ? formatFullCardNumber(cardToView.cardNo) : maskCardNumber(cardToView.cardNo)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFullCardNumber(!showFullCardNumber);
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                              title={showFullCardNumber ? "Hide Card Number" : "Show Card Number"}
                            >
                              {showFullCardNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>

                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <span className="text-[8px] uppercase tracking-widest text-white/40 block font-bold">Card Holder</span>
                              <span className="text-[13px] font-bold uppercase tracking-wide">{cardToView.username || '--'}</span>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="text-[8px] uppercase tracking-widest text-white/40 block font-bold">Expires</span>
                              <span className="text-[13px] font-bold tracking-tight">{cardToView.expDate || '--'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="relative h-full rounded-2xl bg-[#0d1525] text-white overflow-hidden shadow-xl shadow-gray-200 border border-white/5 flex flex-col">
                      {/* Magnetic Stripe */}
                      <div className="w-full h-11 bg-gray-950 mt-6 shadow-inner" />
                      
                      {/* Signature & CVV Area */}
                      <div className="px-6 mt-6">
                        <div className="flex items-center gap-0">
                          <div className="flex-1 h-9 bg-gray-200/10 flex items-center px-4 rounded-l-md border-y border-l border-white/5">
                            <span className="text-[7px] uppercase tracking-widest text-white/30 font-bold">Authorized Signature</span>
                          </div>
                          <div className="w-14 h-9 bg-white flex items-center justify-center -skew-x-6 shadow-lg rounded-sm transform translate-x-1">
                            <span className="text-black font-mono italic font-black text-sm tracking-widest">
                              {cardToView.cvv || '***'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Legal Text */}
                      <div className="mt-auto p-6 pt-0 space-y-2">
                        <p className="text-[6.5px] text-white/30 leading-tight uppercase tracking-wider text-center max-w-[280px] mx-auto">
                          This card is property of Lyco Designs Financial Services. Use constitutes acceptance of terms. 
                          If found, please return to any Lyco branch.
                        </p>
                        <div className="flex justify-between items-center opacity-20">
                          <div className="w-6 h-4 border border-white/50 rounded-sm" />
                          <CreditCard size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Info Grid */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                    <User size={14} className="text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Username</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{cardToView.username || '--'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">ID</p>
                    <p className="text-sm font-bold text-gray-900">#{cardToView.userId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                    <Building2 size={14} className="text-[#8892b0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Company</p>
                    <p className="text-sm font-semibold text-gray-700 truncate">{cardToView.companyName || '--'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <Phone size={14} className="text-[#8892b0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Phone</p>
                      <p className="text-xs font-semibold text-gray-700 truncate">{cardToView.telephone || '--'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <MailIcon size={14} className="text-[#8892b0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-xs font-semibold text-gray-700 truncate">{cardToView.email || '--'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions / Footer */}
            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
              <Button
                variant="primary"
                className="w-full py-3 rounded-2xl shadow-lg shadow-cyan-500/20"
                onClick={closeViewModal}
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
