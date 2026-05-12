import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import '../styles/Earnings.css'

const Earnings = () => {
  const { user } = useAuth()
  const [films, setFilms] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [filmsRes, plansRes] = await Promise.all([
        api.get('shortfilms/', { params: { uploaded_by: user?.id } }),
        api.get('subscriptions/plans/').catch(() => ({ data: [] })),
      ])
      setFilms(filmsRes.data?.results || filmsRes.data || [])
      setPlans(plansRes.data?.results || plansRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const approvedFilms = films.filter(f => f.status === 'APPROVED')
  const premiumFilms = approvedFilms.filter(f => f.is_premium)
  const premiumViews = premiumFilms.reduce((s, f) => s + (f.views || 0), 0)
  const estimatedEarnings = (premiumViews * 0.002).toFixed(2)
  const monthlyEstimate = (premiumViews * 0.002 / 12).toFixed(2)

  return (
    <div className="earnings-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Earnings</h1>
          <p className="page-subtitle">Your revenue overview from premium content</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: 28 }}>
            <div className="earnings-hero-card">
              <p className="earnings-label">Estimated Total Earnings</p>
              <h2 className="earnings-amount">₹{estimatedEarnings}</h2>
              <p className="earnings-note">Based on premium film views</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👑</div>
              <div>
                <p className="stat-label">Premium Films</p>
                <h2 className="stat-value">{premiumFilms.length}</h2>
                <p className="stat-change">{premiumViews.toLocaleString()} premium views</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div>
                <p className="stat-label">Monthly Estimate</p>
                <h2 className="stat-value">₹{monthlyEstimate}</h2>
                <p className="stat-change">avg per month</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-head">
              <h3 className="section-title">💰 Per-Film Breakdown</h3>
            </div>
            {approvedFilms.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-icon">🎬</div>
                <h3 className="empty-title">No approved films yet</h3>
                <p className="empty-desc">Get your films approved to start earning.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="creator-table">
                  <thead>
                    <tr><th>Film</th><th>Type</th><th>Views</th><th>Est. Revenue</th><th>Rating</th></tr>
                  </thead>
                  <tbody>
                    {approvedFilms.sort((a, b) => (b.views || 0) - (a.views || 0)).map(film => (
                      <tr key={film.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={film.thumbnail_url || 'https://placehold.co/40x56/18181f/505060?text=?'}
                              style={{ width: 40, height: 56, borderRadius: 6, objectFit: 'cover' }} alt={film.title} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{film.title}</span>
                          </div>
                        </td>
                        <td><span className={`badge ${film.is_premium ? 'badge-premium' : 'badge-free'}`}>{film.is_premium ? '👑 Premium' : '🆓 Free'}</span></td>
                        <td style={{ color: 'var(--text)', fontWeight: 600 }}>{(film.views || 0).toLocaleString()}</td>
                        <td><span style={{ color: film.is_premium ? 'var(--accent)' : 'var(--text3)', fontWeight: film.is_premium ? 700 : 400 }}>
                          {film.is_premium ? `₹${((film.views || 0) * 0.002).toFixed(2)}` : '—'}
                        </span></td>
                        <td>{film.average_rating ? <span style={{ color: 'var(--accent)' }}>★ {film.average_rating}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {plans.length > 0 && (
            <div className="card">
              <div className="section-head"><h3 className="section-title">📦 Active Subscription Plans</h3></div>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Users subscribing to these plans get access to your premium films.</p>
              <div className="plans-grid">
                {plans.map(plan => (
                  <div key={plan.id} className="plan-card">
                    <h4 className="plan-name">{plan.name}</h4>
                    <p className="plan-price">₹{plan.price}<span>/{plan.duration_days} days</span></p>
                    <p className="plan-desc">{plan.description || 'Includes all premium content'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="earnings-notice">
            <span>ℹ️</span>
            <div>
              <strong>About Earnings</strong>
              <p>Earnings are estimated based on premium film views (₹0.002 per view). Actual payouts depend on your subscription revenue share agreement with FilmHub.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Earnings