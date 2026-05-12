import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import api from '../api/axios';
import './styles/Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await api.patch('auth/profile/', profile);
      Swal.fire({ icon: 'success', title: 'Profile Updated!', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire('Error', 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      Swal.fire('Error', 'Passwords do not match', 'error');
      return;
    }
    if (passwords.new_password.length < 6) {
      Swal.fire('Error', 'Password must be at least 6 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('auth/change-password/', {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      });
      setPasswords({ old_password: '', new_password: '', confirm_password: '' });
      Swal.fire({ icon: 'success', title: 'Password Changed!', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.detail || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'security', label: '🔒 Security', icon: '🔒' },
    { id: 'platform', label: '⚙️ Platform', icon: '⚙️' },
  ];

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and platform settings</p>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-card">
              <h2 className="settings-card-title">Profile Information</h2>
              <div className="settings-avatar">
                <div className="avatar-circle">{(user?.username || 'A')[0].toUpperCase()}</div>
                <div>
                  <strong>{user?.username || 'Admin'}</strong>
                  <p style={{ color: '#b3b3b3', fontSize: 13, margin: '4px 0 0' }}>Administrator</p>
                </div>
              </div>
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      value={profile.first_name}
                      onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      value={profile.last_name}
                      onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input value={user?.username || ''} disabled className="disabled-input" />
                  <small style={{ color: '#666', fontSize: 12 }}>Username cannot be changed</small>
                </div>
                <button className="btn-save" onClick={handleProfileSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-card">
              <h2 className="settings-card-title">Security Settings</h2>
              <p style={{ color: '#b3b3b3', marginBottom: 25, fontSize: 14 }}>
                Keep your account secure by using a strong password.
              </p>
              <div className="settings-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwords.old_password}
                    onChange={e => setPasswords({ ...passwords, old_password: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwords.new_password}
                    onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm_password}
                    onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
                <button className="btn-save" onClick={handlePasswordChange} disabled={saving}>
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'platform' && (
            <div className="settings-card">
              <h2 className="settings-card-title">Platform Information</h2>
              <div className="platform-info">
                <div className="info-row"><span>Platform Name</span><strong>FilmHub</strong></div>
                <div className="info-row"><span>Backend URL</span><strong>{import.meta.env.VITE_API_URL}</strong></div>
                <div className="info-row"><span>Admin Panel Version</span><strong>1.0.0</strong></div>
                <div className="info-row"><span>API Version</span><strong>v1</strong></div>
              </div>
              <div className="settings-links">
                <h3>Quick Links</h3>
                <a href="/films/add" className="quick-link">➕ Add New Film</a>
                <a href="/categories" className="quick-link">📂 Manage Categories</a>
                <a href="/analytics" className="quick-link">📈 View Analytics</a>
                <a href="/users" className="quick-link">👥 Manage Users</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;