import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Users from './pages/admin/Users';
import Branches from './pages/admin/Branches';
import Clients from './pages/clients/Clients';
import InteriorProjects from './pages/interior/InteriorProjects';
import Materials from './pages/materials/Materials';
import Inventory from './pages/inventory/Inventory';
import Requisitions from './pages/requisitions/Requisitions';
import PurchaseOrders from './pages/purchase-orders/PurchaseOrders';
import Listings from './pages/listings/Listings';
import Inquiries from './pages/inquiries/Inquiries';
import Sales from './pages/sales/Sales';
import Invoices from './pages/invoices/Invoices';
import Payments from './pages/payments/Payments';
import Expenses from './pages/expenses/Expenses';
import Commissions from './pages/commissions/Commissions';
import Revenue from './pages/revenue/Revenue';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="admin/users" element={<ProtectedRoute roles={['admin', 'manager']}><Users /></ProtectedRoute>} />
            <Route path="admin/branches" element={<ProtectedRoute roles={['admin']}><Branches /></ProtectedRoute>} />

            <Route path="clients" element={<Clients />} />
            <Route path="interior-projects" element={<InteriorProjects />} />

            <Route path="materials" element={<Materials />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="requisitions" element={<Requisitions />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />

            <Route path="listings" element={<Listings />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="sales" element={<Sales />} />

            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="commissions" element={<Commissions />} />
            <Route path="revenue" element={<Revenue />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
