import { useState, useMemo, useRef, memo } from 'react';
import Select, { components } from 'react-select';
import type { MenuProps, StylesConfig, Props as SelectProps } from 'react-select';
import { Search } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomProps {
  searchText: string;
  setSearchText: (val: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  menuAlign?: 'left' | 'right';
  setMenuIsOpen: (val: boolean) => void;
  menuIsOpen: boolean;
}

// Extend react-select's props to include customProps
interface ExtendedSelectProps extends SelectProps<Option, false> {
  customProps: CustomProps;
}

interface CustomSelectProps {
  label?: string;
  options: Option[];
  value: string | number | '';
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  maxMenuHeight?: number;
  menuPlacement?: 'auto' | 'bottom' | 'top';
  menuAlign?: 'left' | 'right';
  error?: string;
  isDisabled?: boolean;
}

// Custom Selected Value rendering (collapsed state)
const CustomSingleValue = (props: any) => {
  const parts = props.data.label.split(', ');
  if (parts.length >= 3) {
    const [symbol, code, name] = parts;
    return (
      <components.SingleValue {...props}>
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-50 text-cyan-600 text-xs font-bold border border-cyan-100/50">
            {symbol}
          </span>
          <span className="font-bold text-gray-900 text-sm tracking-tight">{code}</span>
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider hidden sm:inline">— {name}</span>
        </div>
      </components.SingleValue>
    );
  }
  return <components.SingleValue {...props} />;
};

// Defined OUTSIDE the component so it never re-creates and loses focus
const areOptionsEqual = (prevProps: any, nextProps: any) => {
  return prevProps.isFocused === nextProps.isFocused && prevProps.isSelected === nextProps.isSelected;
};

const CustomOption = memo((props: any) => {
  const parts = props.label.split(', ');
  const isSelected = props.isSelected;
  const isFocused = props.isFocused;

  // Logic for color contrast
  const showWhiteText = isFocused; // When focused, we use a dark background, so text MUST be white

  // If we have a rich-text label (Symbol, Code, Name)
  if (parts.length >= 3) {
    const [symbol, code, name] = parts;
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-3 py-0.5">
          {/* Visual Badge for Symbol */}
          <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base font-bold transition-all duration-200 ${isFocused
            ? 'bg-white/20 text-white scale-110 shadow-lg'
            : isSelected
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-cyan-50 text-cyan-600 shadow-sm border border-cyan-100/50'
            }`}>
            {symbol}
          </div>

          {/* Multi-line Identifier */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold tracking-tight truncate ${showWhiteText ? 'text-white' : 'text-gray-900'
                }`}>
                {code}
              </span>
              {isSelected && !isFocused && (
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              )}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest truncate ${showWhiteText ? 'text-cyan-50/80' : 'text-gray-400'
              }`}>
              {name}
            </span>
          </div>

          {/* Selection Detail */}
          {isSelected && (
            <div className="ml-auto">
              <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${isFocused ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-700'
                }`}>
                Selected
              </div>
            </div>
          )}
        </div>
      </components.Option>
    );
  }

  // Fallback for standard items
  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between">
        <span className={`font-medium ${isFocused ? 'text-white' : 'text-gray-900'}`}>{props.label}</span>
        {isSelected && (
          <div className={`w-2 h-2 rounded-full ${isFocused ? 'bg-white' : 'bg-cyan-500'}`} />
        )}
      </div>
    </components.Option>
  );
}, areOptionsEqual);

// Defined OUTSIDE the component so it never re-creates and loses focus
const CustomMenu = (props: MenuProps<Option, false>) => {
  const { searchText, setSearchText, searchInputRef } =
    (props.selectProps as unknown as ExtendedSelectProps).customProps;

  return (
    <components.Menu {...props}>
      <div className="p-2 border-b border-gray-100 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-medium text-gray-800"
          />
        </div>
      </div>
      {props.children}
    </components.Menu>
  );
};

// Custom Control to handle reliable toggling
const CustomControl = (props: any) => {
  const { setMenuIsOpen, menuIsOpen } = props.selectProps.customProps;
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (menuIsOpen) {
      e.preventDefault();
      e.stopPropagation();
      setMenuIsOpen(false);
    } else {
      // Let react-select handle opening
      if (props.innerProps.onMouseDown) {
        props.innerProps.onMouseDown(e);
      }
    }
  };

  return (
    <components.Control
      {...props}
      innerProps={{
        ...props.innerProps,
        onMouseDown: handleMouseDown
      }}
    />
  );
};

