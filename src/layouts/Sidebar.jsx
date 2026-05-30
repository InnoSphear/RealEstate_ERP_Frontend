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
import logo from '../assets/logo.jpeg'
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl luxury-shadow border border-stone-200"
      >
        {collapsed ? <HiOutlineBars3 size={20} className="text-stone-700" /> : <HiOutlineXMark size={20} className="text-stone-700" />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 transform transition-transform duration-300 flex flex-col ${collapsed ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-stone-100">
          <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center luxury-shadow">
            <img src={logo} alt="" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-blue-800 tracking-tight">Shivam <span className='text-blue-800'>International</span> </h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-[0.15em] font-medium">Management System</p>
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
          <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
            <HiOutlineCog6Tooth size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
