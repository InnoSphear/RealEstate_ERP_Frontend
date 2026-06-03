import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';

import Dashboard from './pages/dashboard/Dashboard';

import Tenants from './pages/admin/Tenants';
import TenantDetail from './pages/admin/TenantDetail';
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import Branches from './pages/admin/Branches';

import EmployeeList from './pages/employees/EmployeeList';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import Attendance from './pages/employees/Attendance';
import LeaveManagement from './pages/employees/leaves/LeaveManagement';

import ClientList from './pages/clients/ClientList';
import ClientDetail from './pages/clients/ClientDetail';

import LeadList from './pages/leads/LeadList';
import LeadKanban from './pages/leads/LeadKanban';
import FollowUpList from './pages/follow-ups/FollowUpList';

import PropertyList from './pages/properties/PropertyList';
import PropertyDetail from './pages/properties/PropertyDetail';
import PropertyKeyList from './pages/properties/keys/PropertyKeyList';

import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetail';

import SiteVisitList from './pages/sitevisits/SiteVisitList';

import InvoiceList from './pages/billing/InvoiceList';
import InvoiceDetail from './pages/billing/InvoiceDetail';
import PaymentList from './pages/payments/PaymentList';
import CommissionList from './pages/commissions/CommissionList';
import IncomeList from './pages/income/IncomeList';
import ExpenseList from './pages/expenses/ExpenseList';
import VisitorList from './pages/visitors/VisitorList';

import Reports from './pages/reports/Reports';
import Documents from './pages/documents/Documents';
import Settings from './pages/settings/Settings';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

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
              <Route path="change-password" element={<ChangePassword />} />

              <Route path="admin/tenants" element={<ProtectedRoute roles={['super_admin']}><Tenants /></ProtectedRoute>} />
              <Route path="admin/tenants/:id" element={<ProtectedRoute roles={['super_admin']}><TenantDetail /></ProtectedRoute>} />
              <Route path="admin/users" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager']}><Users /></ProtectedRoute>} />
              <Route path="admin/roles" element={<ProtectedRoute roles={['super_admin', 'admin']}><Roles /></ProtectedRoute>} />
              <Route path="admin/branches" element={<ProtectedRoute roles={['super_admin', 'admin']}><Branches /></ProtectedRoute>} />

              <Route path="employees" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager']}><EmployeeList /></ProtectedRoute>} />
              <Route path="employees/:id" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager']}><EmployeeDetail /></ProtectedRoute>} />
              <Route path="employees/attendance" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager']}><Attendance /></ProtectedRoute>} />
              <Route path="employees/leaves" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager']}><LeaveManagement /></ProtectedRoute>} />

              <Route path="leads" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'telecaller', 'receptionist']}><LeadList /></ProtectedRoute>} />
              <Route path="leads/kanban" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'telecaller', 'sales_executive']}><LeadKanban /></ProtectedRoute>} />

              <Route path="clients" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'telecaller', 'sales_executive', 'receptionist']}><ClientList /></ProtectedRoute>} />
              <Route path="clients/:id" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'telecaller', 'sales_executive']}><ClientDetail /></ProtectedRoute>} />

              <Route path="follow-ups" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'telecaller', 'sales_executive']}><FollowUpList /></ProtectedRoute>} />

              <Route path="properties" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'sales_executive', 'agent']}><PropertyList /></ProtectedRoute>} />
              <Route path="properties/:id" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'sales_executive', 'agent']}><PropertyDetail /></ProtectedRoute>} />
              <Route path="properties/keys" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager']}><PropertyKeyList /></ProtectedRoute>} />

              <Route path="projects" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'sales_executive']}><ProjectList /></ProtectedRoute>} />
              <Route path="projects/:id" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'sales_executive']}><ProjectDetail /></ProtectedRoute>} />

              <Route path="site-visits" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'sales_executive']}><SiteVisitList /></ProtectedRoute>} />
              <Route path="visitors" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'receptionist']}><VisitorList /></ProtectedRoute>} />

              <Route path="invoices" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'accounts']}><InvoiceList /></ProtectedRoute>} />
              <Route path="invoices/:id" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'accounts']}><InvoiceDetail /></ProtectedRoute>} />
              <Route path="payments" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'accounts']}><PaymentList /></ProtectedRoute>} />
              <Route path="commissions" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'accounts']}><CommissionList /></ProtectedRoute>} />
              <Route path="income" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'accounts']}><IncomeList /></ProtectedRoute>} />
              <Route path="expenses" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'accounts']}><ExpenseList /></ProtectedRoute>} />

              <Route path="documents" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'sales_executive', 'accounts']}><Documents /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute roles={['super_admin', 'admin', 'manager', 'accounts']}><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" toastOptions={{
            duration: 3000,
            style: { background: '#1c1917', color: '#fff', borderRadius: '12px', fontSize: '14px' },
          }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
