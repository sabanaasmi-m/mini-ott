import React, { useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import Swal from 'sweetalert2'
import '../styles/Settings.css'

const Settings = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
  })
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleProfileChange = (e) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePasswordChange = (e) => {
    setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await api.patch('auth/profile/', {
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
      })
      updateUser(res.data)
      Swal.fire({ icon: 'success', title: 'Profile updated!', timer: 1400, showConfirmButton: false, background: '#111118', color: '#f0f0e8' })
    } catch (err) {
      const detail = err?.response?.data
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail)
      Swal.fire('Error', msg || 'Failed to update profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm_password) {
      return Swal.fire('Error', 'New passwords do not match', 'error')
    }
    if (passwords.new_password.length < 8) {
      return Swal.fire('Error', 'Password must be at least 8 characters', 'error')
    }
    setSavingPassword(true)
    try {
      await api.post('auth/change-password/', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      })
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      Swal.fire({ icon: 'success', title: 'Password changed!', timer: 1400, showConfirmButton: false, background: '#111118', color: '#f0f0e8' })
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.detail || 'Failed to change password', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'security', label: '🔒 Security', icon: '🔒' },
    { id: 'account', label: 'ℹ️ Account Info', icon: 'ℹ️' },
  ]

  return (
    <div className="settings-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar tabs */}
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">

          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="card">
              {/* Avatar */}
              <div className="profile-avatar-section">
                <div className="settings-avatar">
                  {(user?.username || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
                    {user?.username}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Creator
                  </p>
                </div>
              </div>

              <div className="divider" />

              <form onSubmit={saveProfile}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input name="first_name" className="form-input" value={profile.first_name} onChange={handleProfileChange} placeholder="First name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input name="last_name" className="form-input" value={profile.last_name} onChange={handleProfileChange} placeholder="Last name" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input name="username" className="form-input" value={profile.username} onChange={handleProfileChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-input" value={profile.email} onChange={handleProfileChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Bio <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
                  <textarea name="bio" className="form-textarea" value={profile.bio} onChange={handleProfileChange}
                    placeholder="Tell viewers about yourself and your films..." rows={4} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile ? '...' : '💾 Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security tab */}
          {activeTab === 'security' && (
            <div className="card">
              <h3 className="section-title" style={{ marginBottom: 20 }}>🔒 Change Password</h3>
              <form onSubmit={savePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" name="current_password" className="form-input"
                    value={passwords.current_password} onChange={handlePasswordChange}
                    placeholder="Enter current password" required />
                </div>
                <div className="divider" />
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" name="new_password" className="form-input"
                    value={passwords.new_password} onChange={handlePasswordChange}
                    placeholder="At least 8 characters" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" name="confirm_password" className="form-input"
                    value={passwords.confirm_password} onChange={handlePasswordChange}
                    placeholder="Repeat new password" required />
                </div>

                {/* Password strength indicator */}
                {passwords.new_password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      {[...Array(4)].map((_, i) => {
                        const strength = passwords.new_password.length >= 8
                          ? (passwords.new_password.match(/[A-Z]/) ? 1 : 0)
                            + (passwords.new_password.match(/[0-9]/) ? 1 : 0)
                            + (passwords.new_password.match(/[^A-Za-z0-9]/) ? 1 : 0)
                            + 1
                          : 1
                        return (
                          <div key={i} className={`strength-seg ${i < strength ? `seg-${strength}` : ''}`} />
                        )
                      })}
                    </div>
                    <span className="strength-label">
                      {passwords.new_password.length < 8 ? 'Too short'
                        : passwords.new_password.match(/[A-Z]/) && passwords.new_password.match(/[0-9]/) && passwords.new_password.match(/[^A-Za-z0-9]/) ? '💪 Strong'
                        : passwords.new_password.match(/[0-9]/) ? '😐 Medium'
                        : '⚠️ Weak'}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                    {savingPassword ? '...' : '🔒 Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Account info tab */}
          {activeTab === 'account' && (
            <div className="card">
              <h3 className="section-title" style={{ marginBottom: 20 }}>ℹ️ Account Information</h3>

              <div className="account-info-grid">
                <div className="account-info-item">
                  <span className="info-label">Account Type</span>
                  <span className="info-value creator-badge">🎬 Creator</span>
                </div>
                <div className="account-info-item">
                  <span className="info-label">Username</span>
                  <span className="info-value">@{user?.username}</span>
                </div>
                <div className="account-info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user?.email || '—'}</span>
                </div>
                <div className="account-info-item">
                  <span className="info-label">User ID</span>
                  <span className="info-value" style={{ fontFamily: 'monospace', color: 'var(--text3)' }}>#{user?.id}</span>
                </div>
                <div className="account-info-item">
                  <span className="info-label">Role</span>
                  <span className="info-value">{user?.role}</span>
                </div>
              </div>

              <div className="divider" />

              <div className="creator-guidelines">
                <h4 style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>
                  📜 Creator Guidelines
                </h4>
                {[
                  { icon: '✅', text: 'Upload original content you own the rights to' },
                  { icon: '✅', text: 'Films must be in MP4, MOV, AVI, or MKV format' },
                  { icon: '✅', text: 'Add accurate titles, descriptions, and thumbnails' },
                  { icon: '❌', text: 'No copyrighted content without permission' },
                  { icon: '❌', text: 'No explicit or harmful content' },
                  { icon: '❌', text: 'No misleading titles or thumbnails' },
                ].map((rule, i) => (
                  <div key={i} className="guideline-item">
                    <span>{rule.icon}</span>
                    <span style={{ fontSize: 14, color: 'var(--text2)' }}>{rule.text}</span>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => Swal.fire({
                    title: 'Delete Account?',
                    text: 'All your films and data will be permanently deleted.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Delete',
                    background: '#111118', color: '#f0f0e8',
                  })}
                >
                  🗑️ Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
