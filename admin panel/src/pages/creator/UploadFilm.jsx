import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import api from '../../api/axios'
import Swal from 'sweetalert2'
import '../styles/UploadFilm.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const LANGUAGES = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Other']

const UploadFilm = () => {
  const navigate = useNavigate()
  const videoInputRef = useRef()
  const thumbInputRef = useRef()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    language: '', duration_minutes: '', is_premium: false,
  })
  const [videoFile, setVideoFile] = useState(null)
  const [thumbFile, setThumbFile] = useState(null)
  const [thumbPreview, setThumbPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ video: 0, thumb: 0, step: '' })

  useEffect(() => {
    api.get('categories/').then(res => {
      setCategories(res.data?.results || res.data || [])
    })
  }, [])

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

  const uploadFile = async (file, folder) => {
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('shortfilms').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('shortfilms').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return Swal.fire('Error', 'Title is required', 'error')
    if (!form.category) return Swal.fire('Error', 'Please select a category', 'error')
    if (!videoFile) return Swal.fire('Error', 'Please select a video file', 'error')

    setUploading(true)
    try {
      setProgress({ video: 0, thumb: 0, step: '📹 Uploading video...' })
      const videoUrl = await uploadFile(videoFile, 'videos')
      setProgress(p => ({ ...p, video: 100, step: '🖼️ Uploading thumbnail...' }))

      let thumbnailUrl = ''
      if (thumbFile) {
        thumbnailUrl = await uploadFile(thumbFile, 'thumbnails')
        setProgress(p => ({ ...p, thumb: 100, step: '💾 Saving film details...' }))
      } else {
        setProgress(p => ({ ...p, step: '💾 Saving film details...' }))
      }

      await api.post('shortfilms/', {
        ...form,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        status: 'PENDING',
      })

      await Swal.fire({
        icon: 'success',
        title: '🎉 Film Uploaded!',
        html: `<p style="color:#9090a0">Your film has been submitted and is now <strong style="color:#f59e0b">pending admin approval</strong>.<br>You'll see it go live once approved.</p>`,
        confirmButtonColor: '#f5a623',
        background: '#111118',
        color: '#f0f0e8',
      })
      navigate('/creator/films')
    } catch (err) {
      Swal.fire('Upload Failed', err.message || 'Something went wrong', 'error')
    } finally {
      setUploading(false)
      setProgress({ video: 0, thumb: 0, step: '' })
    }
  }

  return (
    <div className="upload-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Film</h1>
          <p className="page-subtitle">Submit your short film for review</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/creator/films')}>← Back</button>
      </div>

      {/* Upload flow notice */}
      <div className="upload-notice">
        <div className="notice-step">
          <span className="notice-num">1</span>
          <span>Fill details & upload files</span>
        </div>
        <div className="notice-arrow">→</div>
        <div className="notice-step">
          <span className="notice-num">2</span>
          <span>Admin reviews your film</span>
        </div>
        <div className="notice-arrow">→</div>
        <div className="notice-step">
          <span className="notice-num active">3</span>
          <span>Goes live on OTT website</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="upload-grid">
          {/* Left: Details */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 20 }}>📋 Film Details</h3>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input name="title" className="form-input" value={form.title}
                onChange={handleChange} placeholder="Enter an engaging title" required />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea name="description" className="form-textarea" value={form.description}
                onChange={handleChange} placeholder="Describe your film — plot, theme, what makes it unique..."
                rows={5} required />
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
                <input type="number" name="duration_minutes" className="form-input"
                  value={form.duration_minutes} onChange={handleChange}
                  placeholder="e.g. 15" min="1" max="999" />
              </div>
              <div className="form-group">
                <label className="form-label">Content Type</label>
                <div className="premium-toggle">
                  <label className="toggle-switch">
                    <input type="checkbox" name="is_premium" checked={form.is_premium} onChange={handleChange} />
                    <span className="toggle-track">
                      <span className="toggle-thumb" />
                    </span>
                  </label>
                  <span className="toggle-label-text">
                    {form.is_premium ? '👑 Premium Content' : '🆓 Free Content'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Media */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 20 }}>🎬 Media Files</h3>

            {/* Thumbnail */}
            <div className="form-group">
              <label className="form-label">Thumbnail Image <span style={{ color: 'var(--text3)' }}>(recommended)</span></label>
              <div className="upload-drop-zone thumb-zone" onClick={() => thumbInputRef.current.click()}>
                {thumbPreview ? (
                  <img src={thumbPreview} alt="preview" className="thumb-img-preview" />
                ) : (
                  <div className="drop-placeholder">
                    <span className="drop-icon">🖼️</span>
                    <p>Click to upload thumbnail</p>
                    <small>JPG, PNG, WEBP · Recommended 16:9</small>
                  </div>
                )}
                <input type="file" ref={thumbInputRef} accept="image/*" onChange={handleThumb} style={{ display: 'none' }} />
              </div>
              {thumbPreview && (
                <button type="button" className="btn-remove-file" onClick={() => { setThumbFile(null); setThumbPreview('') }}>
                  ✕ Remove thumbnail
                </button>
              )}
            </div>

            {/* Video */}
            <div className="form-group">
              <label className="form-label">Video File *</label>
              <div
                className={`upload-drop-zone video-zone ${videoFile ? 'has-file' : ''}`}
                onClick={() => videoInputRef.current.click()}
              >
                {videoFile ? (
                  <div className="video-file-info">
                    <span className="video-file-icon">🎬</span>
                    <div>
                      <p className="video-file-name">{videoFile.name}</p>
                      <p className="video-file-size">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    <span style={{ color: 'var(--green)', fontSize: 20 }}>✓</span>
                  </div>
                ) : (
                  <div className="drop-placeholder">
                    <span className="drop-icon">📹</span>
                    <p>Click to select video</p>
                    <small>MP4, MOV, AVI, MKV</small>
                  </div>
                )}
                <input type="file" ref={videoInputRef} accept="video/*"
                  onChange={e => setVideoFile(e.target.files[0])} style={{ display: 'none' }} />
              </div>
              {videoFile && (
                <button type="button" className="btn-remove-file" onClick={() => setVideoFile(null)}>
                  ✕ Remove video
                </button>
              )}
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="upload-progress-box">
                <p className="upload-step-label">{progress.step}</p>
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill"
                    style={{ width: `${progress.video > 0 ? (progress.thumb > 0 ? 100 : 60) : 20}%` }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
                  Please don't close this tab...
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="upload-submit">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/creator/films')} disabled={uploading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={uploading}>
            {uploading
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Uploading...</>
              : '🚀 Submit for Review'
            }
          </button>
        </div>
      </form>
    </div>
  )
}

export default UploadFilm