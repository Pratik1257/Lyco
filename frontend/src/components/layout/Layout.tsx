import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/':             { title: 'Dashboard',      subtitle: 'statistics and more' },
  '/dashboard-fx': { title: 'Dashboard FX',   subtitle: 'futuristic view' },
  '/orders/new':   { title: 'Manage Orders',  subtitle: 'Place New Order' },
  '/orders/summary':{ title: 'Manage Orders', subtitle: 'Order Summary' },
  '/orders/complete':{ title: 'Manage Orders',subtitle: 'Complete an Order' },
  '/orders/remove': { title: 'Manage Orders', subtitle: 'Remove an Order' },
  '/orders':       { title: 'Manage Orders',  subtitle: 'view and manage orders' },
  '/quotes':       { title: 'Manage Quote',   subtitle: 'quote requests' },
  '/payments':     { title: 'Manage Payments',subtitle: 'payment records' },
  '/invoices':     { title: 'Manage Invoice', subtitle: 'invoice history' },
  '/customers/status':       { title: 'Manage Customers', subtitle: 'Customer Status' },
  '/customers/card-summary': { title: 'Manage Customers', subtitle: 'Card Details (Duration - Next Six months)' },
  '/customers/card-details': { title: 'Manage Customers', subtitle: 'Add Customer Cards Details' },
  '/customers/add-two':      { title: 'Manage Customers', subtitle: 'Add Customer Details' },
  '/customers/add-three':    { title: 'Manage Customers', subtitle: 'Add Customer' },
  '/customers':    { title: 'Manage Customers', subtitle: 'manage customers' },
  '/employees':    { title: 'Manage Employee', subtitle: 'manage employees' },
  '/vendors':      { title: 'Manage Vendor',   subtitle: 'manage vendors' },
  '/services':     { title: 'Manage Service',  subtitle: 'view and manage services' },
  '/prices':       { title: 'Manage Price',    subtitle: 'pricing catalogue' },
  '/change-password': { title: 'Change Password', subtitle: 'update your account security' },
  '/promotions':   { title: 'Manage Promotions', subtitle: 'marketing campaigns' },
};

import { useState } from 'react';

export default function Layout() {
  const { pathname } = useLocation();
  let meta = pageMeta[pathname];
  
  // Handle dynamic paths
  if (!meta && pathname.startsWith('/orders/edit/')) {
    meta = { title: 'Manage Orders', subtitle: 'Update Order' };
  }
  
  meta = meta ?? { title: 'Dashboard', subtitle: '' };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f0fdf4 50%, #fafafa 75%, #f5f3ff 100%)' }}>
      {/* Subtle geometric decoration */}
      <div className="fixed top-16 right-8 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-16 left-72 w-72 h-72 bg-violet-200/20 rounded-full blur-3xl pointer-events-none z-0" />

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <Header 
        title={meta.title} 
        subtitle={meta.subtitle} 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />
      <main className="lg:ml-[260px] pt-[60px] transition-all duration-300">
        <div className="px-6 py-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
