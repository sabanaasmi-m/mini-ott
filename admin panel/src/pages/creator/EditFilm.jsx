import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import Swal from 'sweetalert2'
import '../styles/Films.css'
// import '../styles/UploadFilm.css'

const LANGUAGES = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Other']

const EditFilm = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const thumbInputRef = useRef()

  const [categories, setCategories] = useState([])
  const [film, setFilm] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', category: '', language: '', duration_minutes: '', is_premium: false })
  const [thumbFile, setThumbFile] = useState(null)
  const [thumbPreview, setThumbPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    try {
      const [filmRes, catsRes] = await Promise.all([
        api.get(`shortfilms/${id}/`),
        api.get('categories/')
      ])
      const f = filmRes.data
      // Security: ensure creator owns this film
      if (f.uploaded_by !== user?.id && user?.role !== 'ADMIN') {
        Swal.fire('Access Denied', 'You can only edit your own films', 'error')
        navigate('/creator/films')
        return
      }
      setFilm(f)
      setForm({
        title: f.title || '',
        description: f.description || '',
        category: f.category || '',
        language: f.language || '',
        duration_minutes: f.duration_minutes || '',
        is_premium: f.is_premium || false,
      })
      setThumbPreview(f.thumbnail_url || '')
      setCategories(catsRes.data?.results || catsRes.data || [])
    } catch {
      Swal.fire('Error', 'Could not load film', 'error')
      navigate('/creator/films')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleThumb = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setThumbFile(file)
    setThumbPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return Swal.fire('Error', 'Title is required', 'error')
    setSaving(true)
    try {
      let thumbnailUrl = film.thumbnail_url || ''

      if (thumbFile) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
        const ext = thumbFile.name.split('.').pop()
        const path = `thumbnails/${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('shortfilms').upload(path, thumbFile, { upsert: false })
        if (!error) {
          const { data } = supabase.storage.from('shortfilms').getPublicUrl(path)
          thumbnailUrl = data.publicUrl
        }
      }

      await api.patch(`shortfilms/${id}/`, {
        ...form,
        thumbnail_url: thumbnailUrl,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        status: 'PENDING', // resubmit for approval after edit
      })

      Swal.fire({
        icon: 'success',
        title: 'Film Updated!',
        text: 'Resubmitted for admin approval.',
        background: '#111118', color: '#f0f0e8', confirmButtonColor: '#f5a623',
      }).then(() => navigate('/creator/films'))
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.detail || 'Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className="upload-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Film</h1>
          <p className="page-subtitle">Update your film details — will be resubmitted for review</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/creator/films')}>← Back</button>
      </div>

      {film?.status === 'REJECTED' && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', padding: '14px 18px', borderRadius: 'var(--radius)', marginBottom: 20, fontSize: 14 }}>
          ❌ This film was rejected by admin. Fix the issues and resubmit.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="upload-grid">
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 20 }}>📋 Film Details</h3>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input name="title" className="form-input" value={form.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea name="description" className="form-textarea" value={form.description} onChange={handleChange} rows={5} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select name="category" className="form-select" value={form.category} onChange={handleChange} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select name="language" className="form-select" value={form.language} onChange={handleChange}>
                  <option value="">Select language</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input type="number" name="duration_minutes" className="form-input" value={form.duration_minutes} onChange={handleChange} min="1" max="999" />
              </div>
              <div className="form-group">
                <label className="form-label">Content Type</label>
                <div className="premium-toggle">
                  <label className="toggle-switch">
                    <input type="checkbox" name="is_premium" checked={form.is_premium} onChange={handleChange} />
                    <span className="toggle-track"><span className="toggle-thumb" /></span>
                  </label>
                  <span className="toggle-label-text">{form.is_premium ? '👑 Premium' : '🆓 Free'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 20 }}>🖼️ Thumbnail</h3>
            <div className="form-group">
              <label className="form-label">Update Thumbnail <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
              <div className="upload-drop-zone thumb-zone" onClick={() => thumbInputRef.current.click()}>
                {thumbPreview ? (
                  <img src={thumbPreview} alt="preview" className="thumb-img-preview" />
                ) : (
                  <div className="drop-placeholder">
                    <span className="drop-icon">🖼️</span>
                    <p>Click to upload new thumbnail</p>
                  </div>
                )}
                <input type="file" ref={thumbInputRef} accept="image/*" onChange={handleThumb} style={{ display: 'none' }} />
              </div>
              {thumbFile && (
                <button type="button" className="btn-remove-file" onClick={() => { setThumbFile(null); setThumbPreview(film?.thumbnail_url || '') }}>
                  ✕ Revert to original
                </button>
              )}
            </div>

            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, marginTop: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                ℹ️ Editing will resubmit this film for admin approval. It will be set back to <strong style={{ color: '#f59e0b' }}>PENDING</strong> status.
              </p>
            </div>
          </div>
        </div>

        <div className="upload-submit">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/creator/films')} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving...</> : '💾 Save & Resubmit'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditFilm
