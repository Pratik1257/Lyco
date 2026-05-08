import { useState, useRef, useEffect } from 'react';
import { Settings, Menu } from 'lucide-react';
import SettingsPanel from './panels/SettingsPanel';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, subtitle, onMenuToggle }: HeaderProps) {
  const [activePanel, setActivePanel] = useState<'settings' | null>(null);

  const bellRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const togglePanel = (panel: 'settings') => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activePanel &&
        bellRef.current && !bellRef.current.contains(event.target as Node) &&
        settingsRef.current && !settingsRef.current.contains(event.target as Node)
      ) {
        setActivePanel(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePanel]);

  return (
    <header className="fixed top-0 left-0 lg:left-[260px] right-0 h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 z-40 transition-all duration-300">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 -ml-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-800">{title}</h1>
          {subtitle && (
            <>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <span className="text-xs text-gray-400 hidden sm:inline">{subtitle}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Settings Icon & Panel */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => togglePanel('settings')}
            className={`p-2 rounded-lg transition-colors ${activePanel === 'settings' ? 'bg-gray-100' : 'hover:bg-gray-100'
              }`}
          >
            <Settings size={18} className={activePanel === 'settings' ? 'text-[#1D9E75]' : 'text-gray-500'} />
          </button>

          <SettingsPanel
            isOpen={activePanel === 'settings'}
            onClose={() => setActivePanel(null)}
          />
        </div>
      </div>
    </header>
  );
}
