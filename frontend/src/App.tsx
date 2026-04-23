import { Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import ServiceList from './pages/services/ServiceList';
import PriceManagement from './pages/prices/PriceManagement';
import ChangePasswordForm from './pages/auth/ChangePasswordForm';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerFormModal from './components/customers/CustomerFormModal';
import CardExpiryList from './pages/customers/CardExpiryList';
import CardForm from './pages/customers/CardForm';
import ExpenseList from './pages/expenses/ExpenseList';
import OrderList from './pages/orders/OrderList';
import OrderForm from './pages/orders/OrderForm';
import CompleteOrderList from './pages/orders/CompleteOrderList';
import CompleteOrderForm from './pages/orders/CompleteOrderForm';

// Wrapper: render CustomerFormModal as a standalone page at /customers/add-three
function CustomerFormModalPage() {
  const navigate = useNavigate();
  return (
    <CustomerFormModal
      isOpen={true}
      onClose={() => navigate('/customers/status')}
      customerToEdit={null}
    />
  );
}

const queryClient = new QueryClient();

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', color: 'red' }}>
          <h2>Render Error</h2>
          <pre>{(this.state.error as Error).message}</pre>
          <pre>{(this.state.error as Error).stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontWeight: 600, fontSize: '14px' },
            success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
            error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
          }}
        />
        <BrowserRouter basename="/">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="services" element={<ServiceList />} />
              <Route path="orders/new" element={<OrderForm />} />
              <Route path="orders/edit/:id" element={<OrderForm />} />
              <Route path="orders/summary" element={<OrderList />} />
              <Route path="orders/complete" element={<CompleteOrderList />} />
              <Route path="orders/complete/manual" element={<CompleteOrderForm />} />
              <Route path="orders/remove" element={<div className="p-4 text-gray-500">Remove an Order — coming soon</div>} />
              <Route path="orders" element={<div className="p-4 text-gray-500">Select a sub-menu under Manage Orders</div>} />
              <Route path="quotes" element={<div className="p-4 text-gray-500">Manage Quote — coming soon</div>} />
              <Route path="payments" element={<div className="p-4 text-gray-500">Manage Payments — coming soon</div>} />
              <Route path="invoices" element={<div className="p-4 text-gray-500">Manage Invoice — coming soon</div>} />
              <Route path="customers/status" element={<CustomerList />} />
              <Route path="customers/add-two" element={<CustomerForm />} />
              <Route path="customers/add-three" element={<CustomerFormModalPage />} />
              <Route path="customers/card-summary" element={<CardExpiryList />} />
              <Route path="customers/card-details" element={<CardForm />} />
              <Route path="customers" element={<div className="p-4 text-gray-500">Select a sub-menu under Manage Customers</div>} />
              <Route path="employees" element={<div className="p-4 text-gray-500">Manage Employee — coming soon</div>} />
              <Route path="vendors" element={<div className="p-4 text-gray-500">Manage Vendor — coming soon</div>} />
              <Route path="prices" element={<PriceManagement />} />
              <Route path="expenses" element={<ExpenseList />} />
              <Route path="change-password" element={<ChangePasswordForm />} />
              <Route path="promotions" element={<div className="p-4 text-gray-500">Manage Promotions — coming soon</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
