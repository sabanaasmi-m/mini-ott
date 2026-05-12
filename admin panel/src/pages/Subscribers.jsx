import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/Subscribers.css';

const Subscribers = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all'); // all | active | expired
  const [showGrant, setShowGrant] = useState(false);
  const [grantForm, setGrantForm] = useState({ user_id: '', plan_id: '' });
  const [plans,    setPlans]   = useState([]);
  const [users,    setUsers]   = useState([]);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subRes, planRes, userRes] = await Promise.all([
        api.get('subscriptions/subscribers/'),
        api.get('subscriptions/plans/'),
        api.get('users/'),
      ]);
      setData(subRes.data);
      setPlans(planRes.data?.results || planRes.data || []);
      setUsers(userRes.data?.results || userRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantForm.user_id || !grantForm.plan_id) {
      Swal.fire('Error', 'Select user and plan', 'error'); return;
    }
    setGranting(true);
    try {
      await api.post('subscriptions/grant/', grantForm);
      Swal.fire({ icon: 'success', title: 'Subscription Granted!', timer: 1400, showConfirmButton: false, background: '#111', color: '#f0f0e8' });
      setShowGrant(false);
      setGrantForm({ user_id: '', plan_id: '' });
      fetchAll();
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.error || 'Failed to grant', 'error');
    } finally { setGranting(false); }
  };

  const exportCSV = () => {
    if (!data?.subscribers?.length) return;
    const headers = 'Username,Email,Plan,Price,Start Date,End Date,Status,Payment ID';
    const rows = data.subscribers.map(s =>
      `${s.username},${s.email},${s.plan},₹${s.plan_price},${new Date(s.start_date).toLocaleDateString()},${new Date(s.end_date).toLocaleDateString()},${s.is_valid ? 'Active' : 'Expired'},${s.payment_id}`
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner-border"></div></div>;
  if (!data)   return null;

  const filtered = (data.subscribers || []).filter(s => {
    const matchFilter = filter === 'all' || (filter === 'active' ? s.is_valid : !s.is_valid);
    const matchSearch = !search || s.username.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="subscribers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscribers & Revenue</h1>
          <p className="page-subtitle">Manage subscriptions and track revenue</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline-sub" onClick={exportCSV}>⬇ Export CSV</button>
          <button className="btn-primary-red" onClick={() => setShowGrant(true)}>+ Grant Access</button>
        </div>
      </div>

      {/* Revenue stats */}
      <div className="rev-stats">
        <div className="rev-card rev-total">
          <div className="rev-icon">💰</div>
          <div>
            <p className="rev-label">Total Revenue</p>
            <h2 className="rev-value">₹{data.total_revenue?.toFixed(2)}</h2>
            <p className="rev-sub">All time</p>
          </div>
        </div>
        <div className="rev-card">
          <div className="rev-icon">👥</div>
          <div>
            <p className="rev-label">Total Subscribers</p>
            <h2 className="rev-value">{data.total_count}</h2>
            <p className="rev-sub">{data.active_count} currently active</p>
          </div>
        </div>
        <div className="rev-card">
          <div className="rev-icon">✅</div>
          <div>
            <p className="rev-label">Active Subs</p>
            <h2 className="rev-value" style={{ color: '#22c55e' }}>{data.active_count}</h2>
            <p className="rev-sub">₹{data.active_revenue?.toFixed(0)} paid</p>
          </div>
        </div>
        <div className="rev-card">
          <div className="rev-icon">📉</div>
          <div>
            <p className="rev-label">Expired / Churned</p>
            <h2 className="rev-value" style={{ color: '#ef4444' }}>{data.expired_count}</h2>
            <p className="rev-sub">Renewal opportunity</p>
          </div>
        </div>
      </div>

      {/* Revenue by plan */}
      {data.revenue_by_plan?.length > 0 && (
        <div className="content-section" style={{ marginBottom: 24 }}>
          <div className="section-header">
            <h2 className="section-title">💳 Revenue by Plan</h2>
          </div>
          <div className="plan-revenue-bars">
            {data.revenue_by_plan.map((item, i) => {
              const maxRev = Math.max(...data.revenue_by_plan.map(p => p.revenue), 1);
              return (
                <div key={i} className="rev-bar-row">
                  <span className="rev-bar-label">{item.plan}</span>
                  <div className="rev-bar-track">
                    <div className="rev-bar-fill" style={{ width: `${(item.revenue / maxRev) * 100}%` }} />
                  </div>
                  <span className="rev-bar-val">₹{item.revenue.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="sub-filters">
        <input className="search-input-large" placeholder="🔍 Search subscriber…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="filter-tabs">
          {['all', 'active', 'expired'].map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No subscribers found</h3>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Price</th>
                <th>Start</th>
                <th>Expires</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="sub-user">
                      <div className="sub-avatar">{s.username[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{s.username}</div>
                        <div style={{ fontSize: 12, color: '#b3b3b3' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-custom badge-info">{s.plan}</span></td>
                  <td><strong style={{ color: '#c9a84c' }}>₹{s.plan_price}</strong></td>
                  <td style={{ fontSize: 13, color: '#b3b3b3' }}>{new Date(s.start_date).toLocaleDateString()}</td>
                  <td style={{ fontSize: 13, color: '#b3b3b3' }}>{new Date(s.end_date).toLocaleDateString()}</td>
                  <td>
                    <span style={{ color: s.days_remaining > 7 ? '#22c55e' : s.days_remaining > 0 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                      {s.days_remaining > 0 ? `${s.days_remaining}d` : 'Expired'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-custom ${s.is_valid ? 'badge-success' : 'badge-danger'}`}>
                      {s.is_valid ? '✓ Active' : '✗ Expired'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
                    {s.payment_id?.substring(0, 18) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant modal */}
      {showGrant && (
        <div className="modal-overlay" onClick={() => setShowGrant(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Grant Subscription</h3>
              <button className="modal-close" onClick={() => setShowGrant(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: '#b3b3b3', marginBottom: 20 }}>
                Manually activate a subscription for a user (no payment required). Useful for testers, influencers, or support cases.
              </p>
              <div className="form-group">
                <label>User *</label>
                <select className="form-select" value={grantForm.user_id}
                  onChange={e => setGrantForm(p => ({ ...p, user_id: e.target.value }))}>
                  <option value="">Select user</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username} — {u.email}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Plan *</label>
                <select className="form-select" value={grantForm.plan_id}
                  onChange={e => setGrantForm(p => ({ ...p, plan_id: e.target.value }))}>
                  <option value="">Select plan</option>
                  {plans.filter(p => p.is_active && p.price > 0).map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ₹{p.price} / {p.duration_days}d</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowGrant(false)}>Cancel</button>
              <button className="btn-save-modal" onClick={handleGrant} disabled={granting}>
                {granting ? 'Granting…' : '✓ Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscribers;