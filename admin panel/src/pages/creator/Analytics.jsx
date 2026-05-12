import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import '../styles/CreatorAnalytics.css'

const Analytics = () => {
  const { user } = useAuth()
  const [films, setFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('views')

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

  const approvedFilms = films.filter(f => f.status === 'APPROVED')
  const totalViews = films.reduce((s, f) => s + (f.views || 0), 0)
  const totalComments = films.reduce((s, f) => s + (f.comments_count || 0), 0)
  const avgRating = approvedFilms.length
    ? (approvedFilms.reduce((s, f) => s + (f.average_rating || 0), 0) / approvedFilms.filter(f => f.average_rating).length || 0).toFixed(1)
    : 0

  const sorted = [...films].sort((a, b) => {
    if (sort === 'views') return (b.views || 0) - (a.views || 0)
    if (sort === 'rating') return (b.average_rating || 0) - (a.average_rating || 0)
    if (sort === 'comments') return (b.comments_count || 0) - (a.comments_count || 0)
    if (sort === 'date') return new Date(b.created_at) - new Date(a.created_at)
    return 0
  })

  const maxViews = Math.max(...films.map(f => f.views || 0), 1)

  return (
    <div className="analytics-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Performance breakdown of your films</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchFilms}>↻ Refresh</button>
      </div>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon">🎬</div>
          <div>
            <p className="stat-label">Total Films</p>
            <h2 className="stat-value">{films.length}</h2>
            <p className="stat-change">{approvedFilms.length} approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div>
            <p className="stat-label">Total Views</p>
            <h2 className="stat-value">{totalViews.toLocaleString()}</h2>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div>
            <p className="stat-label">Avg Rating</p>
            <h2 className="stat-value" style={{ color: 'var(--accent)' }}>{avgRating || '—'}</h2>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div>
            <p className="stat-label">Total Comments</p>
            <h2 className="stat-value">{totalComments}</h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : films.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3 className="empty-title">No data yet</h3>
          <p className="empty-desc">Upload and get your films approved to see analytics.</p>
        </div>
      ) : (
        <>
          {/* Views bar chart */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-head">
              <h3 className="section-title">📊 Views by Film</h3>
            </div>
            <div className="views-chart">
              {sorted.slice(0, 8).map(film => (
                <div key={film.id} className="chart-row">
                  <div className="chart-label">
                    <img
                      src={film.thumbnail_url || 'https://placehold.co/32x44/18181f/505060?text=?'}
                      className="chart-thumb" alt={film.title}
                    />
                    <span className="chart-title">{film.title}</span>
                    <span className={`badge badge-${film.status?.toLowerCase()}`} style={{ fontSize: 10 }}>{film.status}</span>
                  </div>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ width: `${((film.views || 0) / maxViews) * 100}%` }} />
                  </div>
                  <span className="chart-val">{(film.views || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed table */}
          <div className="card">
            <div className="section-head">
              <h3 className="section-title">📋 Film Performance Table</h3>
              <select className="form-select" style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
                value={sort} onChange={e => setSort(e.target.value)}>
                <option value="views">Sort by Views</option>
                <option value="rating">Sort by Rating</option>
                <option value="comments">Sort by Comments</option>
                <option value="date">Sort by Date</option>
              </select>
            </div>
            <div className="table-wrap">
              <table className="creator-table">
                <thead>
                  <tr>
                    <th>Film</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Rating</th>
                    <th>Comments</th>
                    <th>Type</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(film => (
                    <tr key={film.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={film.thumbnail_url || 'https://placehold.co/40x56/18181f/505060?text=?'}
                            style={{ width: 40, height: 56, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                            alt={film.title}
                          />
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{film.title}</p>
                            <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0 }}>{film.duration_minutes} min · {film.language || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge badge-${film.status?.toLowerCase()}`}>{film.status}</span></td>
                      <td style={{ color: 'var(--text)', fontWeight: 600 }}>{(film.views || 0).toLocaleString()}</td>
                      <td>
                        {film.average_rating
                          ? <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{'★'.repeat(Math.round(film.average_rating))} {film.average_rating}</span>
                          : <span style={{ color: 'var(--text3)' }}>—</span>
                        }
                      </td>
                      <td style={{ color: 'var(--text)' }}>{film.comments_count || 0}</td>
                      <td><span className={`badge ${film.is_premium ? 'badge-premium' : 'badge-free'}`}>{film.is_premium ? '👑 Premium' : '🆓 Free'}</span></td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{new Date(film.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Analytics
