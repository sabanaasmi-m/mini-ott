import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import './styles/Profile.css';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [tab,  setTab]  = useState('profile');
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    email:      user?.email      || '',
  });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving,    setSaving]    = useState(false);
  const [pwError,   setPwError]   = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('auth/profile/', profile);
      updateUser(res.data);
      Swal.fire({ icon: 'success', title: 'Profile updated!', timer: 1400, showConfirmButton: false, background: '#111', color: '#f2f0ea' });
    } catch {
      Swal.fire('Error', 'Failed to update profile', 'error');
    } finally { setSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwError('');
    if (passwords.new_password !== passwords.confirm) { setPwError("Passwords don't match."); return; }
    if (passwords.new_password.length < 6) { setPwError('Minimum 6 characters.'); return; }
    setSaving(true);
    try {
      await api.post('auth/change-password/', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: '', new_password: '', confirm: '' });
      Swal.fire({ icon: 'success', title: 'Password changed!', timer: 1400, showConfirmButton: false, background: '#111', color: '#f2f0ea' });
    } catch (err) {
      setPwError(err?.response?.data?.detail || 'Incorrect current password.');
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { id: 'profile',  icon: '👤', label: 'Profile' },
    { id: 'security', icon: '🔒', label: 'Security' },
    { id: 'account',  icon: 'ℹ️', label: 'Account' },
  ];

  return (
    <div className="profile-page">
      <div className="profile-inner container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar-lg">{(user?.username || 'U')[0].toUpperCase()}</div>
          <div className="profile-header-info">
            <h1 className="profile-username">{user?.username}</h1>
            <p className="profile-email">{user?.email || 'No email set'}</p>
            <div className="profile-badges">
              <span className="badge badge-free">Viewer</span>
              {user?.is_subscribed && <span className="badge badge-premium">👑 Premium</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>

        <div className="profile-layout">
          {/* Tabs */}
          <div className="profile-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`profile-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
            <Link to="/watchlist" className="profile-tab">
              <span>🔖</span><span>Watchlist</span>
            </Link>
            <Link to="/subscriptions" className="profile-tab">
              <span>👑</span><span>Plans</span>
            </Link>
          </div>

          {/* Content */}
          <div className="profile-content">
            {/* Profile tab */}
            {tab === 'profile' && (
              <div className="profile-card">
                <h2 className="profile-card-title">Profile Information</h2>
                <form onSubmit={handleProfileSave}>
                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-input" value={profile.first_name}
                        onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                        placeholder="First name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-input" value={profile.last_name}
                        onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                        placeholder="Last name" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input className="form-input" value={user?.username || ''} disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                    <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Username cannot be changed.</p>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : '💾 Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Security tab */}
            {tab === 'security' && (
              <div className="profile-card">
                <h2 className="profile-card-title">Change Password</h2>
                <form onSubmit={handlePasswordSave}>
                  {pwError && <div className="error-text" style={{ marginBottom: 18 }}>{pwError}</div>}
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-input" value={passwords.old_password}
                      onChange={e => setPasswords(p => ({ ...p, old_password: e.target.value }))}
                      placeholder="Enter current password" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-input" value={passwords.new_password}
                      onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                      placeholder="Min. 6 characters" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input type="password" className="form-input" value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="Repeat new password" required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Changing…' : '🔒 Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Account tab */}
            {tab === 'account' && (
              <div className="profile-card">
                <h2 className="profile-card-title">Account Information</h2>
                <div className="account-info">
                  {[
                    ['User ID',      `#${user?.id}`],
                    ['Username',     user?.username],
                    ['Role',         user?.role || 'VIEWER'],
                    ['Subscription', user?.is_subscribed ? `👑 ${user?.plan_name || 'Premium'} — Active` : 'Free Plan'],
                    user?.is_subscribed && ['Valid Till', user?.subscription_end ? new Date(user.subscription_end).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
                    user?.is_subscribed && ['Days Remaining', `${user?.days_remaining || 0} days`],
                  ].filter(Boolean).map(([lbl, val]) => (
                    <div key={lbl} className="account-row">
                      <span className="account-label">{lbl}</span>
                      <span className="account-value">{val}</span>
                    </div>
                  ))}
                </div>
                {!user?.is_subscribed && (
                  <div className="upgrade-banner">
                    <div>
                      <strong>Upgrade to Premium</strong>
                      <p>Unlock all premium films for just ₹99/month</p>
                    </div>
                    <Link to="/subscriptions" className="btn btn-gold btn-sm">Upgrade</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;