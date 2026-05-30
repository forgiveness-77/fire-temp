import { useEffect, useState, useCallback } from 'react';
import { notificationsApi } from '../api';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const { canWrite } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const load = useCallback(async () => {
    const params = {};
    if (filter !== '') params.is_seen = filter;
    const res = await notificationsApi.getAll(params);
    setNotifications(res.data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const markSeen = async (id) => {
    await notificationsApi.markSeen(id);
    load();
  };

  const markAllSeen = async () => {
    await notificationsApi.markAllSeen({});
    load();
  };

  const triggerCheck = async () => {
    setTriggering(true);
    await notificationsApi.triggerCheck();
    await load();
    setTriggering(false);
  };

  const typeIcon = { '30_days': '📅', '7_days': '⏰', expired: '🔴', reminder: '📢' };
  const typeBg = { '30_days': 'bg-yellow-50 border-yellow-200', '7_days': 'bg-orange-50 border-orange-200', expired: 'bg-red-50 border-red-200', reminder: 'bg-blue-50 border-blue-200' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{notifications.length} notifications</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button onClick={triggerCheck} disabled={triggering}
              className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {triggering ? 'Checking...' : '🔄 Run Check'}
            </button>
            <button onClick={markAllSeen} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Mark All Seen
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-4 p-4 border-b flex gap-3">
        {[['', 'All'], ['0', 'Unseen'], ['1', 'Seen']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === val ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🔔</div>
            <p>No notifications found</p>
          </div>
        ) : notifications.map((n) => (
          <div key={n.id} className={`bg-white rounded-xl shadow-sm border p-5 flex items-start gap-4 ${!n.is_seen ? typeBg[n.type] || 'bg-gray-50 border-gray-200' : 'border-gray-100'}`}>
            <span className="text-2xl mt-0.5">{typeIcon[n.type] || '🔔'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <p className={`text-sm ${n.is_seen ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>{n.message}</p>
                {!n.is_seen && canWrite && (
                  <button onClick={() => markSeen(n.id)} className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
                    Mark seen
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-xs text-gray-500">👤 {n.customer_name}</span>
                <span className="text-xs text-gray-400">📧 {n.customer_email}</span>
                <Badge status={n.type} />
                <span className={`text-xs px-2 py-0.5 rounded-full ${n.is_seen ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {n.is_seen ? '✓ Seen' : '● Unseen'}
                </span>
                <span className="text-xs text-gray-400">{new Date(n.sent_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
