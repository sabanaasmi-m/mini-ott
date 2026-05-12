import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/Plans.css';

const PLAN_TYPES = ['FREE', 'MONTHLY', 'YEARLY', 'CUSTOM'];

const emptyForm = { name: '', plan_type: 'MONTHLY', price: '', duration_days: '30', description: '', is_active: true };

const Plans = () => {
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(emptyForm);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('subscriptions/plans/');
      setPlans(res.data?.results || res.data || []);
    } catch { } finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({
      name: plan.name, plan_type: plan.plan_type, price: plan.price,
      duration_days: plan.duration_days, description: plan.description || '', is_active: plan.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      Swal.fire('Error', 'Name and price are required', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), duration_days: parseInt(form.duration_days) };
      if (editing) {
        const res = await api.patch(`subscriptions/plans/${editing.id}/`, payload);
        setPlans(prev => prev.map(p => p.id === editing.id ? res.data : p));
        Swal.fire({ icon: 'success', title: 'Plan Updated!', timer: 1400, showConfirmButton: false, background: '#111', color: '#f0f0e8' });
      } else {
        const res = await api.post('subscriptions/plans/', payload);
        setPlans(prev => [...prev, res.data]);
        Swal.fire({ icon: 'success', title: 'Plan Created!', timer: 1400, showConfirmButton: false, background: '#111', color: '#f0f0e8' });
      }
      setShowModal(false);
    } catch (err) {
      Swal.fire('Error', JSON.stringify(err?.response?.data) || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Delete "${name}"?`, icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e50914', confirmButtonText: 'Delete',
      background: '#111', color: '#f0f0e8',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`subscriptions/plans/${id}/`);
      setPlans(prev => prev.filter(p => p.id !== id));
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false, background: '#111', color: '#f0f0e8' });
    } catch { Swal.fire('Error', 'Could not delete plan', 'error'); }
  };

  const toggleActive = async (plan) => {
    try {
      const res = await api.patch(`subscriptions/plans/${plan.id}/`, { is_active: !plan.is_active });
      setPlans(prev => prev.map(p => p.id === plan.id ? res.data : p));
    } catch { Swal.fire('Error', 'Failed to update status', 'error'); }
  };

  const setDurationPreset = (days) => setForm(prev => ({ ...prev, duration_days: String(days) }));

  return (
    <div className="plans-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">{plans.length} plan{plans.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="btn-primary-red" onClick={openAdd}>+ New Plan</button>
      </div>

      {/* Stats row */}
      <div className="plans-stats">
        <div className="plan-stat">
          <span className="ps-val">{plans.length}</span>
          <span className="ps-lbl">Total Plans</span>
        </div>
        <div className="plan-stat">
          <span className="ps-val">{plans.filter(p => p.is_active).length}</span>
          <span className="ps-lbl">Active</span>
        </div>
        <div className="plan-stat">
          <span className="ps-val">₹{Math.max(...plans.filter(p => p.price > 0).map(p => p.price), 0)}</span>
          <span className="ps-lbl">Highest Price</span>
        </div>
        <div className="plan-stat">
          <span className="ps-val">{plans.filter(p => p.plan_type === 'YEARLY').length}</span>
          <span className="ps-lbl">Yearly Plans</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner-border"></div></div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <h3 className="empty-state-title">No plans yet</h3>
          <p className="empty-state-description">Create your first subscription plan to start monetising.</p>
          <button className="btn-primary-red" style={{ marginTop: 12 }} onClick={openAdd}>+ Create First Plan</button>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map(plan => (
            <div key={plan.id} className={`plan-card-admin ${!plan.is_active ? 'inactive' : ''}`}>
              <div className="pca-header">
                <div>
                  <h3 className="pca-name">{plan.name}</h3>
                  <span className={`pca-type type-${plan.plan_type.toLowerCase()}`}>{plan.plan_type}</span>
                </div>
                <div className="pca-price">
                  {plan.price == 0 ? (
                    <span className="price-free-tag">FREE</span>
                  ) : (
                    <span>₹{parseFloat(plan.price).toFixed(0)}</span>
                  )}
                  <small className="pca-duration">/ {plan.duration_days}d</small>
                </div>
              </div>

              {plan.description && <p className="pca-desc">{plan.description}</p>}

              <div className="pca-meta">
                <span>⏱ {plan.duration_days === 365 ? '1 year' : plan.duration_days === 30 ? '1 month' : `${plan.duration_days} days`}</span>
                <span>💰 ₹{(plan.price / plan.duration_days * 30).toFixed(1)}/mo equiv</span>
              </div>

              <div className="pca-footer">
                <button
                  className={`toggle-status-btn ${plan.is_active ? 'active' : 'inactive'}`}
                  onClick={() => toggleActive(plan)}
                >
                  {plan.is_active ? '● Active' : '○ Inactive'}
                </button>
                <div className="pca-actions">
                  <button className="btn-action btn-edit" onClick={() => openEdit(plan)} title="Edit">✏️</button>
                  <button className="btn-action btn-delete" onClick={() => handleDelete(plan.id, plan.name)} title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box plan-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Plan' : 'Create New Plan'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Plan Name *</label>
                <input className="form-input" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Monthly Premium" />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Plan Type *</label>
                  <select className="form-select" value={form.plan_type}
                    onChange={e => setForm(p => ({ ...p, plan_type: e.target.value }))}>
                    {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" className="form-input" value={form.price} min="0" step="0.01"
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="0 = Free" />
                </div>
              </div>

              <div className="form-group">
                <label>Duration (days) *</label>
                <div className="duration-presets">
                  {[7, 30, 90, 180, 365].map(d => (
                    <button key={d} type="button"
                      className={`preset-btn ${form.duration_days == d ? 'active' : ''}`}
                      onClick={() => setDurationPreset(d)}>
                      {d === 7 ? '1 week' : d === 30 ? '1 mo' : d === 90 ? '3 mo' : d === 180 ? '6 mo' : '1 yr'}
                    </button>
                  ))}
                </div>
                <input type="number" className="form-input" value={form.duration_days} min="1"
                  onChange={e => setForm(p => ({ ...p, duration_days: e.target.value }))}
                  placeholder="e.g. 30" style={{ marginTop: 8 }} />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea className="form-textarea" value={form.description} rows={3}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What's included in this plan?" />
              </div>

              <div className="form-group-check" style={{ marginTop: 8 }}>
                <input type="checkbox" id="isActive" checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                <label htmlFor="isActive">Active (visible to users)</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-save-modal" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;