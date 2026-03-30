// src/App.jsx  — Final version with all routes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';

// Pages
import LoginPage          from './pages/LoginPage';
import DashboardPage      from './pages/DashboardPage';
import ClientsPage        from './pages/ClientsPage';
import ClientDetailPage   from './pages/ClientDetailPage';
import InvoicesPage       from './pages/InvoicesPage';
import InvoiceDetailPage  from './pages/InvoiceDetailPage';
import InvoiceCreatePage  from './pages/InvoiceCreatePage';
import EncaissementsPage  from './pages/EncaissementsPage';
import ProductsPage       from './pages/ProductsPage';
import StockPage          from './pages/StockPage';
import UsersPage          from './pages/UsersPage';
import LogsPage           from './pages/LogsPage';
import SettingsPage      from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role?.name)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"              element={<DashboardPage />} />

              {/* Clients */}
              <Route path="clients"                element={<ClientsPage />} />
              <Route path="clients/:id"            element={<ClientDetailPage />} />

              {/* Invoices */}
              <Route path="invoices"               element={<InvoicesPage />} />
              <Route path="invoices/new"           element={<InvoiceCreatePage />} />
              <Route path="invoices/:id"           element={<InvoiceDetailPage />} />

              {/* Finance */}
              <Route path="encaissements"          element={<EncaissementsPage />} />

              {/* Products */}
              <Route path="products"               element={<ProductsPage />} />

              {/* Stock */}
              <Route path="stock"                  element={<StockPage />} />

              {/* Admin only */}
              <Route path="users"
                element={
                  <ProtectedRoute roles={['super_admin']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />

              {/* CRD / DG / Admin */}
              <Route path="logs"
                element={
                  <ProtectedRoute roles={['super_admin', 'dg', 'crd']}>
                    <LogsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

             <Route path="settings"
                element={<ProtectedRoute roles={['super_admin']}><SettingsPage/></ProtectedRoute>}/>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
