import { Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import ServiceList from './pages/services/ServiceList';
import PriceManagement from './pages/prices/PriceManagement';
import ChangePasswordForm from './pages/auth/ChangePasswordForm';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MyProfile from './pages/auth/MyProfile';
import ResetPassword from './pages/auth/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

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
import RemoveOrderForm from './pages/orders/RemoveOrderForm';

import QuoteList from './pages/quotes/QuoteList';
import QuoteForm from './pages/quotes/QuoteForm';

import CreateInvoice from './pages/invoices/CreateInvoice';
import InvoiceList from './pages/invoices/InvoiceList';
import PendingInvoiceList from './pages/invoices/PendingInvoiceList';
import ManagePaymentStatus from './pages/payments/ManagePaymentStatus';
import RemoveBadDebt from './pages/payments/RemoveBadDebt';
import PaymentSummary from './pages/payments/PaymentSummary';
import ManagePayment from './pages/payments/ManagePayment';
import PayPalBillingDetails from './pages/payments/PayPalBillingDetails';
import PaymentSuccess from './pages/payments/PaymentSuccess';
import PaymentCancel from './pages/payments/PaymentCancel';

// Wrapper: render CustomerFormModal as a standalone page at /customers/add-three
function CustomerFormModalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  return (
    <CustomerFormModal
      isOpen={true}
      onClose={() => navigate(isAdmin ? '/admin/customers/summary' : '/customers/status')}
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
          <AuthProvider>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                {/* Unified Redirect / Home */}
                <Route index element={<Dashboard />} />
                
                {/* Admin Specific Paths (Optional prefixing) */}
                <Route path="admin/dashboard" element={<Dashboard />} />
                <Route path="admin/orders/new" element={<OrderForm />} />
                <Route path="admin/orders/edit/:id" element={<OrderForm />} />
                <Route path="admin/orders/history" element={<OrderList />} />
                <Route path="admin/orders/complete" element={<CompleteOrderList />} />
                <Route path="admin/orders/complete/manual" element={<CompleteOrderForm />} />
                <Route path="admin/orders/remove" element={<RemoveOrderForm />} />
                <Route path="admin/quotes" element={<QuoteList />} />
                <Route path="admin/quotes/new" element={<QuoteForm />} />
                <Route path="admin/quotes/edit/:id" element={<QuoteForm />} />
                <Route path="admin/payments/status" element={<ManagePaymentStatus />} />
                <Route path="admin/payments/remove-bad-debt" element={<RemoveBadDebt />} />
                <Route path="admin/payments/history" element={<PaymentSummary />} />
                <Route path="admin/payments/make" element={<ManagePayment />} />
                <Route path="admin/payments/paypal-billing" element={<PayPalBillingDetails />} />
                <Route path="admin/invoices/create" element={<CreateInvoice />} />
                <Route path="admin/invoices/summary" element={<InvoiceList />} />
                <Route path="admin/invoices/pending" element={<PendingInvoiceList />} />
                <Route path="admin/customers/summary" element={<CustomerList />} />
                <Route path="admin/customers/add-customer" element={<CustomerForm />} />
                <Route path="admin/customers/add-three" element={<CustomerFormModalPage />} />
                <Route path="admin/customers/card-summary" element={<CardExpiryList />} />
                <Route path="admin/customers/card-details" element={<CardForm />} />
                <Route path="admin/services" element={<ServiceList />} />
                <Route path="admin/prices" element={<PriceManagement />} />
                <Route path="admin/expenses" element={<ExpenseList />} />
                <Route path="admin/profile" element={<MyProfile />} />
                <Route path="admin/change-password" element={<ChangePasswordForm />} />
                <Route path="admin/card-details" element={<CardForm />} />

                {/* Customer / Root Paths */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orders/new" element={<OrderForm />} />
                <Route path="orders/edit/:id" element={<OrderForm />} />
                <Route path="orders/history" element={<OrderList />} />
                <Route path="orders/complete" element={<CompleteOrderList />} />
                <Route path="quotes" element={<QuoteList />} />
                <Route path="quotes/new" element={<QuoteForm />} />
                <Route path="payments/make" element={<ManagePayment />} />
                <Route path="payments/history" element={<PaymentSummary />} />
                <Route path="invoices/summary" element={<InvoiceList />} />
                <Route path="card-details" element={<CardForm />} />
                
                {/* Account Settings (Shared) */}
                <Route path="change-password" element={<ChangePasswordForm />} />
                <Route path="profile" element={<MyProfile />} />
                
                {/* Base Category Redirects */}
                <Route path="orders" element={<Navigate to="/orders/history" replace />} />
                <Route path="quotes" element={<Navigate to="/quotes" replace />} />
                <Route path="payments" element={<Navigate to="/payments/make" replace />} />
                <Route path="invoices" element={<Navigate to="/invoices/summary" replace />} />
                
                {/* Admin Base Category Redirects */}
                <Route path="admin/orders" element={<Navigate to="/admin/orders/history" replace />} />
                <Route path="admin/invoices" element={<Navigate to="/admin/invoices/summary" replace />} />
                <Route path="admin/customers" element={<Navigate to="/admin/customers/summary" replace />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Public PayPal redirect pages — no auth required */}
              <Route path="/payment/success" element={<Layout />}>
                <Route index element={<PaymentSuccess />} />
              </Route>
              <Route path="/payment/cancel" element={<Layout />}>
                <Route index element={<PaymentCancel />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
