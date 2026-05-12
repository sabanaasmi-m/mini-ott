import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './styles/Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Please fill all fields.'); return; }
    setLoading(true); setError('');
    try {
      await login(form.username, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left visual panel */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <Link to="/" className="auth-logo">
            <span className="logo-mark">F</span>
            <span className="logo-text">ILMHUB</span>
          </Link>
          <h2 className="auth-visual-headline">Cinema lives here.</h2>
          <p className="auth-visual-sub">Thousands of short films from independent creators around the world, all in one place.</p>
          <div className="auth-film-cards">
            {['🎭', '🌊', '🔮', '🌆'].map((e, i) => (
              <div key={i} className="auth-mini-card" style={{ animationDelay: `${i * 0.15}s` }}>{e}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-subtitle">Sign in to continue watching</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-text">{error}</div>}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                name="username"
                className="form-input"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                name="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:18,height:18,borderWidth:2}} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <p className="auth-switch">
            New to FilmHub?{' '}
            <Link to="/register">Create a free account →</Link>
          </p>

          <p className="auth-back">
            <Link to="/">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
