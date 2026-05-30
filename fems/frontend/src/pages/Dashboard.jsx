import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { extinguishersApi, notificationsApi } from '../api';

function StatCard({ label, value, icon, color, to }) {
  const card = (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${color} p-6 flex items-center gap-4 hover:shadow-md transition-shadow`}>
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      extinguishersApi.getStats(),
      notificationsApi.getAll({ is_seen: 0 }),
    ]).then(([s, n]) => {
      setStats(s.data);
      setRecentNotifs(n.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Fire Extinguisher Management Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Customers" value={stats?.customers} icon="👥" color="border-blue-500" to="/customers" />
        <StatCard label="Total Extinguishers" value={stats?.total} icon="🧯" color="border-gray-400" to="/extinguishers" />
        <StatCard label="Expired" value={stats?.expired} icon="❌" color="border-red-500" to="/extinguishers?status=expired" />
        <StatCard label="Expiring (7 days)" value={stats?.expiring7} icon="⏰" color="border-orange-500" to="/extinguishers" />
        <StatCard label="Active" value={stats?.active} icon="✅" color="border-green-500" to="/extinguishers?status=active" />
        <StatCard label="Expiring (30 days)" value={stats?.expiring30} icon="📅" color="border-yellow-500" to="/extinguishers" />
        <StatCard label="Pending Escalations" value={stats?.escalations} icon="⚠️" color="border-red-700" to="/escalations" />
        <StatCard label="Unseen Notifications" value={recentNotifs.length} icon="🔔" color="border-purple-500" to="/notifications" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Unseen Notifications</h2>
          <Link to="/notifications" className="text-sm text-red-600 hover:underline">View all</Link>
        </div>
        {recentNotifs.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No unseen notifications</p>
        ) : (
          <div className="space-y-3">
            {recentNotifs.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <span className="text-yellow-500 mt-0.5">🔔</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {n.customer_name} · {new Date(n.sent_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
