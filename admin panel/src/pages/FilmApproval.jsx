import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/FilmApproval.css';

// BUG FIX 5: Admin can preview the video before approving/rejecting
const VideoPreviewModal = ({ film, onClose }) => {
  if (!film) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="video-preview-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="video-preview-header">
          <h3>🎬 Preview: {film.title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {film.video_url ? (
          <video
            src={film.video_url}
            controls
            autoPlay
            className="video-preview-player"
          />
        ) : (
          <div className="video-preview-no-video">
            <span>📭</span>
            <p>No video URL available</p>
          </div>
        )}
        <div className="video-preview-meta">
          <span>{film.language || 'N/A'}</span>
          <span>⏱ {film.duration_minutes || '?'} min</span>
          <span>{film.is_premium ? '👑 Premium' : '🆓 Free'}</span>
          <span>By: {film.uploader_name || `User #${film.uploaded_by}`}</span>
        </div>
      </div>
    </div>
  );
};

const FilmApproval = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  // BUG FIX 5: Track which filter is active so pending films are visible by default
  const [filter, setFilter] = useState('ALL');
  const [previewFilm, setPreviewFilm] = useState(null);

  useEffect(() => {
    fetchFilms();
  }, []);

  const fetchFilms = async () => {
    try {
      setLoading(true);
      // BUG FIX 5: Fetch all films without status filter so admin sees everything
      const res = await api.get('shortfilms/', { params: { page_size: 100 } });
      const data = res.data;
      const allFilms = data?.results || data || [];
      setFilms(allFilms);
    } catch (err) {
      console.error('Failed to fetch films:', err);
      Swal.fire('Error', 'Failed to load films. Check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (filmId, action) => {
    const label = action === 'approve' ? 'Approve' : 'Reject';
    const result = await Swal.fire({
      title: `${label} Film?`,
      icon: action === 'approve' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'approve' ? '#00cc66' : '#e50914',
      confirmButtonText: label,
    });
    if (!result.isConfirmed) return;

    setProcessing(filmId);
    try {
      // Try the approval endpoint first, fallback to PATCH status directly
      try {
        await api.patch(`shortfilms/${filmId}/approval/`, { action });
      } catch {
        // Fallback: direct status update
        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
        await api.patch(`shortfilms/${filmId}/`, { status: newStatus });
      }

      setFilms(prev => prev.map(f =>
        f.id === filmId
          ? { ...f, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
          : f
      ));
      Swal.fire({
        icon: 'success',
        title: action === 'approve' ? 'Film Approved!' : 'Film Rejected',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.error || 'Failed to update status', 'error');
    } finally {
      setProcessing(null);
    }
  };

  // BUG FIX 5: Filter films based on selected tab
  const filteredFilms = filter === 'ALL' ? films : films.filter(f => f.status === filter);
  const pending  = films.filter(f => f.status === 'PENDING');
  const approved = films.filter(f => f.status === 'APPROVED');
  const rejected = films.filter(f => f.status === 'REJECTED');

  const FilmRow = ({ film }) => (
    <div className={`film-approval-card status-${film.status?.toLowerCase()}`}>
      <div className="film-card-left">
        <img
          src={film.thumbnail_url || 'https://via.placeholder.com/80x110/1a1a1a/666?text=No+Thumb'}
          alt={film.title}
          className="film-thumb"
        />
        <div className="film-card-info">
          <h4>{film.title}</h4>
          <p className="film-meta">
            <span>⏱ {film.duration_minutes || '?'} min</span>
            <span>🌐 {film.language || 'N/A'}</span>
            <span>{film.is_premium ? '👑 Premium' : '🆓 Free'}</span>
          </p>
          <p className="film-description">{(film.description || '').slice(0, 120)}{film.description?.length > 120 ? '...' : ''}</p>
          <p className="film-uploader">By: <strong>{film.uploader_name || `User #${film.uploaded_by}`}</strong></p>
          <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            Submitted: {new Date(film.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="film-card-right">
        <span className={`status-badge ${film.status?.toLowerCase()}`}>{film.status}</span>

        {/* BUG FIX 5: Preview button so admin can watch before deciding */}
        {film.video_url && (
          <button
            className="btn-preview-film"
            onClick={() => setPreviewFilm(film)}
          >
            ▶ Preview
          </button>
        )}

        <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
          {new Date(film.created_at).toLocaleDateString()}
        </div>

        {film.status === 'PENDING' && (
          <div className="approval-actions">
            <button
              className="btn-approve-film"
              onClick={() => handleApproval(film.id, 'approve')}
              disabled={processing === film.id}
            >
              {processing === film.id ? '⏳' : '✓ Approve'}
            </button>
            <button
              className="btn-reject-film"
              onClick={() => handleApproval(film.id, 'reject')}
              disabled={processing === film.id}
            >
              ✗ Reject
            </button>
          </div>
        )}

        {film.status !== 'PENDING' && (
          <button
            className="btn-reset-film"
            onClick={() => handleApproval(film.id, film.status === 'APPROVED' ? 'reject' : 'approve')}
            disabled={processing === film.id}
          >
            {film.status === 'APPROVED' ? '✗ Revoke' : '↩ Re-approve'}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="loading-spinner"><div className="spinner-border"></div></div>;

  return (
    <div className="film-approval-page">
      {/* BUG FIX 5: Video preview modal */}
      {previewFilm && (
        <VideoPreviewModal film={previewFilm} onClose={() => setPreviewFilm(null)} />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Film Approval</h1>
          <p className="page-subtitle">Review and approve submitted short films</p>
        </div>
        <div className="approval-stats">
          <div className="stat-box pending-box">
            <span className="stat-num">{pending.length}</span>
            <span className="stat-lbl">Pending</span>
          </div>
          <div className="stat-box approved-box">
            <span className="stat-num">{approved.length}</span>
            <span className="stat-lbl">Approved</span>
          </div>
          <div className="stat-box rejected-box">
            <span className="stat-num">{rejected.length}</span>
            <span className="stat-lbl">Rejected</span>
          </div>
        </div>
      </div>

      {/* BUG FIX 5: Filter tabs so all statuses are accessible */}
      <div className="approval-filter-tabs">
        {[
          { value: 'ALL',      label: `All (${films.length})` },
          { value: 'PENDING',  label: `⏳ Pending (${pending.length})` },
          { value: 'APPROVED', label: `✅ Approved (${approved.length})` },
          { value: 'REJECTED', label: `❌ Rejected (${rejected.length})` },
        ].map(tab => (
          <button
            key={tab.value}
            className={`approval-tab ${filter === tab.value ? 'active' : ''} tab-${tab.value.toLowerCase()}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
        <button className="btn-refresh-small" onClick={fetchFilms}>↻ Refresh</button>
      </div>

      {filteredFilms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <h3 className="empty-state-title">
            {filter === 'PENDING' ? 'No Pending Films' : filter === 'ALL' ? 'No Films Yet' : `No ${filter} Films`}
          </h3>
          <p className="empty-state-description">
            {filter === 'PENDING'
              ? 'All submitted films have been reviewed.'
              : filter === 'ALL'
              ? 'Films submitted by creators will appear here.'
              : `No films with ${filter} status found.`}
          </p>
        </div>
      ) : (
        <div>
          {filteredFilms.map(f => <FilmRow key={f.id} film={f} />)}
        </div>
      )}
    </div>
  );
};

export default FilmApproval;