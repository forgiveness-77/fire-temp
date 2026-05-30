import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '../api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'manager', 'viewer'];
const empty = { username: '', password: '', name: '', email: '', role: 'manager' };

const roleBadge = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  viewer: 'bg-gray-100 text-gray-700',
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await usersApi.getAll();
    setUsers(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(empty); setEditing(null); setError(''); setModal('form'); };
  const openEdit = (u) => {
    setForm({ username: u.username, password: '', name: u.name, email: u.email || '', role: u.role });
    setEditing(u.id);
    setError('');
    setModal('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) await usersApi.update(editing, payload);
      else await usersApi.create(payload);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"?`)) return;
    try {
      await usersApi.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const toggleActive = async (u) => {
    try {
      await usersApi.update(u.id, { is_active: u.is_active ? 0 : 1 });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage system access and roles</p>
        </div>
        <button onClick={openAdd} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Username</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-center">Role</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                <td className="px-6 py-4 text-gray-600">{u.username}</td>
                <td className="px-6 py-4 text-gray-600">{u.email || '—'}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${roleBadge[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => toggleActive(u)}
                    disabled={u.id === currentUser.id}
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} disabled:opacity-50`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                  {u.id !== currentUser.id && (
                    <button onClick={() => handleDelete(u.id, u.name)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <Modal title={editing ? 'Edit User' : 'Add User'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editing ? '(leave blank to keep current)' : '*'}
              </label>
              <input type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium">
                {editing ? 'Update' : 'Create User'}
              </button>
              <button type="button" onClick={() => setModal(null)} className="flex-1 border border-gray-200 hover:bg-gray-50 py-2 rounded-lg text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
