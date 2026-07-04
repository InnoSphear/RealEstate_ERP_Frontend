import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineUsers,
  HiOutlineCube,
  HiOutlineShoppingCart,
  HiOutlineChartBar, HiOutlineCurrencyDollar,
  HiOutlineCreditCard, HiOutlineReceiptPercent, HiOutlineTag,
  HiOutlineBuildingOffice,
  HiOutlineChartPie, HiOutlineXMark, HiOutlineBars3,
  HiOutlineCog6Tooth, HiOutlinePhone, HiOutlineKey,
  HiOutlineMapPin, HiOutlineCalendar, HiOutlineFolder,
  HiOutlinePresentationChartBar, HiOutlineBuildingOffice2,
  HiOutlineScale, HiOutlineShieldCheck, HiOutlineArrowRightOnRectangle,
  HiOutlineClock,
} from 'react-icons/hi2';
import { useState } from 'react';
import logo from '../assets/logo.jpeg';

const menuGroups = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome, roles: ['admin', 'manager', 'receptionist', 'telecaller', 'sales_executive', 'accounts', 'agent', 'client_portal'], permission: 'dashboard' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/admin/tenants', label: 'Tenants', icon: HiOutlineBuildingOffice2, roles: ['admin'], permission: 'tenants' },
      { path: '/admin/users', label: 'Users', icon: HiOutlineUsers, roles: ['admin', 'manager'], permission: 'users' },
      { path: '/admin/roles', label: 'Roles', icon: HiOutlineScale, roles: ['admin'], permission: 'roles' },
      { path: '/admin/permissions', label: 'Permissions', icon: HiOutlineShieldCheck, roles: ['admin'], permission: 'roles' },
      { path: '/admin/branches', label: 'Branches', icon: HiOutlineMapPin, roles: ['admin'] },
    ],
  },
  {
    label: 'Employees',
    items: [
      { path: '/employees', label: 'All Employees', icon: HiOutlineUserGroup, roles: ['admin', 'manager'], permission: 'employees', excludeRoles: ['interior_manager', 'junior_interior_manager'] },
      { path: '/employees/attendance', label: 'Attendance', icon: HiOutlineCalendar, roles: ['admin', 'manager'], permission: 'attendance', excludeRoles: ['interior_manager', 'junior_interior_manager'] },
      { path: '/employees/leaves', label: 'Leave Mgmt', icon: HiOutlineArrowRightOnRectangle, roles: ['admin', 'manager'], excludeRoles: ['interior_manager', 'junior_interior_manager'] },
    ],
  },
  {
    label: 'CRM',
    items: [
      { path: '/leads', label: 'Leads', icon: HiOutlinePhone, roles: ['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager', 'junior_interior_manager'], permission: 'leads' },
      { path: '/leads/kanban', label: 'Lead Stages', icon: HiOutlinePresentationChartBar, roles: ['admin', 'manager', 'telecaller', 'sales_executive', 'interior_manager', 'junior_interior_manager'], permission: 'leads' },
      { path: '/clients', label: 'Clients', icon: HiOutlineUserGroup, roles: ['admin', 'manager', 'telecaller', 'sales_executive', 'receptionist', 'interior_manager', 'junior_interior_manager'], permission: 'clients' },
      { path: '/follow-ups', label: 'Follow Ups', icon: HiOutlineCalendar, roles: ['admin', 'manager', 'telecaller', 'sales_executive', 'interior_manager', 'junior_interior_manager'], permission: 'follow_ups' },
    ],
  },
  {
    label: 'Property',
    items: [
      { path: '/properties', label: 'Properties', icon: HiOutlineBuildingOffice, roles: ['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager'], permission: 'properties' },
      { path: '/properties/keys', label: 'Key Mgmt', icon: HiOutlineKey, roles: ['admin', 'manager'], permission: 'property_keys' },
    ],
  },
  {
    label: 'Interior',
    items: [
      { path: '/interior', label: 'Dashboard', icon: HiOutlineChartBar, roles: ['admin', 'manager', 'interior_manager', 'junior_interior_manager'], permission: 'interior_projects' },
      { path: '/interior-projects', label: 'Projects', icon: HiOutlineBuildingOffice2, roles: ['admin', 'manager', 'interior_manager', 'junior_interior_manager'], permission: 'interior_projects' },
      { path: '/interior-payments', label: 'Payments', icon: HiOutlineCreditCard, roles: ['admin', 'manager', 'interior_manager', 'junior_interior_manager'], permission: 'interior_projects' },
      { path: '/interior-invoices', label: 'Invoices', icon: HiOutlineReceiptPercent, roles: ['admin', 'manager', 'accounts', 'interior_manager'], permission: 'interior_projects' },
      { path: '/estimates', label: 'Estimates', roles: ['admin', 'manager', 'interior_manager', 'junior_interior_manager'], permission: 'interior_projects' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: '/visitors', label: 'Visitors', icon: HiOutlineCube, roles: ['admin', 'manager', 'receptionist'], permission: 'visitors' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { path: '/stock', label: 'Stock', roles: ['admin', 'manager', 'interior_manager', 'junior_interior_manager'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/invoices', label: 'Invoices', icon: HiOutlineReceiptPercent, roles: ['admin', 'manager', 'accounts'], permission: 'invoices' },
      { path: '/payments', label: 'Payments', icon: HiOutlineCreditCard, roles: ['admin', 'manager', 'accounts'], permission: 'payments' },
      { path: '/commissions', label: 'Commissions', icon: HiOutlineTag, roles: ['admin', 'manager', 'accounts'], permission: 'commissions' },
      { path: '/income', label: 'Income', icon: HiOutlineChartBar, roles: ['admin', 'manager', 'accounts'], permission: 'income' },
      { path: '/expenses', label: 'Expenses', icon: HiOutlineCurrencyDollar, roles: ['admin', 'manager', 'accounts'], permission: 'expenses' },
      { path: '/vendors', label: 'Vendors', icon: HiOutlineShoppingCart, roles: ['admin', 'manager', 'accounts'], permission: 'vendors' },
    ],
  },
  {
    label: 'Documents',
    items: [
      { path: '/activity', label: 'Activity Log', icon: HiOutlineClock, roles: ['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager'], permission: 'activity_logs' },
      { path: '/documents', label: 'Documents', icon: HiOutlineFolder, roles: ['admin', 'manager', 'sales_executive', 'accounts', 'interior_manager'] },
    ],
  },
  {
    label: 'Reports',
    items: [
      { path: '/reports', label: 'Reports', icon: HiOutlineChartPie, roles: ['admin', 'manager', 'accounts'], permission: 'reports' },
    ],
  },
  {
    label: 'My',
    items: [
      { path: '/my-attendance', label: 'My Attendance', icon: HiOutlineCalendar, roles: ['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager'], excludeRoles: ['admin'] },
      { path: '/my-leaves', label: 'My Leaves', icon: HiOutlineArrowRightOnRectangle, roles: ['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager'], excludeRoles: ['admin'] },
      { path: '/my-commissions', label: 'My Commissions', icon: HiOutlineTag, roles: ['admin', 'manager', 'telecaller', 'sales_executive', 'accounts', 'receptionist', 'agent', 'interior_manager', 'junior_interior_manager'], permission: 'commissions', excludeRoles: ['admin'] },
    ],
  },
];

export default function Sidebar() {
  const { user, hasPermission, loading } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const roleSlug = user?.role_slug || user?.role?.slug || '';

  const isItemActive = (itemPath) => {
    if (itemPath === '/dashboard') return location.pathname === '/dashboard';
    if (itemPath === '/interior') return location.pathname.startsWith('/interior') && !location.pathname.startsWith('/interior-projects') && !location.pathname.startsWith('/interior-payments') && !location.pathname.startsWith('/interior-invoices');
    if (itemPath === '/interior-projects') return location.pathname.startsWith('/interior-projects');
    if (itemPath === '/interior-payments') return location.pathname.startsWith('/interior-payments');
    if (itemPath === '/interior-invoices') return location.pathname.startsWith('/interior-invoices');
    return location.pathname.startsWith(itemPath);
  };

  const canShow = (item) => {
    if (!user) return false;
    if (item.excludeRoles?.includes(roleSlug)) return false;
    if (item.permission && hasPermission(item.permission)) return true;
    if (item.roles.includes(roleSlug)) return true;
    return false;
  };

  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(canShow),
    }))
    .filter((group) => group.items.length > 0);

  if (loading) return null;
  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl luxury-shadow border border-stone-200"
      >
        {collapsed ? <HiOutlineBars3 size={20} className="text-stone-700" /> : <HiOutlineXMark size={20} className="text-stone-700" />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 transform transition-transform duration-300 flex flex-col ${collapsed ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-stone-100">
          <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center luxury-shadow">
            <img src={logo} alt="logo" className="w-8 h-8 rounded-xl" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-blue-800 tracking-tight">Real<span className='text-blue-600'>Estate</span> ERP</h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-[0.15em] font-medium">CRM Platform</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-2">
          {filteredGroups.map((group) => (
            <div key={group.label} className="space-y-0.5">
              <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em]">
                {group.label}
              </div>
              <div className="space-y-0.5 px-1 pb-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard' || item.path === '/interior'}
                    onClick={() => setCollapsed(true)}
                    className={() =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isItemActive(item.path) ? 'bg-stone-900 text-white shadow-md shadow-stone-900/10' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`
                    }
                  >
                    {item.icon ? <item.icon size={18} /> : <span className="w-[18px]" aria-hidden="true" />}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-stone-100">
          <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
            <HiOutlineCog6Tooth size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
        <div className="px-6 py-3 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-400 tracking-wider">
            Product by <a href="https://aiorzen.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-stone-500 hover:text-stone-900 transition-colors">AIORZEN</a>
          </p>
          <a href="https://aiorzen.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors tracking-wider">aiorzen.com</a>
        </div>
      </aside>
    </>
  );
}
