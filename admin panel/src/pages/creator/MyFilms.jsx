import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import Swal from 'sweetalert2'
import '../styles/MyFilms.css'

const MyFilms = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchFilms() }, [])

  const fetchFilms = async () => {
    try {
      setLoading(true)
      const res = await api.get('shortfilms/', { params: { uploaded_by: user?.id } })
      setFilms(res.data?.results || res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: `Delete "${title}"?`,
      text: 'This cannot be undone.',
      icon: 'warning',
      background: '#1a1a22',
      color: '#f0f0e8',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete',
    })
    if (!result.isConfirmed) return
    try {
      await api.delete(`shortfilms/${id}/`)
      setFilms(prev => prev.filter(f => f.id !== id))
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false, background: '#1a1a22', color: '#f0f0e8' })
    } catch {
      Swal.fire('Error', 'Could not delete film', 'error')
    }
  }

  const filtered = films.filter(f => {
    const matchStatus = filter === 'ALL' || f.status === filter
    const matchSearch = !search || f.title?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = {
    ALL: films.length,
    APPROVED: films.filter(f => f.status === 'APPROVED').length,
    PENDING: films.filter(f => f.status === 'PENDING').length,
    REJECTED: films.filter(f => f.status === 'REJECTED').length,
  }

  return (
    <div className="myfilms-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Films</h1>
          <p className="page-subtitle">{films.length} film{films.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/creator/films/upload')}>
          + Upload New Film
        </button>
      </div>

      {/* Filter tabs */}
      <div className="films-filter-bar">
        {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(s => (
          <button
            key={s}
            className={`filter-tab ${filter === s ? 'active' : ''} tab-${s.toLowerCase()}`}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? '🎬' : s === 'APPROVED' ? '✅' : s === 'PENDING' ? '⏳' : '❌'}
            {s} <span className="tab-count">{counts[s]}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          className="form-input"
          style={{ maxWidth: 260 }}
          placeholder="🔍 Search films..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h3 className="empty-title">{films.length === 0 ? 'No films yet' : 'No films match filter'}</h3>
          <p className="empty-desc">
            {films.length === 0
              ? 'Start building your portfolio by uploading your first short film.'
              : 'Try a different filter or search term.'}
          </p>
          {films.length === 0 && (
            <button className="btn btn-primary" onClick={() => navigate('/creator/films/upload')}>
              🚀 Upload First Film
            </button>
          )}
        </div>
      ) : (
        <div className="films-grid">
          {filtered.map(film => (
            <FilmCard
              key={film.id}
              film={film}
              onEdit={() => navigate(`/creator/films/edit/${film.id}`)}
              onDelete={() => handleDelete(film.id, film.title)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const FilmCard = ({ film, onEdit, onDelete }) => {
  const statusColors = {
    APPROVED: 'var(--green)',
    PENDING: '#f59e0b',
    REJECTED: 'var(--red)',
  }

  return (
    <div className="film-card">
      <div className="film-card-thumb">
        <img
          src={film.thumbnail_url || 'https://placehold.co/320x180/18181f/505060?text=No+Thumbnail'}
          alt={film.title}
        />
        <div className="film-card-overlay">
          <span className={`badge badge-${film.status?.toLowerCase()}`}>{film.status}</span>
          {film.is_premium && <span className="badge badge-premium">👑 Premium</span>}
        </div>
        <div className="film-card-duration">
          {film.duration_minutes ? `${film.duration_minutes} min` : '--'}
        </div>
      </div>

      <div className="film-card-body">
        <h3 className="film-card-title">{film.title}</h3>
        <p className="film-card-meta">
          <span>📂 {film.category_detail?.name || 'Uncategorized'}</span>
          <span>🌐 {film.language || 'N/A'}</span>
        </p>
        <p className="film-card-desc">
          {(film.description || '').slice(0, 90)}{film.description?.length > 90 ? '...' : ''}
        </p>

        <div className="film-card-stats">
          <div className="film-stat">
            <span className="film-stat-val">{(film.views || 0).toLocaleString()}</span>
            <span className="film-stat-lbl">Views</span>
          </div>
          <div className="film-stat">
            <span className="film-stat-val" style={{ color: film.average_rating ? 'var(--accent)' : 'var(--text3)' }}>
              {film.average_rating ? `${film.average_rating}★` : '—'}
            </span>
            <span className="film-stat-lbl">Rating</span>
          </div>
          <div className="film-stat">
            <span className="film-stat-val">{film.comments_count || 0}</span>
            <span className="film-stat-lbl">Comments</span>
          </div>
        </div>

        {film.status === 'REJECTED' && (
          <div className="film-rejected-notice">
            ❌ Rejected by admin — edit and resubmit
          </div>
        )}
        {film.status === 'PENDING' && (
          <div className="film-pending-notice">
            ⏳ Under review — will be approved soon
          </div>
        )}
      </div>

      <div className="film-card-actions">
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑️ Delete</button>
      </div>
    </div>
  )
}

export default MyFilms