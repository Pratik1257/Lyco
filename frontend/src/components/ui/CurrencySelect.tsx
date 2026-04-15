import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  symbol: string;
  name: string;
}

interface CurrencySelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
}

export default function CurrencySelect({ value, onChange, options }: CurrencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => options.find(o => o.value === value), [options, value]);

  const filteredOptions = useMemo(() => 
    options.filter(o => 
      o.label.toLowerCase().includes(searchText.toLowerCase()) || 
      o.name.toLowerCase().includes(searchText.toLowerCase()) ||
      o.value.toLowerCase().includes(searchText.toLowerCase())
    ),
    [options, searchText]
  );

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 240; // Max height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Flip check
    const shouldFlip = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      top: shouldFlip ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
      zIndex: 99999,
      maxHeight: dropdownHeight,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setSearchText('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Format label string (assuming it's like "🇺🇸, USD, US dollar" in format)
  const extractFlag = (labelStr: string) => {
    const parts = labelStr.split(', ');
    return parts[0] || '🏳️';
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 h-[42px] bg-white border ${isOpen ? 'border-[#06b6d4] ring-2 ring-[#06b6d4]/20' : 'border-gray-200 hover:border-gray-300'} rounded-[20px] transition-all focus:outline-none`}
      >
        {selectedOption ? (
           <div className="flex items-center gap-2">
             <span className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-50 text-cyan-600 text-xs font-bold border border-cyan-100/50">
               {extractFlag(selectedOption.label)}
             </span>
             <span className="font-bold text-gray-900 text-[13px]">{selectedOption.value}</span>
             <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider truncate hidden sm:inline">— {selectedOption.name}</span>
           </div>
        ) : (
           <span className="text-gray-400 font-medium text-[13px]">Choose currency</span>
        )}
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="p-2 border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-medium"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto p-1 flex-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      isSelected ? 'bg-cyan-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-base font-bold shadow-sm ${
                      isSelected ? 'bg-cyan-600 text-white' : 'bg-white border border-gray-200'
                    }`}>
                      {extractFlag(opt.label)}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden text-left">
                      <span className={`text-[13px] font-bold tracking-tight ${isSelected ? 'text-cyan-900' : 'text-gray-900'}`}>
                        {opt.value}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest truncate w-full ${isSelected ? 'text-cyan-700/70' : 'text-gray-400'}`}>
                        {opt.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="ml-auto">
                        <div className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-cyan-100 text-cyan-700">
                          Selected
                        </div>
                      </div>
                    )}
                  </button>
                )
              })
            ) : (
              <div className="p-6 text-center text-gray-400 text-[13px] font-medium">
                No currencies found.
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
