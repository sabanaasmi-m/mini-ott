import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/Users.css';

const ROLES = ['ADMIN', 'CREATOR', 'VIEWER'];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'VIEWER', is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('users/');
      setUsers(res.data?.results || res.data || []);
    } catch { } finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditUser(null);
    setForm({ username: '', email: '', password: '', role: 'VIEWER', is_active: true });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    // BUG FIX: properly read role from profile or top-level; read is_active correctly
    const role = user.profile?.role || user.role_display || user.role || 'VIEWER';
    const isActive = typeof user.is_active === 'boolean' ? user.is_active : true;
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      role,
      is_active: isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.email) {
      Swal.fire('Error', 'Username and email are required', 'error');
      return;
    }
    setSaving(true);
    try {
      // BUG FIX: always send role and is_active so backend updates them
      const payload = {
        username: form.username,
        email: form.email,
        role: form.role,
        is_active: form.is_active,
      };
      if (form.password) payload.password = form.password;

      if (editUser) {
        const res = await api.patch(`users/${editUser.id}/`, payload);
        // BUG FIX: merge updated fields back into local state correctly
        setUsers(prev => prev.map(u => {
          if (u.id !== editUser.id) return u;
          return {
            ...u,
            ...res.data,
            // ensure role is accessible at the right path for display
            role: payload.role,
            role_display: payload.role,
            profile: { ...(u.profile || {}), role: payload.role },
            is_active: payload.is_active,
          };
        }));
        Swal.fire({ icon: 'success', title: 'User Updated!', timer: 1200, showConfirmButton: false });
      } else {
        if (!form.password) { Swal.fire('Error', 'Password required for new users', 'error'); setSaving(false); return; }
        const res = await api.post('users/', payload);
        setUsers(prev => [...prev, {
          ...res.data,
          role: payload.role,
          role_display: payload.role,
          profile: { role: payload.role },
          is_active: payload.is_active,
        }]);
        Swal.fire({ icon: 'success', title: 'User Created!', timer: 1200, showConfirmButton: false });
      }
      setShowModal(false);
    } catch (err) {
      Swal.fire('Error', JSON.stringify(err?.response?.data) || 'Failed to save user', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, username) => {
    const result = await Swal.fire({
      title: `Delete user "${username}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e50914', confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`users/${id}/`);
      setUsers(prev => prev.filter(u => u.id !== id));
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
    } catch { Swal.fire('Error', 'Could not delete user', 'error'); }
  };

  const toggleActive = async (user) => {
    const newStatus = !user.is_active;
    try {
      // BUG FIX: send role along with is_active so backend doesn't reset it
      const currentRole = user.profile?.role || user.role_display || user.role || 'VIEWER';
      await api.patch(`users/${user.id}/`, { is_active: newStatus, role: currentRole });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
    } catch { Swal.fire('Error', 'Failed to update status', 'error'); }
  };

  const getUserRole = (user) => user.profile?.role || user.role_display || user.role || 'VIEWER';
  const getUserActive = (user) => typeof user.is_active === 'boolean' ? user.is_active : true;

  const filtered = users.filter(u => {
    const matchSearch = !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const role = getUserRole(u);
    const matchRole = !filterRole || role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary-red" onClick={openAdd}>+ Add User</button>
      </div>

      <div className="users-filters">
        <input
          type="text" className="search-input-large"
          placeholder="🔍 Search by username or email..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner-border"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No users found</h3>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const role = getUserRole(user);
                const isActive = getUserActive(user);
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar-sm">{user.username[0].toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.username}</div>
                          {(user.first_name || user.last_name) && (
                            <div style={{ fontSize: 12, color: '#b3b3b3' }}>{user.first_name} {user.last_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#b3b3b3', fontSize: 13 }}>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
                    </td>
                    <td>
                      <button
                        className={`toggle-active ${isActive ? 'active' : 'inactive'}`}
                        onClick={() => toggleActive(user)}
                        title="Click to toggle active status"
                      >
                        {isActive ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td style={{ fontSize: 13, color: '#b3b3b3' }}>
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-edit" onClick={() => openEdit(user)}>✏️</button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(user.id, user.username)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Username *</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" disabled={!!editUser} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" />
              </div>
              <div className="form-group">
                <label>{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" />
              </div>
              {/* BUG FIX: Role and is_active visually match current values */}
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group-check">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                />
                <label htmlFor="isActive">Active Account</label>
              </div>
            </div>
            <br />
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-save-modal" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;