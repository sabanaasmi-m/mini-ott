import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './styles/Dashboard.css';

const StatCard = ({ title, value, icon, color, change, link }) => (
  <Link to={link || '#'} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="stat-card-icon" style={{ background: `${color}20`, color }}>{icon}</div>
    <div className="stat-card-content">
      <p className="stat-card-title">{title}</p>
      <h2 className="stat-card-value">{value ?? '—'}</h2>
      {change && <p className="stat-card-change">{change}</p>}
    </div>
  </Link>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('analytics/dashboard/');
      setStats(res.data);
    } catch (err) {
      setError('Could not load dashboard stats. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="spinner-border"></div>
      <p>Loading dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="dashboard-error">
      <span>⚠️</span>
      <p>{error}</p>
      <button onClick={fetchStats}>Retry</button>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening on your platform.</p>
        </div>
        <button className="btn-refresh" onClick={fetchStats}>↻ Refresh</button>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Films"
          value={stats?.total_films}
          icon="🎬"
          color="#e50914"
          change={`+${stats?.new_films_this_week ?? 0} this week`}
          link="/films"
        />
        <StatCard
          title="Total Users"
          value={stats?.total_users}
          icon="👥"
          color="#3b82f6"
          change={`+${stats?.new_users_this_month ?? 0} this month`}
          link="/users"
        />
        <StatCard
          title="Total Views"
          value={stats?.total_views?.toLocaleString()}
          icon="👁️"
          color="#10b981"
          link="/analytics"
        />
        <StatCard
          title="Pending Approval"
          value={stats?.pending_films}
          icon="⏳"
          color="#f59e0b"
          change="Needs review"
          link="/films/approval"
        />
        <StatCard
          title="Approved Films"
          value={stats?.approved_films}
          icon="✅"
          color="#00cc66"
          link="/films"
        />
        <StatCard
          title="Categories"
          value={stats?.total_categories}
          icon="📂"
          color="#8b5cf6"
          link="/categories"
        />
      </div>

      <div className="dashboard-grid">
        {/* Top Films */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">🏆 Top Films by Views</h2>
            <Link to="/films" className="section-link">View all →</Link>
          </div>
          {!stats?.top_films?.length ? (
            <p className="empty-text">No films yet.</p>
          ) : (
            <div className="top-films-list">
              {stats.top_films.map((film, idx) => (
                <div key={film.id} className="top-film-row">
                  <span className={`rank rank-${idx + 1}`}>#{idx + 1}</span>
                  {film.thumbnail_url && (
                    <img src={film.thumbnail_url} alt={film.title} className="top-film-thumb" />
                  )}
                  <span className="top-film-title">{film.title}</span>
                  <span className="top-film-views">{film.views?.toLocaleString()} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Films by Category */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">📂 Films by Category</h2>
            <Link to="/categories" className="section-link">Manage →</Link>
          </div>
          {!stats?.films_by_category?.length ? (
            <p className="empty-text">No categories yet.</p>
          ) : (
            <div className="category-bars">
              {stats.films_by_category.map((cat, idx) => {
                const max = Math.max(...stats.films_by_category.map(c => c.film_count), 1);
                return (
                  <div key={idx} className="cat-bar-row">
                    <span className="cat-bar-label">{cat.name}</span>
                    <div className="cat-bar-track">
                      <div
                        className="cat-bar-fill"
                        style={{ width: `${(cat.film_count / max) * 100}%` }}
                      />
                    </div>
                    <span className="cat-bar-count">{cat.film_count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Films */}
      <div className="content-section">
        <div className="section-header">
          <h2 className="section-title">🕐 Recent Films</h2>
          <Link to="/films/approval" className="section-link">Review pending →</Link>
        </div>
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Film</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Views</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {!stats?.recent_films?.length ? (
                <tr><td colSpan="6" className="text-center">No films yet.</td></tr>
              ) : (
                stats.recent_films.map(film => (
                  <tr key={film.id}>
                    <td>
                      <div className="film-info">
                        {film.thumbnail_url && (
                          <img src={film.thumbnail_url} alt={film.title} className="film-thumbnail" />
                        )}
                        <span>{film.title}</span>
                      </div>
                    </td>
                    <td>{film.category__name || '—'}</td>
                    <td>{film.duration_minutes} min</td>
                    <td>
                      <span className={`badge-custom ${film.status === 'APPROVED' ? 'badge-success' :
                          film.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                        }`}>{film.status}</span>
                    </td>
                    <td>{film.views?.toLocaleString()}</td>
                    <td>{new Date(film.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;