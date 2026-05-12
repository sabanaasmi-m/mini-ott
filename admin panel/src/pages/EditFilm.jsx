import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/AddFilm.css';

const LANGUAGES = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Other'];

const EditFilm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration_minutes: '',
    language: '',
    is_premium: false,
  });

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [filmRes, catsRes] = await Promise.all([
        api.get(`shortfilms/${id}/`),
        api.get('categories/'),
      ]);
      const film = filmRes.data;
      setFormData({
        title: film.title || '',
        description: film.description || '',
        category: film.category || '',
        duration_minutes: film.duration_minutes || '',
        language: film.language || '',
        is_premium: film.is_premium || false,
      });
      setCategories(catsRes.data?.results || catsRes.data || []);
    } catch {
      Swal.fire('Error', 'Failed to load film data', 'error');
      navigate('/films');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { Swal.fire('Error', 'Title is required', 'error'); return; }
    setSaving(true);
    try {
      await api.patch(`shortfilms/${id}/`, {
        ...formData,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      });
      Swal.fire({ icon: 'success', title: 'Film Updated!', timer: 1500, showConfirmButton: false });
      navigate('/films');
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.detail || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner-border"></div></div>;

  return (
    <div className="add-film-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Film</h1>
          <p className="page-subtitle">Update film details</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/films')}>← Back to Films</button>
      </div>

      <form onSubmit={handleSubmit} className="add-film-form">
        <div className="form-grid">
          <div className="form-left">
            <div className="form-section">
              <h3 className="form-section-title">📋 Film Details</h3>

              <div className="form-group">
                <label>Title *</label>
                <input name="title" value={formData.title} onChange={handleChange}
                  placeholder="Film title" required />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea name="description" value={formData.description}
                  onChange={handleChange} placeholder="Film description..." rows={5} required />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Language</label>
                  <select name="language" value={formData.language} onChange={handleChange}>
                    <option value="">Select language</option>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input type="number" name="duration_minutes" value={formData.duration_minutes}
                    onChange={handleChange} placeholder="e.g. 15" min="1" max="999" />
                </div>
                <div className="form-group form-group-check-lg">
                  <label>Content Type</label>
                  <label className="toggle-label">
                    <input type="checkbox" name="is_premium" checked={formData.is_premium}
                      onChange={handleChange} />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">{formData.is_premium ? '👑 Premium' : '🆓 Free'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="form-right">
            <div className="form-section">
              <h3 className="form-section-title">ℹ️ Edit Note</h3>
              <div style={{
                background: '#0d0d0d', border: '1px solid #2a2a2a',
                borderRadius: 10, padding: 16, fontSize: 13, color: '#b3b3b3', lineHeight: 1.7
              }}>
                <p style={{ marginBottom: 10 }}>You are editing an existing film.</p>
                <p style={{ marginBottom: 10 }}>• Status will remain unchanged.</p>
                <p style={{ marginBottom: 10 }}>• To change the video file, delete and re-upload.</p>
                <p>• Thumbnail can only be updated via the creator panel.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="form-submit">
          <button type="button" className="btn-cancel-form" onClick={() => navigate('/films')}
            disabled={saving}>Cancel</button>
          <button type="submit" className="btn-submit-film" disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditFilm;