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
import Permissions from './pages/admin/Permissions';
import Branches from './pages/admin/Branches';

import EmployeeList from './pages/employees/EmployeeList';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import Attendance from './pages/employees/Attendance';
import MyAttendance from './pages/employees/MyAttendance';
import MyLeaves from './pages/employees/MyLeaves';
import LeaveManagement from './pages/employees/leaves/LeaveManagement';

import ClientList from './pages/clients/ClientList';
import ClientDetail from './pages/clients/ClientDetail';

import LeadList from './pages/leads/LeadList';
import LeadDetail from './pages/leads/LeadDetail';
import LeadKanban from './pages/leads/LeadKanban';
import FollowUpList from './pages/follow-ups/FollowUpList';
import InteriorDashboard from './pages/interior/InteriorDashboard';
import InteriorProjects from './pages/interior/InteriorProjects';
import InteriorProjectDetail from './pages/interior/InteriorProjectDetail';
import InteriorInvoices from './pages/interior/InteriorInvoices';
import InteriorInvoiceDetail from './pages/interior/InteriorInvoiceDetail';
import RentalList from './pages/rentals/RentalList';
import RentalDetail from './pages/rentals/RentalDetail';

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
import MyCommissions from './pages/commissions/MyCommissions';
import IncomeList from './pages/income/IncomeList';
import ExpenseList from './pages/expenses/ExpenseList';
import VendorList from './pages/vendors/VendorList';
import VisitorList from './pages/visitors/VisitorList';

import Reports from './pages/reports/Reports';
import Documents from './pages/documents/Documents';
import Settings from './pages/settings/Settings';
import MyActivity from './pages/activity/MyActivity';

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

              <Route path="admin/tenants" element={<ProtectedRoute roles={['admin']}><Tenants /></ProtectedRoute>} />
              <Route path="admin/tenants/:id" element={<ProtectedRoute roles={['admin']}><TenantDetail /></ProtectedRoute>} />
              <Route path="admin/users" element={<ProtectedRoute roles={['admin', 'manager']}><Users /></ProtectedRoute>} />
              <Route path="admin/roles" element={<ProtectedRoute roles={['admin']}><Roles /></ProtectedRoute>} />
              <Route path="admin/permissions" element={<ProtectedRoute roles={['admin']}><Permissions /></ProtectedRoute>} />
              <Route path="admin/branches" element={<ProtectedRoute roles={['admin']}><Branches /></ProtectedRoute>} />

              <Route path="employees" element={<ProtectedRoute roles={['admin', 'manager']}><EmployeeList /></ProtectedRoute>} />
              <Route path="employees/:id" element={<ProtectedRoute roles={['admin', 'manager']}><EmployeeDetail /></ProtectedRoute>} />
              <Route path="employees/attendance" element={<ProtectedRoute roles={['admin', 'manager']}><Attendance /></ProtectedRoute>} />
              <Route path="my-attendance" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager']}><MyAttendance /></ProtectedRoute>} />
              <Route path="my-leaves" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager']}><MyLeaves /></ProtectedRoute>} />
              <Route path="employees/leaves" element={<ProtectedRoute roles={['admin', 'manager']}><LeaveManagement /></ProtectedRoute>} />

              <Route path="leads" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager']}><LeadList /></ProtectedRoute>} />
              <Route path="leads/:id" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager']}><LeadDetail /></ProtectedRoute>} />
              <Route path="leads/kanban" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'interior_manager']}><LeadKanban /></ProtectedRoute>} />

              <Route path="clients" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager']}><ClientList /></ProtectedRoute>} />
              <Route path="clients/:id" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager']}><ClientDetail /></ProtectedRoute>} />

              <Route path="follow-ups" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'interior_manager']}><FollowUpList /></ProtectedRoute>} />

              <Route path="properties" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager']}><PropertyList /></ProtectedRoute>} />
              <Route path="properties/:id" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager']}><PropertyDetail /></ProtectedRoute>} />
              <Route path="properties/keys" element={<ProtectedRoute roles={['admin', 'manager']}><PropertyKeyList /></ProtectedRoute>} />

              <Route path="projects" element={<ProtectedRoute roles={['admin', 'manager', 'sales_executive', 'interior_manager']}><ProjectList /></ProtectedRoute>} />
              <Route path="projects/:id" element={<ProtectedRoute roles={['admin', 'manager', 'sales_executive', 'interior_manager']}><ProjectDetail /></ProtectedRoute>} />

              <Route path="site-visits" element={<ProtectedRoute roles={['admin', 'manager', 'sales_executive']}><SiteVisitList /></ProtectedRoute>} />
              <Route path="visitors" element={<ProtectedRoute roles={['admin', 'manager', 'receptionist']}><VisitorList /></ProtectedRoute>} />
              <Route path="interior" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']}><InteriorDashboard /></ProtectedRoute>} />
              <Route path="interior-projects" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']}><InteriorProjects /></ProtectedRoute>} />
              <Route path="interior-projects/new" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']}><InteriorProjects /></ProtectedRoute>} />
              <Route path="interior-projects/:id" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']}><InteriorProjectDetail /></ProtectedRoute>} />
              <Route path="interior-invoices" element={<ProtectedRoute roles={['admin', 'manager', 'accounts', 'interior_manager']}><InteriorInvoices /></ProtectedRoute>} />
              <Route path="interior-invoices/:id" element={<ProtectedRoute roles={['admin', 'manager', 'accounts', 'interior_manager']}><InteriorInvoiceDetail /></ProtectedRoute>} />
              <Route path="rental-apartments" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager']}><RentalList /></ProtectedRoute>} />
              <Route path="rental-apartments/:id" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager']}><RentalDetail /></ProtectedRoute>} />

              <Route path="invoices" element={<ProtectedRoute roles={['admin', 'manager', 'accounts']}><InvoiceList /></ProtectedRoute>} />
              <Route path="invoices/:id" element={<ProtectedRoute roles={['admin', 'manager', 'accounts']}><InvoiceDetail /></ProtectedRoute>} />
              <Route path="payments" element={<ProtectedRoute roles={['admin', 'manager', 'accounts']}><PaymentList /></ProtectedRoute>} />
              <Route path="commissions" element={<ProtectedRoute roles={['admin', 'manager', 'accounts']}><CommissionList /></ProtectedRoute>} />
              <Route path="my-commissions" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager']}><MyCommissions /></ProtectedRoute>} />
              <Route path="income" element={<ProtectedRoute roles={['admin', 'manager', 'accounts']}><IncomeList /></ProtectedRoute>} />
              <Route path="expenses" element={<ProtectedRoute roles={['admin', 'manager', 'accounts']}><ExpenseList /></ProtectedRoute>} />
              <Route path="vendors" element={<ProtectedRoute roles={['admin', 'manager', 'accounts']}><VendorList /></ProtectedRoute>} />

              <Route path="activity" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager']}><MyActivity /></ProtectedRoute>} />
              <Route path="documents" element={<ProtectedRoute roles={['admin', 'manager', 'sales_executive', 'accounts', 'interior_manager']}><Documents /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute roles={['admin', 'manager', 'accounts']}><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager']}><Settings /></ProtectedRoute>} />
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
