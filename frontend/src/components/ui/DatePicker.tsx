import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

interface DatePickerProps {
  value: string;                          // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  direction?: 'up' | 'down';
  align?: 'left' | 'right';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number) { return n.toString().padStart(2, '0'); }

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', error, className = '', direction = 'down', align = 'left' }: DatePickerProps) {
  const today = useMemo(() => new Date(), []);
  const parsed = useMemo(() => (value ? new Date(value + 'T00:00:00') : null), [value]);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());
  const [showYearGrid, setShowYearGrid] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowYearGrid(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync view when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [parsed]);

  const prevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
    }

    // Next month fill
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const selectDate = (day: number, month: number, year: number) => {
    onChange(toDateStr(year, month, day));
    setOpen(false);
    setShowYearGrid(false);
  };

  const goToday = () => {
    const t = new Date();
    onChange(toDateStr(t.getFullYear(), t.getMonth(), t.getDate()));
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setOpen(false);
    setShowYearGrid(false);
  };

  const clearDate = () => {
    onChange('');
  };

  // Year grid
  const yearRange = useMemo(() => {
    const base = Math.floor(viewYear / 12) * 12;
    return Array.from({ length: 12 }, (_, i) => base + i);
  }, [viewYear]);

  const displayValue = parsed
    ? parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  const isToday = (day: number, month: number, year: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isSelected = (day: number, month: number, year: number) =>
    parsed != null &&
    day === parsed.getDate() &&
    month === parsed.getMonth() &&
    year === parsed.getFullYear();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setShowYearGrid(false); }}
        className={`w-full h-10 px-4 bg-white border rounded-xl text-sm font-medium text-left flex items-center gap-3 transition-all outline-none
          ${error ? 'border-red-500 ring-4 ring-red-500/5' : 'border-slate-200 hover:border-cyan-400 focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500'}
          ${open ? 'ring-4 ring-cyan-500/10 border-cyan-500' : ''}`}
      >
        <Calendar size={16} className={`shrink-0 ${displayValue ? 'text-cyan-600' : 'text-slate-300'}`} />
        <span className={displayValue ? 'text-slate-800 flex-1' : 'text-slate-400 flex-1'}>{displayValue || placeholder}</span>
        {displayValue && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); clearDate(); }}
            className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X size={12} className="text-slate-400" />
          </span>
        )}
      </button>

      {/* Dropdown Calendar */}
      {open && (
        <div className={`absolute z-50 w-[280px] bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden animate-in fade-in duration-200
          ${align === 'right' ? 'right-0' : 'left-0'}
          ${direction === 'up' 
            ? 'bottom-full mb-2 slide-in-from-bottom-2' 
            : 'top-full mt-2 slide-in-from-top-2'}`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setShowYearGrid(sg => !sg)}
              className="text-white font-bold text-xs hover:bg-white/15 px-2 py-1 rounded-lg transition-colors"
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {showYearGrid ? (
            /* ── Year/Month Picker ── */
            <div className="p-3">
              {/* Year navigation */}
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setViewYear(y => y - 12)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{yearRange[0]} – {yearRange[yearRange.length - 1]}</span>
                <button type="button" onClick={() => setViewYear(y => y + 12)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {yearRange.map(yr => (
                  <button
                    type="button"
                    key={yr}
                    onClick={() => { setViewYear(yr); }}
                    className={`py-2 rounded-xl text-sm font-semibold transition-all
                      ${yr === viewYear
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                        : yr === today.getFullYear()
                          ? 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100'
                          : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
              {/* Month grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {MONTH_NAMES.map((mn, idx) => (
                  <button
                    type="button"
                    key={mn}
                    onClick={() => { setViewMonth(idx); setShowYearGrid(false); }}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all
                      ${idx === viewMonth && viewYear === (parsed?.getFullYear() ?? -1)
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                        : idx === today.getMonth() && viewYear === today.getFullYear()
                          ? 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100'
                          : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {mn.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Calendar Grid ── */
            <div className="p-3">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 py-1">
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((cell, i) => {
                  const selected = isSelected(cell.day, cell.month, cell.year);
                  const todayCell = isToday(cell.day, cell.month, cell.year);
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => selectDate(cell.day, cell.month, cell.year)}
                      className={`relative w-full aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150
                        ${!cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'}
                        ${selected ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 font-bold hover:from-cyan-400 hover:to-blue-500 hover:text-white' : ''}
                        ${todayCell && !selected ? 'ring-2 ring-cyan-500/40 font-bold text-cyan-700' : ''}`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={clearDate}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={goToday}
              className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
