import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineHome, HiOutlineUserGroup,
  HiOutlineUsers, HiOutlineCube, HiOutlineClipboardDocumentList,
  HiOutlineShoppingCart, HiOutlineDocumentText,
  HiOutlineBanknotes, HiOutlineChartBar, HiOutlineCurrencyDollar,
  HiOutlineCreditCard, HiOutlineReceiptPercent, HiOutlineTag,
  HiOutlineBuildingOffice, HiOutlineWrenchScrewdriver,
  HiOutlineChartPie, HiOutlineXMark, HiOutlineBars3,
  HiOutlineCog6Tooth
} from 'react-icons/hi2';
import { useState } from 'react';

const menuGroups = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome, roles: ['admin', 'manager', 'designer', 'sales_agent', 'accountant'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/admin/users', label: 'Users', icon: HiOutlineUsers, roles: ['admin', 'manager'] },
      { path: '/admin/branches', label: 'Branches', icon: HiOutlineBuildingOffice, roles: ['admin'] },
    ],
  },
  {
    label: 'CRM',
    items: [
      { path: '/clients', label: 'Clients', icon: HiOutlineUserGroup, roles: ['admin', 'manager', 'designer', 'sales_agent'] },
    ],
  },
  {
    label: 'Interior Projects',
    items: [
      { path: '/interior-projects', label: 'Projects', icon: HiOutlineWrenchScrewdriver, roles: ['admin', 'manager', 'designer'] },
    ],
  },
  {
    label: 'Materials & Inventory',
    items: [
      { path: '/materials', label: 'Materials', icon: HiOutlineCube, roles: ['admin', 'manager', 'designer'] },
      { path: '/inventory', label: 'Inventory', icon: HiOutlineClipboardDocumentList, roles: ['admin', 'manager', 'designer'] },
      { path: '/requisitions', label: 'Requisitions', icon: HiOutlineShoppingCart, roles: ['admin', 'manager', 'designer'] },
      { path: '/purchase-orders', label: 'Purchase Orders', icon: HiOutlineDocumentText, roles: ['admin', 'manager', 'designer'] },
    ],
  },
  {
    label: 'Real Estate',
    items: [
      { path: '/listings', label: 'Listings', icon: HiOutlineBuildingOffice, roles: ['admin', 'manager', 'sales_agent'] },
      { path: '/inquiries', label: 'Inquiries', icon: HiOutlineDocumentText, roles: ['admin', 'manager', 'sales_agent'] },
      { path: '/sales', label: 'Sales', icon: HiOutlineBanknotes, roles: ['admin', 'manager', 'sales_agent'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/invoices', label: 'Invoices', icon: HiOutlineReceiptPercent, roles: ['admin', 'manager', 'accountant'] },
      { path: '/payments', label: 'Payments', icon: HiOutlineCreditCard, roles: ['admin', 'manager', 'accountant'] },
      { path: '/expenses', label: 'Expenses', icon: HiOutlineCurrencyDollar, roles: ['admin', 'manager', 'accountant'] },
      { path: '/commissions', label: 'Commissions', icon: HiOutlineTag, roles: ['admin', 'manager', 'accountant'] },
      { path: '/revenue', label: 'Revenue', icon: HiOutlineChartPie, roles: ['admin', 'manager', 'accountant'] },
    ],
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user?.role)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-border"
      >
        {collapsed ? <HiOutlineBars3 size={24} /> : <HiOutlineXMark size={24} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border transform transition-transform duration-200 flex flex-col ${collapsed ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <HiOutlineHome className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-text">RealEstate ERP</h1>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider">Management System</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={() => setCollapsed(true)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-primary/10 hover:text-primary'}`
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

        <div className="px-3 py-3 border-t border-border">
          <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-primary/10 hover:text-primary'}`}>
            <HiOutlineCog6Tooth size={18} />
            <span>Profile</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
