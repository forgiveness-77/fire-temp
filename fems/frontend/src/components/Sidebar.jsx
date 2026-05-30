import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { notificationsApi, escalationsApi } from '../api';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/extinguishers', label: 'Extinguishers', icon: '🧯' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/escalations', label: 'Escalations', icon: '⚠️' },
];

const roleBadge = {
  admin: 'bg-purple-500',
  manager: 'bg-blue-500',
  viewer: 'bg-gray-500',
};

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const [unseenCount, setUnseenCount] = useState(0);
  const [escalationCount, setEscalationCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [n, e] = await Promise.all([
          notificationsApi.getAll({ is_seen: 0 }),
          escalationsApi.getAll({ status: 'pending' }),
        ]);
        setUnseenCount(n.data.length);
        setEscalationCount(e.data.length);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const badges = {
    '/notifications': unseenCount,
    '/escalations': escalationCount,
  };

  const items = isAdmin
    ? [...navItems, { to: '/users', label: 'Users', icon: '👤' }]
    : navItems;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-red-700 text-white flex flex-col shadow-xl z-50">
      <div className="p-6 border-b border-red-600">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧯</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">FEMS</h1>
            <p className="text-red-200 text-xs">Fire Extinguisher Mgmt</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4">
        {items.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-800 text-white border-r-4 border-white'
                  : 'text-red-100 hover:bg-red-600'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              {label}
            </span>
            {badges[to] > 0 && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {badges[to]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-red-600">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${roleBadge[user?.role] || 'bg-gray-500'}`}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-red-300 text-xs capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-red-200 hover:text-white hover:bg-red-600 text-xs py-2 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
