import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/':             { title: 'Dashboard',      subtitle: 'statistics and more' },
  '/dashboard-fx': { title: 'Dashboard FX',   subtitle: 'futuristic view' },
  '/orders':       { title: 'Manage Orders',  subtitle: 'view and manage orders' },
  '/quotes':       { title: 'Manage Quotes',  subtitle: 'quote requests' },
  '/payments':     { title: 'Manage Payments',subtitle: 'payment records' },
  '/invoices':     { title: 'Manage Invoices',subtitle: 'invoice history' },
  '/customers':    { title: 'Customers',      subtitle: 'manage customers' },
  '/employees':    { title: 'Employees',      subtitle: 'manage employees' },
  '/vendors':      { title: 'Vendors',        subtitle: 'manage vendors' },
  '/services':     { title: 'Manage Services',subtitle: 'view and manage services' },
  '/prices':       { title: 'Manage Prices',  subtitle: 'pricing catalogue' },
  '/promotions':   { title: 'Promotions',     subtitle: 'manage promotions' },
};

import { useState } from 'react';

export default function Layout() {
  const { pathname } = useLocation();
  const meta = pageMeta[pathname] ?? { title: 'Dashboard', subtitle: '' };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <Header 
        title={meta.title} 
        subtitle={meta.subtitle} 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />
      <main className="lg:ml-[260px] pt-[60px] min-h-screen transition-all duration-300">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
