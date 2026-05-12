import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import './styles/Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Get token
      const tokenRes = await api.post('auth/login/', {
        username: credentials.username,
        password: credentials.password,
      });

      const accessToken = tokenRes.data.access;
      if (!accessToken) throw new Error('No token received');

      // Step 2: Temporarily store token so profile request is authorized
      localStorage.setItem('admin_token', accessToken);

      // Step 3: Fetch profile to get role
      // Django may return role at top-level OR nested inside profile{}
      const profileRes = await api.get('auth/profile/');
      const userData = profileRes.data;

      // Support both: userData.role  AND  userData.profile.role
      const role = userData.role || userData.profile?.role;

      if (!role || (role !== 'ADMIN' && role !== 'CREATOR')) {
        localStorage.removeItem('admin_token');
        setError('Access denied. Only Admins and Creators can log in here.');
        setLoading(false);
        return;
      }

      // Normalize role onto userData so AuthContext always sees it at top level
      const normalizedUser = { ...userData, role };

      // Step 4: Commit to AuthContext
      login({ token: accessToken, user: normalizedUser });

      // Step 5: Redirect by role
      navigate(role === 'ADMIN' ? '/dashboard' : '/creator/dashboard', { replace: true });

    } catch (err) {
      localStorage.removeItem('admin_token');
      const detail = err?.response?.data?.detail;
      setError(detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo-large">
            <div className="logo-icon-large">🎥</div>
            <h1>FilmHub</h1>
          </div>
          <p>Admin &amp; Creator Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <p className="error-text">{error}</p>}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#555' }}>
          Admins and Creators only
        </p>
      </div>
    </div>
  );
};

export default Login;