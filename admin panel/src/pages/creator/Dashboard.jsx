import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import '../styles/CreatorDashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [films, setFilms] = useState([])
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, views: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('shortfilms/', { params: { uploaded_by: user?.id } })
      const myFilms = res.data?.results || res.data || []
      setFilms(myFilms)
      setStats({
        total: myFilms.length,
        approved: myFilms.filter(f => f.status === 'APPROVED').length,
        pending: myFilms.filter(f => f.status === 'PENDING').length,
        rejected: myFilms.filter(f => f.status === 'REJECTED').length,
        views: myFilms.reduce((sum, f) => sum + (f.views || 0), 0),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const recentFilms = [...films].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
  const topFilms = [...films].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your creator overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/creator/films/upload')}>
          + Upload New Film
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon">🎬</div>
          <div>
            <p className="stat-label">Total Films</p>
            <h2 className="stat-value">{stats.total}</h2>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <p className="stat-label">Approved</p>
            <h2 className="stat-value" style={{ color: 'var(--green)' }}>{stats.approved}</h2>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div>
            <p className="stat-label">Pending</p>
            <h2 className="stat-value" style={{ color: '#f59e0b' }}>{stats.pending}</h2>
            {stats.pending > 0 && <p className="stat-change">Awaiting admin review</p>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div>
            <p className="stat-label">Total Views</p>
            <h2 className="stat-value">{stats.views.toLocaleString()}</h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : films.length === 0 ? (
        <div className="dashboard-empty">
          <div className="empty-icon">🎬</div>
          <h3 className="empty-title">No films yet</h3>
          <p className="empty-desc">Upload your first short film and reach thousands of viewers.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/creator/films/upload')}>
            🚀 Upload Your First Film
          </button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Recent Films */}
          <div className="card">
            <div className="section-head">
              <h3 className="section-title">🕐 Recent Uploads</h3>
              <Link to="/creator/films" style={{ fontSize: 13, color: 'var(--accent)' }}>View all →</Link>
            </div>
            <div className="table-wrap">
              <table className="creator-table">
                <thead>
                  <tr><th>Film</th><th>Status</th><th>Views</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {recentFilms.map(film => (
                    <tr key={film.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={film.thumbnail_url || 'https://placehold.co/40x56/18181f/505060?text=?'}
                            style={{ width: 40, height: 56, borderRadius: 6, objectFit: 'cover' }}
                            alt={film.title}
                          />
                          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{film.title}</span>
                        </div>
                      </td>
                      <td><span className={`badge badge-${film.status?.toLowerCase()}`}>{film.status}</span></td>
                      <td style={{ color: 'var(--text)' }}>{(film.views || 0).toLocaleString()}</td>
                      <td>{new Date(film.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Films */}
          <div className="card">
            <div className="section-head">
              <h3 className="section-title">🏆 Top Performing</h3>
              <Link to="/creator/analytics" style={{ fontSize: 13, color: 'var(--accent)' }}>Analytics →</Link>
            </div>
            <div className="top-films">
              {topFilms.map((film, idx) => (
                <div key={film.id} className="top-film-row">
                  <span className={`top-rank rank-${idx + 1}`}>#{idx + 1}</span>
                  <img
                    src={film.thumbnail_url || 'https://placehold.co/36x50/18181f/505060?text=?'}
                    style={{ width: 36, height: 50, borderRadius: 5, objectFit: 'cover' }}
                    alt={film.title}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{film.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text2)' }}>{film.duration_minutes} min · {film.language || 'N/A'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{(film.views || 0).toLocaleString()}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)' }}>views</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Approval status bar */}
            {stats.total > 0 && (
              <div className="approval-bar-wrap">
                <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Film Status Overview</p>
                <div className="approval-bar">
                  {stats.approved > 0 && <div className="bar-approved" style={{ width: `${(stats.approved/stats.total)*100}%` }} title={`Approved: ${stats.approved}`} />}
                  {stats.pending > 0 && <div className="bar-pending" style={{ width: `${(stats.pending/stats.total)*100}%` }} title={`Pending: ${stats.pending}`} />}
                  {stats.rejected > 0 && <div className="bar-rejected" style={{ width: `${(stats.rejected/stats.total)*100}%` }} title={`Rejected: ${stats.rejected}`} />}
                </div>
                <div className="bar-legend">
                  <span><i style={{ background: 'var(--green)' }}></i> Approved ({stats.approved})</span>
                  <span><i style={{ background: '#f59e0b' }}></i> Pending ({stats.pending})</span>
                  <span><i style={{ background: 'var(--red)' }}></i> Rejected ({stats.rejected})</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
