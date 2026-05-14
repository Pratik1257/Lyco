import { Calendar, Globe, ChevronDown } from 'lucide-react';

interface FxGlobalFiltersProps {
  timeframe: string;
  setTimeframe: (val: string) => void;
  currency: string;
  setCurrency: (val: string) => void;
  isAdmin?: boolean;
}

export default function FxGlobalFilters({ 
  timeframe, 
  setTimeframe, 
  currency, 
  setCurrency,
  isAdmin = true
}: FxGlobalFiltersProps) {
  const timeframes = ['Week', 'Month', 'Year'];
  const currencies = ['USD', 'GBP', 'EUR', 'AUD'];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {/* Timeframe Filter (Segmented Control) */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 p-1 rounded-2xl shadow-sm flex items-center">
          {timeframes.map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                timeframe === t 
                  ? 'bg-cyan-500 text-white shadow-[0_4px_12px_rgba(6,182,212,0.3)]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Currency Filter (Dropdown) */}
        {isAdmin && (
          <div className="relative group">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm cursor-pointer hover:border-cyan-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
                  <Globe size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Currency</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-gray-800">{currency}</span>
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-cyan-500 transition-colors" />
                  </div>
                </div>
              </div>
              
              <div className="absolute right-0 top-full mt-5 w-32 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden py-1">
                {currencies.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${
                      currency === c ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
          </div>
        )}

        <div className="h-10 w-px bg-gray-100 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d1525] rounded-2xl shadow-lg border border-white/5">
          <Calendar size={16} className="text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-tight">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
