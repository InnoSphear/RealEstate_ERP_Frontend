import { useAuth } from '../contexts/AuthContext';
import { HiOutlineBell, HiOutlineArrowRightOnRectangle, HiOutlineUser, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi2';
import { useState } from 'react';
import API from '../api/axios';
import { useEffect } from 'react';

const roleBadgeColors = {
  admin: 'bg-stone-100 text-stone-800 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  manager: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  telecaller: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  sales_executive: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  accounts: 'bg-stone-50 text-stone-600 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  receptionist: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  agent: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  client_portal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

export default function Header() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [notifCount, setNotifCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    API.get('/notifications/unread-count')
      .then((res) => setNotifCount(res.data.count))
      .catch(() => {});
  }, []);

  const toggleNotif = async () => {
    setShowNotif(!showNotif);
    if (!showNotif) {
      try {
        const res = await API.get('/notifications');
        setNotifications(res.data.data || res.data);
      } catch {}
    }
  };

  const roleSlug = user?.role_slug || user?.role?.slug;
  const roleLabel = roleSlug?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-stone-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Welcome back, {user?.full_name?.split(' ')[0]}</h2>
        <p className="text-xs text-stone-500 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all"
          title="Toggle dark mode"
        >
          {darkMode ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
        </button>

        <div className="relative">
          <button
            onClick={toggleNotif}
            className="relative p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all"
          >
            <HiOutlineBell size={20} />
            {notifCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-stone-200 shadow-xl z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-stone-100">
                <p className="text-sm font-semibold text-stone-900">Notifications</p>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6">No notifications</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div key={n._id} className={`p-3 border-b border-stone-50 hover:bg-stone-50 cursor-pointer ${!n.is_read ? 'bg-blue-50' : ''}`}>
                    <p className="text-sm font-medium text-stone-800">{n.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-5 border-l border-stone-200">
          <div className="w-9 h-9 bg-stone-50 rounded-full flex items-center justify-center ring-1 ring-stone-200">
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <HiOutlineUser className="text-stone-600" size={18} />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-stone-900">{user?.full_name}</p>
            <span className={roleBadgeColors[roleSlug]}>{roleLabel}</span>
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
