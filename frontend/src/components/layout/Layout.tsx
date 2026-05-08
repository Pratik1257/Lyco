import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState } from 'react';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/':             { title: 'Dashboard',      subtitle: 'statistics and more' },
  '/dashboard-fx': { title: 'Dashboard FX',   subtitle: 'futuristic view' },
  '/orders/new':   { title: 'Manage Orders',  subtitle: 'Place New Order' },
  '/orders/history':{ title: 'Manage Orders', subtitle: 'Order History' },
  '/admin/orders/history':{ title: 'Manage Orders', subtitle: 'Order History' },
  '/orders/complete':{ title: 'Manage Orders',subtitle: 'Complete an Order' },
  '/admin/orders/complete':{ title: 'Manage Orders',subtitle: 'Complete an Order' },
  '/orders/remove': { title: 'Manage Orders', subtitle: 'Remove an Order' },
  '/admin/orders/remove': { title: 'Manage Orders', subtitle: 'Remove an Order' },
  '/orders':       { title: 'Manage Orders',  subtitle: 'view and manage orders' },
  '/quotes':       { title: 'Manage Quote',   subtitle: 'quote requests' },
  '/quotes/new':   { title: 'Manage Quote',   subtitle: 'Create Quote' },
  '/admin/quotes/new': { title: 'Manage Quote', subtitle: 'Create Quote' },
  '/admin/quotes':     { title: 'Manage Quote', subtitle: 'Quote History' },
  '/payments':     { title: 'Manage Payments',subtitle: 'payment records' },
  '/admin/payments/paypal-billing': { title: 'Manage Payment', subtitle: 'Billing Account Details' },
  '/invoices':     { title: 'Manage Invoice', subtitle: 'invoice history' },
  '/customers/status':       { title: 'Manage Customers', subtitle: 'Customer Status' },
  '/admin/customers/summary': { title: 'Manage Customers', subtitle: 'Customer History' },
  '/customers/card-summary': { title: 'Manage Customers', subtitle: 'Card History' },
  '/admin/customers/card-summary': { title: 'Manage Customers', subtitle: 'Card History' },
  '/customers/card-details': { title: 'Manage Customers', subtitle: 'Add Customer Cards Details' },
  '/customers/add-two':      { title: 'Manage Customers', subtitle: 'Add Customer Details' },
  '/admin/customers/add-customer': { title: 'Manage Customers', subtitle: 'Add Customer Details' },
  '/customers/add-three':    { title: 'Manage Customers', subtitle: 'Add Customer' },
  '/customers':    { title: 'Manage Customers', subtitle: 'manage customers' },
  '/employees':    { title: 'Manage Employee', subtitle: 'manage employees' },
  '/vendors':      { title: 'Manage Vendor',   subtitle: 'manage vendors' },
  '/services':     { title: 'Manage Service',  subtitle: 'View and Manage Services' },
  '/admin/services': { title: 'Manage Service', subtitle: 'View and Manage Services' },
  '/prices':       { title: 'Manage Price',    subtitle: 'Pricing Catalogue' },
  '/admin/prices': { title: 'Manage Price',    subtitle: 'Pricing Catalogue' },
  '/change-password': { title: 'Change Password', subtitle: 'update your account security' },
  '/promotions':   { title: 'Manage Promotions', subtitle: 'marketing campaigns' },
  '/admin/payments/make':          { title: 'Manage Payment', subtitle: 'Make Payment for Customer' },
  '/admin/payments/status':        { title: 'Manage Payment', subtitle: 'Payment Status' },
  '/admin/payments/remove-bad-debt': { title: 'Manage Payment', subtitle: 'Remove from Bad Debt' },
  '/admin/payments/history':       { title: 'Manage Payment', subtitle: 'Payment History' },
  '/payments/history':             { title: 'Manage Payment', subtitle: 'Payment History' },
  '/invoices/create':   { title: 'Manage Invoice', subtitle: 'Create Invoice' },
  '/admin/invoices/create': { title: 'Manage Invoice', subtitle: 'Create Invoice' },
  '/invoices/summary':  { title: 'Manage Invoice', subtitle: 'Invoice History' },
  '/admin/invoices/summary': { title: 'Manage Invoice', subtitle: 'Invoice History' },
  '/invoices/pending':  { title: 'Manage Invoice', subtitle: 'Pending Invoice History' },
  '/admin/invoices/pending': { title: 'Manage Invoice', subtitle: 'Pending Invoice History' },
  '/expenses':          { title: 'Manage Expenses', subtitle: 'Expense Tracking' },
  '/admin/expenses':    { title: 'Manage Expenses', subtitle: 'Expense Tracking' },
  '/profile':          { title: 'Edit Profile',   subtitle: 'Update account information' },
  '/admin/profile':    { title: 'Edit Profile',   subtitle: 'Update account information' },
  '/admin/orders/new': { title: 'Manage Orders',  subtitle: 'Place New Order' },
  '/admin/change-password': { title: 'Change Password', subtitle: 'Update security' },
  '/payment/success':  { title: 'Payment', subtitle: 'Payment Submitted' },
  '/payment/cancel':   { title: 'Payment', subtitle: 'Payment Cancelled' },
};

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
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <Header 
        title={meta.title} 
        subtitle={meta.subtitle} 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />
      <main className="lg:ml-[260px] pt-[60px] transition-all duration-300">
        <div className="px-3 sm:px-6 py-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
