import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineUsers,
  HiOutlineCube, HiOutlineClipboardDocumentList,
  HiOutlineShoppingCart, HiOutlineDocumentText,
  HiOutlineBanknotes, HiOutlineChartBar, HiOutlineCurrencyDollar,
  HiOutlineCreditCard, HiOutlineReceiptPercent, HiOutlineTag,
  HiOutlineBuildingOffice, HiOutlineWrenchScrewdriver,
  HiOutlineChartPie, HiOutlineXMark, HiOutlineBars3,
  HiOutlineCog6Tooth, HiOutlinePhone, HiOutlineKey,
  HiOutlineMapPin, HiOutlineCalendar, HiOutlineFolder,
  HiOutlinePresentationChartBar, HiOutlineBuildingOffice2,
  HiOutlineScale, HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import { useState } from 'react';
import logo from '../assets/logo.jpeg';

const menuGroups = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome, roles: ['super_admin', 'admin', 'manager', 'receptionist', 'telecaller', 'sales_executive', 'accounts', 'agent', 'client_portal'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/admin/tenants', label: 'Tenants', icon: HiOutlineBuildingOffice2, roles: ['super_admin'] },
      { path: '/admin/users', label: 'Users', icon: HiOutlineUsers, roles: ['super_admin', 'admin', 'manager'] },
      { path: '/admin/roles', label: 'Roles', icon: HiOutlineScale, roles: ['super_admin', 'admin'] },
      { path: '/admin/branches', label: 'Branches', icon: HiOutlineMapPin, roles: ['super_admin', 'admin'] },
    ],
  },
  {
    label: 'Employees',
    items: [
      { path: '/employees', label: 'All Employees', icon: HiOutlineUserGroup, roles: ['super_admin', 'admin', 'manager'] },
      { path: '/employees/attendance', label: 'Attendance', icon: HiOutlineCalendar, roles: ['super_admin', 'admin', 'manager'] },
      { path: '/employees/leaves', label: 'Leave Mgmt', icon: HiOutlineArrowRightOnRectangle, roles: ['super_admin', 'admin', 'manager'] },
    ],
  },
  {
    label: 'CRM',
    items: [
      { path: '/leads', label: 'Leads', icon: HiOutlinePhone, roles: ['super_admin', 'admin', 'manager', 'telecaller', 'receptionist'] },
      { path: '/leads/kanban', label: 'Lead Kanban', icon: HiOutlinePresentationChartBar, roles: ['super_admin', 'admin', 'manager', 'telecaller', 'sales_executive'] },
      { path: '/clients', label: 'Clients', icon: HiOutlineUserGroup, roles: ['super_admin', 'admin', 'manager', 'telecaller', 'sales_executive', 'receptionist'] },
      { path: '/follow-ups', label: 'Follow Ups', icon: HiOutlineCalendar, roles: ['super_admin', 'admin', 'manager', 'telecaller', 'sales_executive'] },
    ],
  },
  {
    label: 'Property',
    items: [
      { path: '/properties', label: 'Properties', icon: HiOutlineBuildingOffice, roles: ['super_admin', 'admin', 'manager', 'sales_executive', 'agent'] },
      { path: '/properties/keys', label: 'Key Mgmt', icon: HiOutlineKey, roles: ['super_admin', 'admin', 'manager'] },
      { path: '/projects', label: 'Projects', icon: HiOutlineWrenchScrewdriver, roles: ['super_admin', 'admin', 'manager', 'sales_executive'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: '/site-visits', label: 'Site Visits', icon: HiOutlineMapPin, roles: ['super_admin', 'admin', 'manager', 'sales_executive'] },
      { path: '/visitors', label: 'Visitors', icon: HiOutlineCube, roles: ['super_admin', 'admin', 'manager', 'receptionist'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/invoices', label: 'Invoices', icon: HiOutlineReceiptPercent, roles: ['super_admin', 'admin', 'manager', 'accounts'] },
      { path: '/payments', label: 'Payments', icon: HiOutlineCreditCard, roles: ['super_admin', 'admin', 'manager', 'accounts'] },
      { path: '/commissions', label: 'Commissions', icon: HiOutlineTag, roles: ['super_admin', 'admin', 'manager', 'accounts'] },
      { path: '/income', label: 'Income', icon: HiOutlineChartBar, roles: ['super_admin', 'admin', 'manager', 'accounts'] },
      { path: '/expenses', label: 'Expenses', icon: HiOutlineCurrencyDollar, roles: ['super_admin', 'admin', 'manager', 'accounts'] },
    ],
  },
  {
    label: 'Documents',
    items: [
      { path: '/documents', label: 'Documents', icon: HiOutlineFolder, roles: ['super_admin', 'admin', 'manager', 'sales_executive', 'accounts'] },
    ],
  },
  {
    label: 'Reports',
    items: [
      { path: '/reports', label: 'Reports', icon: HiOutlineChartPie, roles: ['super_admin', 'admin', 'manager', 'accounts'] },
    ],
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const roleSlug = user?.role_slug || user?.role?.slug;

  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(roleSlug)),
    }))
    .filter((group) => group.items.length > 0);

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

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-2.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={() => setCollapsed(true)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-stone-900 text-white shadow-md shadow-stone-900/10' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`
                    }
                  >
                    <item.icon size={18} />
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
      </aside>
    </>
  );
}
