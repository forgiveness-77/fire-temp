import { useEffect, useState, useCallback } from 'react';
import { extinguishersApi, customersApi } from '../api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

const empty = { customer_id: '', serial_number: '', type: '', location: '', purchase_date: '', expiry_date: '', status: 'active' };
const TYPES = ['ABC Dry Powder', 'CO2', 'Water', 'Foam', 'Wet Chemical', 'Halotron', 'Other'];

function daysLeft(date) {
  const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function Extinguishers() {
  const { canWrite } = useAuth();
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await extinguishersApi.getAll({ search: search || undefined, status: statusFilter || undefined });
    setItems(res.data);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { customersApi.getAll().then((r) => setCustomers(r.data)); }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal(true); };
  const openEdit = (e) => {
    setForm({ customer_id: e.customer_id, serial_number: e.serial_number || '', type: e.type, location: e.location || '', purchase_date: e.purchase_date, expiry_date: e.expiry_date, status: e.status });
    setEditing(e.id); setError(''); setModal(true);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    try {
      if (editing) await extinguishersApi.update(editing, form);
      else await extinguishersApi.create(form);
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this extinguisher?')) return;
    await extinguishersApi.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fire Extinguishers</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} records shown</p>
        </div>
        {canWrite && (
          <button onClick={openAdd} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Add Extinguisher
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-4">
        <div className="p-4 border-b flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search serial, type, location, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="replaced">Replaced</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Serial / Type</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Purchase Date</th>
                <th className="px-4 py-3 text-left">Expiry Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">{canWrite ? 'Actions' : ''}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No extinguishers found</td></tr>
              ) : items.map((e) => {
                const days = daysLeft(e.expiry_date);
                const rowClass = days <= 0 ? 'bg-red-50' : days <= 7 ? 'bg-orange-50' : days <= 30 ? 'bg-yellow-50' : '';
                return (
                  <tr key={e.id} className={`hover:opacity-90 transition-colors ${rowClass}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{e.customer_name}</div>
                      <div className="text-gray-400 text-xs">{e.customer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-gray-700">{e.serial_number || '—'}</div>
                      <div className="text-gray-500 text-xs">{e.type}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.location || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(e.purchase_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{new Date(e.expiry_date).toLocaleDateString()}</div>
                      <div className={`text-xs font-medium ${days <= 0 ? 'text-red-600' : days <= 7 ? 'text-orange-600' : days <= 30 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {days <= 0 ? `Expired ${Math.abs(days)} day(s) ago` : `${days} day(s) left`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center"><Badge status={e.status} /></td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {canWrite && (
                        <>
                          <button onClick={() => openEdit(e)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Extinguisher' : 'Add Extinguisher'} onClose={() => setModal(false)} size="lg">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {error && <div className="col-span-2 bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="e.g. EXT-2024-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                <option value="">Select type...</option>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="e.g. Building A, Floor 2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
              <input required type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input required type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            {editing && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="replaced">Replaced</option>
                </select>
              </div>
            )}
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                {editing ? 'Update' : 'Add Extinguisher'}
              </button>
              <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-200 hover:bg-gray-50 py-2 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
