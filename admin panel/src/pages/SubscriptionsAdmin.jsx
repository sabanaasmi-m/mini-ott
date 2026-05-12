import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/Subscriptions.css';

const PLAN_TYPES = ['FREE', 'MONTHLY', 'YEARLY'];

const SubscriptionsAdmin = () => {
  const [plans, setPlans] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  const [form, setForm] = useState({
    name: '',
    plan_type: 'MONTHLY',
    price: '',
    duration_days: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
    fetchSubscribers();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('subscriptions/plans/');
      setPlans(res.data?.results || res.data || []);
    } catch { } finally { setLoading(false); }
  };

  const fetchSubscribers = async () => {
    try {
      const res = await api.get('subscriptions/subscribers/');
      // Ensure it's always an array regardless of API response shape
      const data = res.data;
      if (Array.isArray(data)) setSubscribers(data);
      else if (Array.isArray(data?.results)) setSubscribers(data.results);
      else setSubscribers([]);
    } catch {
      setSubscribers([]);
    }
  };

  const openAdd = () => {
    setEditPlan(null);
    setForm({
      name: '',
      plan_type: 'MONTHLY',
      price: '',
      duration_days: '',
      description: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditPlan(plan);
    setForm({
      name: plan.name || '',
      plan_type: plan.plan_type || 'MONTHLY',
      price: plan.price || '',
      duration_days: plan.duration_days || '',
      description: plan.description || '',
      is_active: plan.is_active !== false,
    });
    setShowModal(true);
  };

  // BUG FIX 3: handleSave with proper POST/PATCH
  const handleSave = async () => {
    if (!form.name.trim()) { Swal.fire('Error', 'Plan name is required', 'error'); return; }
    if (!form.price && form.plan_type !== 'FREE') { Swal.fire('Error', 'Price is required', 'error'); return; }
    if (!form.duration_days && form.plan_type !== 'FREE') { Swal.fire('Error', 'Duration is required', 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        plan_type: form.plan_type,
        price: parseFloat(form.price) || 0,
        duration_days: parseInt(form.duration_days) || 0,
        description: form.description,
        is_active: form.is_active,
      };

      if (editPlan) {
        const res = await api.patch(`subscriptions/plans/${editPlan.id}/`, payload);
        setPlans(prev => prev.map(p => p.id === editPlan.id ? res.data : p));
        Swal.fire({ icon: 'success', title: 'Plan Updated!', timer: 1200, showConfirmButton: false });
      } else {
        const res = await api.post('subscriptions/plans/', payload);
        setPlans(prev => [...prev, res.data]);
        Swal.fire({ icon: 'success', title: 'Plan Created!', timer: 1200, showConfirmButton: false });
      }
      setShowModal(false);
    } catch (err) {
      Swal.fire('Error', JSON.stringify(err?.response?.data) || 'Failed to save plan', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Delete "${name}"?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e50914', confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`subscriptions/plans/${id}/`);
      setPlans(prev => prev.filter(p => p.id !== id));
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
    } catch { Swal.fire('Error', 'Could not delete plan', 'error'); }
  };

  const togglePlanActive = async (plan) => {
    try {
      const res = await api.patch(`subscriptions/plans/${plan.id}/`, { is_active: !plan.is_active });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: res.data.is_active } : p));
    } catch { Swal.fire('Error', 'Failed to update plan status', 'error'); }
  };

  const totalRevenue = Array.isArray(subscribers)
    ? subscribers.reduce((sum, s) => sum + parseFloat(s.plan?.price || s.price || 0), 0)
    : 0;

  return (
    <div className="subscriptions-admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">{plans.length} plan{plans.length !== 1 ? 's' : ''} • {subscribers.length} active subscribers</p>
        </div>
        {/* BUG FIX 3: Add Plan button is always visible */}
        <button className="btn-primary-red" onClick={openAdd}>+ Add Plan</button>
      </div>

      {/* Tabs */}
      <div className="subs-tabs">
        <button className={`subs-tab ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>
          📦 Plans ({plans.length})
        </button>
        <button className={`subs-tab ${activeTab === 'subscribers' ? 'active' : ''}`} onClick={() => setActiveTab('subscribers')}>
          👥 Subscribers ({subscribers.length})
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <>
          {loading ? (
            <div className="loading-spinner"><div className="spinner-border"></div></div>
          ) : plans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3 className="empty-state-title">No plans yet</h3>
              <p className="empty-state-description">Create your first subscription plan.</p>
              <button className="btn-primary-red" style={{ marginTop: 12 }} onClick={openAdd}>+ Add First Plan</button>
            </div>
          ) : (
            <div className="plans-grid">
              {plans.map(plan => (
                <div key={plan.id} className={`plan-admin-card ${!plan.is_active ? 'inactive' : ''}`}>
                  <div className="plan-admin-header">
                    <div>
                      <h3 className="plan-admin-name">{plan.name}</h3>
                      <span className={`plan-type-badge type-${plan.plan_type?.toLowerCase()}`}>
                        {plan.plan_type}
                      </span>
                    </div>
                    <div className="plan-admin-price">
                      ₹{plan.price}
                      <span>/{plan.duration_days} days</span>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="plan-admin-desc">{plan.description}</p>
                  )}

                  <div className="plan-admin-footer">
                    <button
                      className={`toggle-active ${plan.is_active ? 'active' : 'inactive'}`}
                      onClick={() => togglePlanActive(plan)}
                    >
                      {plan.is_active ? '● Active' : '○ Inactive'}
                    </button>
                    <div className="action-buttons">
                      <button className="btn-action btn-edit" onClick={() => openEdit(plan)}>✏️</button>
                      <button className="btn-action btn-delete" onClick={() => handleDelete(plan.id, plan.name)}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div className="content-section">
          <div className="section-header" style={{ marginBottom: 18 }}>
            <h2 className="section-title">Active Subscribers</h2>
            <div style={{ fontSize: 13, color: '#b3b3b3' }}>
              Est. Revenue: <strong style={{ color: '#00cc66' }}>₹{totalRevenue.toFixed(2)}</strong>
            </div>
          </div>

          {subscribers.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">👥</div>
              <h3 className="empty-state-title">No subscribers yet</h3>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Price</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub, idx) => (
                    <tr key={sub.id || idx}>
                      <td style={{ fontWeight: 600 }}>{sub.user_name || sub.username || `User #${sub.user}`}</td>
                      <td>{sub.plan?.name || sub.plan_name || '—'}</td>
                      <td>₹{sub.plan?.price || sub.price || '—'}</td>
                      <td style={{ fontSize: 13, color: '#b3b3b3' }}>
                        {sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ fontSize: 13, color: '#b3b3b3' }}>
                        {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <span className={`badge-custom ${sub.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {sub.is_active ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal - BUG FIX 3: Save button always visible */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editPlan ? 'Edit Plan' : 'Add New Plan'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Plan Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Monthly Basic, Annual Premium"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label>Plan Type *</label>
                  <select value={form.plan_type} onChange={e => setForm({ ...form, plan_type: e.target.value })}>
                    {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 99"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Duration (days) *</label>
                <input
                  type="number" min="1"
                  value={form.duration_days}
                  onChange={e => setForm({ ...form, duration_days: e.target.value })}
                  placeholder="e.g. 30 for monthly, 365 for annual"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of what's included..."
                  rows={3}
                  style={{ background: '#2a2a2a', border: '1px solid #3a3a3a', color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group-check">
                <input
                  type="checkbox"
                  id="planActive"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                />
                <label htmlFor="planActive">Active (visible to users)</label>
              </div>
            </div>

            {/* BUG FIX 3: Save button always at bottom of modal, clearly visible */}
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </button>
              <button className="btn-save-modal" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editPlan ? '💾 Update Plan' : '✅ Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsAdmin;