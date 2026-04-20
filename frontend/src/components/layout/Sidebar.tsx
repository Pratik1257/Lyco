import { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  ShoppingCart, FileText, CreditCard, Receipt,
  Users, UserCog, Building2, Tag, Megaphone, Lock, LayoutGrid, ChevronDown, type LucideIcon
} from 'lucide-react';
import lycoLogo from '../../assets/LycoLogo.png';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  subItems?: { to: string; label: string }[];
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'MAIN',
    items: [
      { to: '/', icon: LayoutGrid, label: 'Dashboard' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/orders', icon: ShoppingCart, label: 'Manage Orders', badge: 10 },
      { to: '/quotes', icon: FileText, label: 'Manage Quote' },
      { to: '/payments', icon: CreditCard, label: 'Manage Payment' },
      { to: '/invoices', icon: Receipt, label: 'Manage Invoice' },
      { to: '/expenses', icon: Receipt, label: 'Manage Expenses' },
    ],
  },
  {
    label: 'PEOPLE',
    items: [
      { 
        to: '/customers', 
        icon: Users, 
        label: 'Manage Customers',
        subItems: [
          { to: '/customers/status', label: 'Customer Summary' },
          { to: '/customers/card-summary', label: 'Card Summary' },
          // { to: '/customers/card-details', label: 'Customer Card Details' }
        ]
      },
      { to: '/employees', icon: UserCog, label: 'Manage Employee' },
      { to: '/vendors', icon: Building2, label: 'Manage Vendor' },
    ],
  },
  {
    label: 'CATALOGUE',
    items: [
       { to: '/services', icon: Tag, label: 'Manage Service' },
      { to: '/prices', icon: Tag, label: 'Manage Price' },
      { to: '/promotions', icon: Megaphone, label: 'Manage Promotion' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { to: '/change-password', icon: Lock, label: 'Change Password' },
    ],
  },
];

function SidebarItem({ item, onClose }: { item: NavItem; onClose?: () => void }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const isExactActive = item.to === '/' ? location.pathname === '/' : location.pathname === item.to;
  const isSubActive = item.subItems?.some(s => location.pathname.startsWith(s.to)) || false;
  const isActive = isExactActive || isSubActive || (item.to !== '/' && location.pathname.startsWith(item.to) && !item.subItems);

  if (item.subItems) {
    // If it has subItems, we show a button instead of a direct link, which toggles the submenu
    return (
      <div className="mb-0.5">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-medium group ${
            isActive ? 'text-white' : 'text-[#8892b0] hover:text-white'
          }`}
        >
          {isActive && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0891b2]/25 via-[#06b6d4]/15 to-transparent" />
          )}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-[#06b6d4] to-[#0891b2]" />
          )}
          {!isActive && (
            <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/5 transition-colors" />
          )}
          
          <div className="flex items-center gap-3 relative z-10">
            <div className={`relative shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              isActive
                ? 'bg-gradient-to-br from-[#0891b2] to-[#06b6d4] shadow-lg shadow-cyan-500/30'
                : 'bg-white/5 group-hover:bg-white/10'
            }`}>
              <item.icon size={14} className={isActive ? 'text-white' : 'text-[#8892b0] group-hover:text-white'} />
            </div>
            <span>{item.label}</span>
          </div>

          <ChevronDown 
            size={14} 
            className={`relative z-10 transition-transform duration-200 text-[#8892b0] group-hover:text-white ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="mt-1 ml-[44px] space-y-1 animate-in slide-in-from-top-2 duration-200 border-l border-white/10 pl-2">
            {item.subItems.map((subItem) => (
              <NavLink
                key={subItem.to}
                to={subItem.to}
                onClick={onClose}
                className={({ isActive: subIsActive }) => `block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  subIsActive ? 'text-[#06b6d4] bg-white/5' : 'text-[#8892b0] hover:text-white hover:bg-white/5'
                }`}
              >
                {subItem.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink to={item.to} className="block" onClick={onClose}>
      <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 text-[13px] font-medium group ${
        isActive ? 'text-white' : 'text-[#8892b0] hover:text-white'
      }`}>
        {/* Active gradient background */}
        {isActive && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0891b2]/25 via-[#06b6d4]/15 to-transparent" />
        )}
        {/* Active left bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-[#06b6d4] to-[#0891b2]" />
        )}
        {/* Hover background */}
        {!isActive && (
          <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/5 transition-colors" />
        )}

        <div className={`relative shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
          isActive
            ? 'bg-gradient-to-br from-[#0891b2] to-[#06b6d4] shadow-lg shadow-cyan-500/30'
            : 'bg-white/5 group-hover:bg-white/10'
        }`}>
          <item.icon size={14} className={isActive ? 'text-white' : 'text-[#8892b0] group-hover:text-white'} />
        </div>

        <span className="relative flex-1">{item.label}</span>

        {item.badge != null && (
          <span className="relative text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#0891b2] to-[#06b6d4]">
            {item.badge}
          </span>
        )}
      </div>
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#0d1525]/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar Wrapper */}
      <aside className={`fixed top-0 left-0 h-screen w-[260px] flex flex-col z-50 bg-[#0d1525] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f35]/80 via-transparent to-[#0a0f1e]/60 pointer-events-none" />

      {/* Logo */}
      <div className="relative h-[60px] flex items-center px-5 border-b border-white/[0.06] bg-[#10192a]">
        
        <Link to="/" className="flex items-center px-1">
          <img 
            src={lycoLogo} 
            alt="Lyco Designs" 
            className="h-[44px] w-auto object-contain drop-shadow-md mix-blend-lighten" 
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-1 sidebar-scrollbar">
        {navSections.map((section) => (
          <div key={section.label} className="mb-3">
            <div className="flex items-center gap-2 px-3 mb-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="text-[9px] font-bold text-[#3a4a6a] uppercase tracking-widest shrink-0">
                {section.label}
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            {section.items.map((item) => (
              <SidebarItem key={item.to} item={item} onClose={onClose} />
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="relative border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3 px-1">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-sm" />
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#0891b2] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-cyan-500/30">
              SP
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">Snehal Patel</p>
            <p className="text-[#3a4a6a] text-[10px]">Administrator</p>
          </div>
          <Lock size={13} className="text-[#3a4a6a] shrink-0" />
        </div>
      </div>
    </aside>
    </>
  );
}
