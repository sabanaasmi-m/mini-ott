import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCard from '../components/common/StatsCard';
import { formatNumber } from '../utils/helpers';
import './styles/Analytics.css';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('analytics/dashboard/');
      setData(res.data);
    } catch (err) {
      setError('Failed to load analytics. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-spinner">
      <div className="spinner-border"></div>
    </div>
  );

  if (error) return (
    <div className="analytics-page">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
      </div>
      <div className="error-message">{error}</div>
    </div>
  );

  const maxCategoryCount = data?.films_by_category?.length
    ? Math.max(...data.films_by_category.map(c => c.film_count), 1)
    : 1;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Platform overview and insights</p>
        <button className="btn-refresh" onClick={fetchAnalytics}>↻ Refresh</button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard title="Total Films" value={data.total_films} change={`+${data.new_films_this_week} this week`} icon="🎬" iconColor="red" />
        <StatsCard title="Total Users" value={data.total_users} change={`+${data.new_users_this_month} this month`} icon="👥" iconColor="blue" />
        <StatsCard title="Total Views" value={formatNumber(data.total_views)} icon="👁️" iconColor="green" />
        <StatsCard title="Pending Review" value={data.pending_films} icon="⏳" iconColor="orange" />
        <StatsCard title="Approved Films" value={data.approved_films} icon="✅" iconColor="green" />
        <StatsCard title="Categories" value={data.total_categories} icon="📂" iconColor="purple" />
      </div>

      <div className="analytics-grid">
        {/* Top Films */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">🏆 Top Films by Views</h2>
          </div>
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Film</th>
                  <th>Views</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.top_films?.length === 0 ? (
                  <tr><td colSpan="4" className="text-center">No films yet</td></tr>
                ) : (
                  data.top_films?.map((film, idx) => (
                    <tr key={film.id}>
                      <td>
                        <span className={`rank-badge rank-${idx + 1}`}>#{idx + 1}</span>
                      </td>
                      <td>
                        <div className="film-info">
                          {film.thumbnail_url && (
                            <img src={film.thumbnail_url} alt={film.title} className="film-thumbnail" />
                          )}
                          <span>{film.title}</span>
                        </div>
                      </td>
                      <td><strong>{formatNumber(film.views)}</strong></td>
                      <td><span className="badge-custom badge-success">Approved</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Films by Category */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">📂 Films by Category</h2>
          </div>
          <div className="chart-container">
            {data.films_by_category?.length === 0 ? (
              <p className="text-center" style={{ color: '#b3b3b3' }}>No category data</p>
            ) : (
              data.films_by_category?.map((cat, idx) => (
                <div key={idx} className="bar-row">
                  <div className="bar-label">{cat.name}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(cat.film_count / maxCategoryCount) * 100}%` }}
                    ></div>
                  </div>
                  <div className="bar-count">{cat.film_count}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Films */}
      <div className="content-section">
        <div className="section-header">
          <h2 className="section-title">🕐 Recent Films</h2>
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
              {data.recent_films?.length === 0 ? (
                <tr><td colSpan="6" className="text-center">No films yet</td></tr>
              ) : (
                data.recent_films?.map((film) => (
                  <tr key={film.id}>
                    <td>
                      <div className="film-info">
                        {film.thumbnail_url && (
                          <img src={film.thumbnail_url} alt={film.title} className="film-thumbnail" />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{film.title}</div>
                          <div style={{ fontSize: 12, color: '#b3b3b3' }}>{film['category__name']}</div>
                        </div>
                      </div>
                    </td>
                    <td>{film['category__name'] || '-'}</td>
                    <td>{film.duration_minutes} min</td>
                    <td>
                      <span className={`badge-custom ${
                        film.status === 'APPROVED' ? 'badge-success' :
                        film.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {film.status}
                      </span>
                    </td>
                    <td>{formatNumber(film.views)}</td>
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

export default Analytics;