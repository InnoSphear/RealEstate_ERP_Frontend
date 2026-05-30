import { useAuth } from '../contexts/AuthContext';
import { HiOutlineBell, HiOutlineArrowRightOnRectangle, HiOutlineUser } from 'react-icons/hi2';

const roleBadgeColors = {
  admin: 'bg-stone-100 text-stone-800 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  manager: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  designer: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  sales_agent: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  accountant: 'bg-stone-50 text-stone-600 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-stone-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Welcome back, {user?.full_name?.split(' ')[0]}</h2>
        <p className="text-xs text-stone-500 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all">
          <HiOutlineBell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-stone-900 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-5 border-l border-stone-200">
          <div className="w-9 h-9 bg-stone-50 rounded-full flex items-center justify-center ring-1 ring-stone-200">
            <HiOutlineUser className="text-stone-600" size={18} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-stone-900">{user?.full_name}</p>
            <span className={roleBadgeColors[user?.role]}>{user?.role?.replace(/_/g, ' ')}</span>
          </div>
          <button
            onClick={logout}
            className="p-2.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
          >
            <HiOutlineArrowRightOnRectangle size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
