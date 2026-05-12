import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const fileRef = useRef();

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('categories/');
      setCategories(res.data?.results || res.data || []);
    } catch { } finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditCat(null);
    setForm({ name: '', description: '' });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditCat(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setImageFile(null);
    setImagePreview(cat.image || '');
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Swal.fire('Error', 'Category name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('description', form.description);
      if (imageFile) payload.append('image', imageFile);

      if (editCat) {
        const res = await api.patch(`categories/${editCat.id}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setCategories(prev => prev.map(c => c.id === editCat.id ? res.data : c));
        Swal.fire({ icon: 'success', title: 'Category Updated!', timer: 1200, showConfirmButton: false });
      } else {
        const res = await api.post('categories/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setCategories(prev => [...prev, res.data]);
        Swal.fire({ icon: 'success', title: 'Category Created!', timer: 1200, showConfirmButton: false });
      }
      setShowModal(false);
    } catch (err) {
      Swal.fire('Error', JSON.stringify(err?.response?.data) || 'Failed to save', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Delete "${name}"?`,
      text: 'All films in this category may be affected.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#e50914', confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`categories/${id}/`);
      setCategories(prev => prev.filter(c => c.id !== id));
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
    } catch { Swal.fire('Error', 'Could not delete category', 'error'); }
  };

  const filtered = categories.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button className="btn-primary-red" onClick={openAdd}>+ Add Category</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          type="text" className="search-input-large"
          placeholder="🔍 Search categories..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner-border"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3 className="empty-state-title">No categories found</h3>
          <p className="empty-state-description">Create your first category to organize films.</p>
          <button className="btn-primary-red" style={{ marginTop: 10 }} onClick={openAdd}>+ Add Category</button>
        </div>
      ) : (
        <div className="categories-grid">
          {filtered.map(cat => (
            <div key={cat.id} className="category-card">
              <div className="category-image-wrap">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="category-image" />
                ) : (
                  <div className="category-image-placeholder">📂</div>
                )}
                <div className="category-film-count">
                  {cat.film_count ?? 0} films
                </div>
              </div>
              <div className="category-body">
                <h3 className="category-name">{cat.name}</h3>
                {cat.description && (
                  <p className="category-desc">{cat.description}</p>
                )}
              </div>
              <div className="category-actions">
                <button className="btn-cat-edit" onClick={() => openEdit(cat)}>✏️ Edit</button>
                <button className="btn-cat-delete" onClick={() => handleDelete(cat.id, cat.name)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editCat ? 'Edit Category' : 'Add Category'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Image Upload */}
              <div className="image-upload-area" onClick={() => fileRef.current.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="image-preview" />
                ) : (
                  <div className="image-upload-placeholder">
                    <span>📷</span>
                    <p>Click to upload image</p>
                    <small>JPG, PNG, WEBP</small>
                  </div>
                )}
                <input type="file" ref={fileRef} accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </div>
              {imagePreview && (
                <button className="btn-remove-image" onClick={() => { setImageFile(null); setImagePreview(''); }}>
                  ✕ Remove image
                </button>
              )}
              <div className="form-group">
                <label>Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Category name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
            </div><br />
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-save-modal" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editCat ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;