import { Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';

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
        <BrowserRouter basename="/">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="services" element={<Services />} />
              <Route path="orders" element={<div className="p-4 text-gray-500">Manage Orders — coming soon</div>} />
              <Route path="quotes" element={<div className="p-4 text-gray-500">Manage Quotes — coming soon</div>} />
              <Route path="payments" element={<div className="p-4 text-gray-500">Manage Payments — coming soon</div>} />
              <Route path="invoices" element={<div className="p-4 text-gray-500">Manage Invoices — coming soon</div>} />
              <Route path="customers" element={<div className="p-4 text-gray-500">Manage Customers — coming soon</div>} />
              <Route path="employees" element={<div className="p-4 text-gray-500">Manage Employees — coming soon</div>} />
              <Route path="vendors" element={<div className="p-4 text-gray-500">Manage Vendors — coming soon</div>} />
              <Route path="prices" element={<div className="p-4 text-gray-500">Manage Prices — coming soon</div>} />
              <Route path="promotions" element={<div className="p-4 text-gray-500">Manage Promotions — coming soon</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
