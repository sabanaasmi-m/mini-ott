import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import './styles/AddFilm.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const LANGUAGES = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Other'];

const AddFilm = () => {
  const navigate = useNavigate();
  const videoRef = useRef();
  const thumbRef = useRef();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    language: '',
    duration_minutes: '',
    is_premium: false,
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ video: 0, thumb: 0 });
  const [step, setStep] = useState('');

  useEffect(() => {
    api.get('categories/').then(res => {
      setCategories(res.data?.results || res.data || []);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleThumbChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const uploadToSupabase = async (file, folder, onProgress) => {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('shortfilms')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw new Error(error.message);
    onProgress(100);

    const { data: urlData } = supabase.storage
      .from('shortfilms')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) { Swal.fire('Error', 'Title is required', 'error'); return; }
    if (!form.category) { Swal.fire('Error', 'Please select a category', 'error'); return; }
    if (!videoFile) { Swal.fire('Error', 'Please select a video file', 'error'); return; }

    setUploading(true);
    try {
      let videoUrl = '';
      let thumbnailUrl = '';

      // Upload video
      setStep('Uploading video to Supabase...');
      videoUrl = await uploadToSupabase(videoFile, 'videos', (p) =>
        setUploadProgress(prev => ({ ...prev, video: p }))
      );

      // Upload thumbnail if provided
      if (thumbFile) {
        setStep('Uploading thumbnail...');
        thumbnailUrl = await uploadToSupabase(thumbFile, 'thumbnails', (p) =>
          setUploadProgress(prev => ({ ...prev, thumb: p }))
        );
      }

      // Save to Django backend
      setStep('Saving film details...');
      const payload = {
        ...form,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || '',
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      };

      await api.post('shortfilms/', payload);

      Swal.fire({
        icon: 'success',
        title: 'Film Uploaded!',
        text: 'Film has been submitted for approval.',
        confirmButtonColor: '#e50914',
      }).then(() => navigate('/films'));

    } catch (err) {
      console.error(err);
      Swal.fire('Upload Failed', err.message || 'Something went wrong', 'error');
    } finally {
      setUploading(false);
      setStep('');
    }
  };

  return (
    <div className="add-film-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Film</h1>
          <p className="page-subtitle">Upload a short film to the platform</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/films')}>← Back to Films</button>
      </div>

      <form onSubmit={handleSubmit} className="add-film-form">
        <div className="form-grid">

          {/* Left Column */}
          <div className="form-left">
            <div className="form-section">
              <h3 className="form-section-title">📋 Film Details</h3>

              <div className="form-group">
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Enter film title" required />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Write a compelling description..." rows={5} required />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Language</label>
                  <select name="language" value={form.language} onChange={handleChange}>
                    <option value="">Select language</option>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input type="number" name="duration_minutes" value={form.duration_minutes}
                    onChange={handleChange} placeholder="e.g. 15" min="1" max="999" />
                </div>
                <div className="form-group form-group-check-lg">
                  <label>Content Type</label>
                  <label className="toggle-label">
                    <input type="checkbox" name="is_premium" checked={form.is_premium} onChange={handleChange} />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">{form.is_premium ? '👑 Premium' : '🆓 Free'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="form-right">
            <div className="form-section">
              <h3 className="form-section-title">🎬 Media Files</h3>

              {/* Thumbnail Upload */}
              <div className="form-group">
                <label>Thumbnail Image</label>
                <div className="upload-box thumb-box" onClick={() => thumbRef.current.click()}>
                  {thumbPreview ? (
                    <img src={thumbPreview} alt="thumbnail" className="thumb-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span>🖼️</span>
                      <p>Click to upload thumbnail</p>
                      <small>JPG, PNG, WEBP — recommended 16:9</small>
                    </div>
                  )}
                  <input type="file" ref={thumbRef} accept="image/*" onChange={handleThumbChange} style={{ display: 'none' }} />
                </div>
                {thumbPreview && (
                  <button type="button" className="btn-remove" onClick={() => { setThumbFile(null); setThumbPreview(''); }}>
                    ✕ Remove
                  </button>
                )}
              </div>

              {/* Video Upload */}
              <div className="form-group">
                <label>Video File *</label>
                <div className={`upload-box video-box ${videoFile ? 'has-file' : ''}`} onClick={() => videoRef.current.click()}>
                  {videoFile ? (
                    <div className="video-selected">
                      <span>🎬</span>
                      <div>
                        <p className="video-name">{videoFile.name}</p>
                        <p className="video-size">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span>📹</span>
                      <p>Click to select video file</p>
                      <small>MP4, MOV, AVI, MKV</small>
                    </div>
                  )}
                  <input type="file" ref={videoRef} accept="video/*" onChange={e => setVideoFile(e.target.files[0])} style={{ display: 'none' }} />
                </div>
                {videoFile && (
                  <button type="button" className="btn-remove" onClick={() => setVideoFile(null)}>
                    ✕ Remove
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="upload-progress">
                  <p className="upload-step">{step}</p>
                  {uploadProgress.video > 0 && (
                    <div className="progress-item">
                      <span>Video</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uploadProgress.video}%` }}></div>
                      </div>
                      <span>{uploadProgress.video}%</span>
                    </div>
                  )}
                  {uploadProgress.thumb > 0 && (
                    <div className="progress-item">
                      <span>Thumbnail</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uploadProgress.thumb}%` }}></div>
                      </div>
                      <span>{uploadProgress.thumb}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="form-submit">
          <button type="button" className="btn-cancel-form" onClick={() => navigate('/films')} disabled={uploading}>
            Cancel
          </button>
          <button type="submit" className="btn-submit-film" disabled={uploading}>
            {uploading ? (
              <span>⏳ {step || 'Uploading...'}</span>
            ) : (
              '🚀 Upload Film'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFilm;