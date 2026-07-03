import { lazy, Suspense } from 'react';
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

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));

const Tenants = lazy(() => import('./pages/admin/Tenants'));
const TenantDetail = lazy(() => import('./pages/admin/TenantDetail'));
const Users = lazy(() => import('./pages/admin/Users'));
const Roles = lazy(() => import('./pages/admin/Roles'));
const Permissions = lazy(() => import('./pages/admin/Permissions'));
const Branches = lazy(() => import('./pages/admin/Branches'));

const EmployeeList = lazy(() => import('./pages/employees/EmployeeList'));
const EmployeeDetail = lazy(() => import('./pages/employees/EmployeeDetail'));
const Attendance = lazy(() => import('./pages/employees/Attendance'));
const MyAttendance = lazy(() => import('./pages/employees/MyAttendance'));
const MyLeaves = lazy(() => import('./pages/employees/MyLeaves'));
const LeaveManagement = lazy(() => import('./pages/employees/leaves/LeaveManagement'));

const ClientList = lazy(() => import('./pages/clients/ClientList'));
const ClientDetail = lazy(() => import('./pages/clients/ClientDetail'));

const LeadList = lazy(() => import('./pages/leads/LeadList'));
const LeadDetail = lazy(() => import('./pages/leads/LeadDetail'));
const LeadKanban = lazy(() => import('./pages/leads/LeadKanban'));
const FollowUpList = lazy(() => import('./pages/follow-ups/FollowUpList'));
const InteriorDashboard = lazy(() => import('./pages/interior/InteriorDashboard'));
const InteriorProjects = lazy(() => import('./pages/interior/InteriorProjects'));
const InteriorProjectDetail = lazy(() => import('./pages/interior/InteriorProjectDetail'));
const InteriorInvoices = lazy(() => import('./pages/interior/InteriorInvoices'));
const InteriorPayments = lazy(() => import('./pages/interior/InteriorPayments'));
const Estimates = lazy(() => import('./pages/interior/Estimates'));
const InteriorInvoiceDetail = lazy(() => import('./pages/interior/InteriorInvoiceDetail'));
const RentalList = lazy(() => import('./pages/rentals/RentalList'));
const RentalDetail = lazy(() => import('./pages/rentals/RentalDetail'));

const PropertyList = lazy(() => import('./pages/properties/PropertyList'));
const PropertyDetail = lazy(() => import('./pages/properties/PropertyDetail'));
const PropertyKeyList = lazy(() => import('./pages/properties/keys/PropertyKeyList'));

const ProjectList = lazy(() => import('./pages/projects/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/projects/ProjectDetail'));

const SiteVisitList = lazy(() => import('./pages/sitevisits/SiteVisitList'));

const InvoiceList = lazy(() => import('./pages/billing/InvoiceList'));
const InvoiceDetail = lazy(() => import('./pages/billing/InvoiceDetail'));
const PaymentList = lazy(() => import('./pages/payments/PaymentList'));
const CommissionList = lazy(() => import('./pages/commissions/CommissionList'));
const MyCommissions = lazy(() => import('./pages/commissions/MyCommissions'));
const IncomeList = lazy(() => import('./pages/income/IncomeList'));
const ExpenseList = lazy(() => import('./pages/expenses/ExpenseList'));
const VendorList = lazy(() => import('./pages/vendors/VendorList'));
const VisitorList = lazy(() => import('./pages/visitors/VisitorList'));

const Reports = lazy(() => import('./pages/reports/Reports'));
const Documents = lazy(() => import('./pages/documents/Documents'));
const Materials = lazy(() => import('./pages/materials/Materials'));
const StockList = lazy(() => import('./pages/inventory/StockList'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const MyActivity = lazy(() => import('./pages/activity/MyActivity'));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
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

              <Route path="leads" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager', 'junior_interior_manager']} permission="leads"><LeadList /></ProtectedRoute>} />
              <Route path="leads/:id" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager', 'junior_interior_manager']} permission="leads"><LeadDetail /></ProtectedRoute>} />
              <Route path="leads/kanban" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'interior_manager', 'junior_interior_manager']} permission="leads"><LeadKanban /></ProtectedRoute>} />

              <Route path="clients" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager', 'junior_interior_manager']} permission="clients"><ClientList /></ProtectedRoute>} />
              <Route path="clients/:id" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager', 'junior_interior_manager']} permission="clients"><ClientDetail /></ProtectedRoute>} />

              <Route path="follow-ups" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'interior_manager', 'junior_interior_manager']} permission="follow_ups"><FollowUpList /></ProtectedRoute>} />

              <Route path="properties" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager']} permission="properties"><PropertyList /></ProtectedRoute>} />
              <Route path="properties/:id" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager']} permission="properties"><PropertyDetail /></ProtectedRoute>} />
              <Route path="properties/keys" element={<ProtectedRoute roles={['admin', 'manager']}><PropertyKeyList /></ProtectedRoute>} />

              <Route path="projects" element={<ProtectedRoute roles={['admin', 'manager', 'sales_executive', 'interior_manager']}><ProjectList /></ProtectedRoute>} />
              <Route path="projects/:id" element={<ProtectedRoute roles={['admin', 'manager', 'sales_executive', 'interior_manager']}><ProjectDetail /></ProtectedRoute>} />

              <Route path="site-visits" element={<ProtectedRoute roles={['admin', 'manager', 'sales_executive', 'junior_interior_manager']} permission="site_visits"><SiteVisitList /></ProtectedRoute>} />
              <Route path="visitors" element={<ProtectedRoute roles={['admin', 'manager', 'receptionist']}><VisitorList /></ProtectedRoute>} />
              <Route path="interior" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']} permission="interior_projects"><InteriorDashboard /></ProtectedRoute>} />
              <Route path="interior-projects" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']} permission="interior_projects"><InteriorProjects /></ProtectedRoute>} />
              <Route path="interior-projects/new" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']} permission="interior_projects"><InteriorProjects /></ProtectedRoute>} />
              <Route path="interior-projects/:id" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']} permission="interior_projects"><InteriorProjectDetail /></ProtectedRoute>} />
              <Route path="interior-invoices" element={<ProtectedRoute roles={['admin', 'manager', 'accounts', 'interior_manager']} permission="interior_projects"><InteriorInvoices /></ProtectedRoute>} />
              <Route path="interior-invoices/:id" element={<ProtectedRoute roles={['admin', 'manager', 'accounts', 'interior_manager']} permission="interior_projects"><InteriorInvoiceDetail /></ProtectedRoute>} />
              <Route path="interior-payments" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']} permission="interior_projects"><InteriorPayments /></ProtectedRoute>} />
              <Route path="estimates" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']} permission="interior_projects"><Estimates /></ProtectedRoute>} />
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
              <Route path="materials" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']}><Materials /></ProtectedRoute>} />
              <Route path="stock" element={<ProtectedRoute roles={['admin', 'manager', 'interior_manager', 'junior_interior_manager']}><StockList /></ProtectedRoute>} />

              <Route path="activity" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager']}><MyActivity /></ProtectedRoute>} />
              <Route path="documents" element={<ProtectedRoute roles={['admin', 'manager', 'sales_executive', 'accounts', 'interior_manager']}><Documents /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute roles={['admin', 'manager', 'accounts']}><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute roles={['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager']}><Settings /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
          <Toaster position="top-right" toastOptions={{
            duration: 3000,
            style: { background: '#1c1917', color: '#fff', borderRadius: '12px', fontSize: '14px' },
          }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