export default function CustomSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select Option',
  required = false,
  maxMenuHeight = 230,
  menuPlacement = 'auto',
  menuAlign = 'left',
  error,
  isDisabled = false
}: CustomSelectProps) {
  const [searchText, setSearchText] = useState('');
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  );

  const filteredOptions = useMemo(
    () =>
      options.filter((opt) =>
        (opt.label || '').toLowerCase().includes(searchText.toLowerCase())
      ),
    [options, searchText]
  );

  const customStyles: StylesConfig<Option, false> = {
    control: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused || state.selectProps.menuIsOpen ? '#ffffff' : '#f9fafb',
      borderColor: error ? '#ef4444' : (state.isFocused || state.selectProps.menuIsOpen ? '#06b6d4' : '#e5e7eb'),
      boxShadow: error 
        ? '0 0 0 4px rgba(239, 68, 68, 0.1)' 
        : (state.isFocused || state.selectProps.menuIsOpen ? '0 0 0 4px rgba(6, 182, 212, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'),
      borderRadius: '0.5rem',
      padding: '0px',
      minHeight: '40px',
      height: '40px',
      fontSize: '0.875rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      borderWidth: '1.5px',
      '&:hover': {
        borderColor: error ? '#ef4444' : (state.isFocused || state.selectProps.menuIsOpen ? '#06b6d4' : '#d1d5db'),
        transform: (state.isFocused || state.selectProps.menuIsOpen) ? 'none' : 'translateY(-1px)',
        boxShadow: error
          ? '0 0 0 4px rgba(239, 68, 68, 0.1)'
          : (state.isFocused || state.selectProps.menuIsOpen)
            ? '0 0 0 4px rgba(6, 182, 212, 0.1)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0px 10px',
      height: '100%',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontWeight: 500,
    }),
    singleValue: (base) => ({
      ...base,
      color: '#1f2937',
    }),
    menu: (base, state) => ({
      ...base,
      borderRadius: '1.25rem',
      backgroundColor: '#ffffff',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      border: 'none',
      overflow: 'hidden',
      zIndex: 9999,
      marginTop: '8px',
      position: 'absolute',
      width: 'max-content',
      minWidth: '100%',
      ...(((state.selectProps as unknown as ExtendedSelectProps).customProps?.menuAlign === 'right') ? { right: 0 } : { left: 0 }),
      animation: 'select-menu-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      maxHeight: `${maxMenuHeight}px`,
      '&::-webkit-scrollbar': {
        width: '4px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#e5e7eb',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#d1d5db',
        borderRadius: '10px',
      },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      padding: '6px 10px',
      margin: '1px 0',
      borderRadius: '0.65rem',
      fontSize: '0.875rem',
      cursor: 'pointer',
      backgroundColor: state.isFocused
        ? '#0891b2'
        : state.isSelected
          ? '#ecfeff'
          : 'transparent',
      color: state.isFocused
        ? '#ffffff'
        : state.isSelected
          ? '#0891b2'
          : '#4b5563',
      '&:active': {
        backgroundColor: state.isSelected ? '#ecfeff' : '#0e7490',
      }
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: '#9ca3af',
      transition: 'transform 0.3s ease',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'none',
      padding: '8px',
      '&:hover': {
        color: '#6b7280',
      }
    }),
  };

  const ExtendedSelect = Select as unknown as React.ComponentType<ExtendedSelectProps>;

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label className="block text-[13px] font-semibold text-slate-900 ml-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className={error ? 'animate-shake' : ''}>
        <ExtendedSelect
          options={filteredOptions}
          value={selectedOption}
          onChange={(option) => {
            onChange(option ? option.value : '');
            setMenuIsOpen(false);
            setSearchText('');
          }}
          placeholder={placeholder}
          styles={customStyles}
          isSearchable={false}
          isDisabled={isDisabled}
          menuIsOpen={menuIsOpen}
          maxMenuHeight={maxMenuHeight}
          filterOption={null}
          onMenuOpen={() => {
            setMenuIsOpen(true);
            setSearchText('');
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          onMenuClose={() => {
            // Slight delay to check where focus went
            setTimeout(() => {
              if (document.activeElement !== searchInputRef.current) {
                setMenuIsOpen(false);
              }
            }, 150);
          }}
          customProps={{ searchText, setSearchText, searchInputRef, menuAlign, setMenuIsOpen, menuIsOpen }}
          components={{ 
            Menu: CustomMenu, 
            Option: CustomOption, 
            SingleValue: CustomSingleValue,
            Control: CustomControl
          }}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
          menuPlacement={menuPlacement}
          noOptionsMessage={() => (
            <div className="p-8 text-center bg-gray-50 rounded-xl m-2">
              <Search className="mx-auto text-gray-300 mb-2" size={24} />
              <div className="text-sm font-bold text-gray-500">No results found</div>
              <div className="text-[11px] text-gray-400">Try searching for something else</div>
            </div>
          )}
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-[11px] font-medium text-red-500 leading-none">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}