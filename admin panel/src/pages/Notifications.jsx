import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/Notifications.css';

const TYPES = ['INFO', 'SUCCESS', 'WARNING', 'PROMO'];
const emptyForm = { title: '', message: '', notif_type: 'INFO', is_global: true, user: '' };

const Notifications = () => {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [users, setUsers] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [nRes, uRes] = await Promise.all([
                api.get('notifications/'),
                api.get('users/'),
            ]);
            setNotifs(nRes.data?.results || nRes.data || []);
            setUsers(uRes.data?.results || uRes.data || []);
        } catch { } finally { setLoading(false); }
    };

    const handleSend = async () => {
        if (!form.title.trim() || !form.message.trim()) {
            Swal.fire('Error', 'Title and message are required', 'error'); return;
        }
        if (!form.is_global && !form.user) {
            Swal.fire('Error', 'Select a user or enable "Send to all"', 'error'); return;
        }
        setSaving(true);
        try {
            const payload = {
                title: form.title, message: form.message,
                notif_type: form.notif_type, is_global: form.is_global,
                user: form.is_global ? null : form.user,
            };
            await api.post('notifications/', payload);
            Swal.fire({ icon: 'success', title: 'Notification Sent!', timer: 1400, showConfirmButton: false, background: '#111', color: '#f0f0e8' });
            setShowModal(false);
            setForm(emptyForm);
            fetchAll();
        } catch (err) {
            Swal.fire('Error', JSON.stringify(err?.response?.data) || 'Send failed', 'error');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete notification?', icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#e50914', confirmButtonText: 'Delete',
            background: '#111', color: '#f0f0e8',
        });
        if (!result.isConfirmed) return;
        try {
            await api.delete(`notifications/${id}/`);
            setNotifs(prev => prev.filter(n => n.id !== id));
        } catch { Swal.fire('Error', 'Could not delete', 'error'); }
    };

    const typeColor = { INFO: '#3b82f6', SUCCESS: '#22c55e', WARNING: '#f59e0b', PROMO: '#c9a84c' };
    const typeIcon = { INFO: 'ℹ️', SUCCESS: '✅', WARNING: '⚠️', PROMO: '🎁' };

    return (
        <div className="notif-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">Send announcements and promotions to users</p>
                </div>
                <button className="btn-primary-red" onClick={() => setShowModal(true)}>+ Send Notification</button>
            </div>

            {/* Quick stats */}
            <div className="notif-stats">
                {['INFO', 'SUCCESS', 'WARNING', 'PROMO'].map(t => (
                    <div key={t} className="notif-stat-pill" style={{ borderColor: typeColor[t] + '44' }}>
                        <span>{typeIcon[t]}</span>
                        <span style={{ color: typeColor[t], fontWeight: 700 }}>{notifs.filter(n => n.notif_type === t).length}</span>
                        <span style={{ color: '#b3b3b3', fontSize: 11 }}>{t}</span>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner-border"></div></div>
            ) : notifs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔔</div>
                    <h3 className="empty-state-title">No notifications yet</h3>
                    <p className="empty-state-description">Send your first announcement or promotion to your users.</p>
                </div>
            ) : (
                <div className="notif-list">
                    {notifs.map(n => (
                        <div key={n.id} className="notif-card">
                            <div className="notif-type-dot" style={{ background: typeColor[n.notif_type] }} />
                            <div className="notif-body">
                                <div className="notif-row">
                                    <span className="notif-title">{n.title}</span>
                                    <div className="notif-badges">
                                        <span className="notif-type-tag" style={{ background: typeColor[n.notif_type] + '22', color: typeColor[n.notif_type] }}>
                                            {typeIcon[n.notif_type]} {n.notif_type}
                                        </span>
                                        {n.is_global && <span className="notif-global-tag">🌍 All Users</span>}
                                        {!n.is_global && <span className="notif-user-tag">👤 Personal</span>}
                                    </div>
                                </div>
                                <p className="notif-message">{n.message}</p>
                                <p className="notif-date">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                            </div>
                            <button className="btn-action btn-delete notif-del-btn" onClick={() => handleDelete(n.id)}>🗑️</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Send Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box notif-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Send Notification</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Title *</label>
                                <input className="form-input" value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. 🎉 New films added this week!" />
                            </div>
                            <div className="form-group">
                                <label>Message *</label>
                                <textarea className="form-textarea" rows={4} value={form.message}
                                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                    placeholder="Write the full notification message here…" />
                            </div>
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select className="form-select" value={form.notif_type}
                                        onChange={e => setForm(p => ({ ...p, notif_type: e.target.value }))}>
                                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Audience</label>
                                    <div className="audience-toggle">
                                        <label className={`aud-btn ${form.is_global ? 'active' : ''}`}>
                                            <input type="radio" name="audience" checked={form.is_global}
                                                onChange={() => setForm(p => ({ ...p, is_global: true, user: '' }))} />
                                            🌍 All Users
                                        </label>
                                        <label className={`aud-btn ${!form.is_global ? 'active' : ''}`}>
                                            <input type="radio" name="audience" checked={!form.is_global}
                                                onChange={() => setForm(p => ({ ...p, is_global: false }))} />
                                            👤 Specific User
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {!form.is_global && (
                                <div className="form-group">
                                    <label>Select User *</label>
                                    <select className="form-select" value={form.user}
                                        onChange={e => setForm(p => ({ ...p, user: e.target.value }))}>
                                        <option value="">Select user…</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.username} — {u.email}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn-save-modal" onClick={handleSend} disabled={saving}>
                                {saving ? 'Sending…' : '📣 Send Notification'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;