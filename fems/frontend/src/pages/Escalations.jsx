import { useEffect, useState, useCallback } from 'react';
import { escalationsApi } from '../api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function Escalations() {
  const { canWrite } = useAuth();
  const [escalations, setEscalations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ status: 'escalated', notes: '' });

  const load = useCallback(async () => {
    const res = await escalationsApi.getAll({ status: statusFilter || undefined });
    setEscalations(res.data);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openStatus = (e) => {
    setModal(e);
    setForm({ status: e.status === 'pending' ? 'escalated' : 'resolved', notes: e.notes || '' });
  };

  const handleStatusUpdate = async (ev) => {
    ev.preventDefault();
    await escalationsApi.updateStatus(modal.id, form);
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this escalation record?')) return;
    await escalationsApi.delete(id);
    load();
  };

  const statusIcon = { pending: '🟡', escalated: '🔴', resolved: '✅' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Escalations</h1>
          <p className="text-gray-500 text-sm mt-1">Cases reported to authorities for non-compliance</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-4 p-4 flex gap-3">
        {[['', 'All'], ['pending', 'Pending'], ['escalated', 'Escalated'], ['resolved', 'Resolved']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === val ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : escalations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">⚠️</div>
            <p>No escalations found</p>
          </div>
        ) : escalations.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{statusIcon[e.status]}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800">{e.customer_name}</span>
                    <Badge status={e.status} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{e.reason}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                    <span>📧 {e.customer_email}</span>
                    <span>📞 {e.customer_phone || '—'}</span>
                    <span>🧯 {e.extinguisher_type} · {e.serial_number || 'No S/N'}</span>
                    <span>📍 {e.location || 'No location'}</span>
                    <span>📅 Expired: {new Date(e.expiry_date).toLocaleDateString()}</span>
                    <span>🗓 Created: {new Date(e.created_at).toLocaleDateString()}</span>
                    {e.escalated_at && <span>⬆️ Escalated: {new Date(e.escalated_at).toLocaleDateString()}</span>}
                    {e.resolved_at && <span>✅ Resolved: {new Date(e.resolved_at).toLocaleDateString()}</span>}
                  </div>
                  {e.notes && (
                    <div className="mt-2 text-xs bg-gray-50 rounded px-3 py-2 text-gray-600">
                      <strong>Notes:</strong> {e.notes}
                    </div>
                  )}
                </div>
              </div>
              {canWrite && (
                <div className="flex flex-col gap-2 shrink-0">
                  {e.status !== 'resolved' && (
                    <button onClick={() => openStatus(e)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                      Update Status
                    </button>
                  )}
                  <button onClick={() => handleDelete(e.id)}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="Update Escalation Status" onClose={() => setModal(null)}>
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                <option value="pending">Pending</option>
                <option value="escalated">Escalated to Authorities</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Add notes about action taken..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium">Update</button>
              <button type="button" onClick={() => setModal(null)} className="flex-1 border border-gray-200 hover:bg-gray-50 py-2 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
