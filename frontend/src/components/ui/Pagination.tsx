import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface PaginationProps {
  totalCount: number;
  indexOfFirstItem: number;
  indexOfLastItem: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  itemsPerPageOptions?: number[];
  className?: string;
}

export function Pagination({
  totalCount,
  indexOfFirstItem,
  indexOfLastItem,
  itemsPerPage,
  currentPage,
  totalPages,
  isLoading = false,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50],
  className = ""
}: PaginationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className={`py-2.5 px-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 flex-wrap gap-4 ${className}`}>
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
              {itemsPerPageOptions.map(value => (
                <button
                  key={value}
                  onClick={() => {
                    onItemsPerPageChange(value);
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
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}
            className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white disabled:opacity-40 transition-all shadow-md shadow-cyan-200 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-500 font-bold px-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || isLoading}
            className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white disabled:opacity-40 transition-all shadow-md shadow-cyan-200 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
