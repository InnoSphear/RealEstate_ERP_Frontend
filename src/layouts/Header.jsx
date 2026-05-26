import { useAuth } from '../contexts/AuthContext';
import { HiOutlineBell, HiOutlineArrowRightOnRectangle, HiOutlineUser } from 'react-icons/hi2';

const roleBadgeColors = {
  admin: 'bg-red-100 text-red-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  manager: 'bg-yellow-100 text-yellow-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  designer: 'bg-blue-100 text-blue-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  sales_agent: 'bg-green-100 text-green-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  accountant: 'bg-gray-100 text-gray-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-semibold text-text">Welcome back, {user?.full_name?.split(' ')[0]}</h2>
        <p className="text-xs text-text-secondary">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-text-secondary hover:text-text hover:bg-bg rounded-lg transition-colors">
          <HiOutlineBell size={22} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
            <HiOutlineUser className="text-primary" size={18} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text">{user?.full_name}</p>
            <span className={roleBadgeColors[user?.role]}>{user?.role?.replace('_', ' ')}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <HiOutlineArrowRightOnRectangle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
