import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './TopBar.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/films': 'Short Films',
  '/films/approval': 'Film Approval',
  '/categories': 'Categories',
  '/users': 'Users',
  '/analytics': 'Analytics',
  '/comments':         'Comments',
  '/plans':            'Subscription Plans',
  '/subscribers':      'Subscribers & Revenue',
  '/settings':         'Settings',
  '/creator/dashboard': 'Creator Dashboard',
  '/creator/films': 'My Films',
  '/creator/films/upload': 'Upload Film',
  '/creator/analytics': 'Analytics',
  '/creator/comments': 'Comments',
  '/creator/earnings': 'Earnings',
  '/creator/settings': 'Settings',
};

const Topbar = ({ onToggle, collapsed }) => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const title = pageTitles[location.pathname] || 'Panel';
  const roleLabel = isAdmin ? 'ADMIN' : 'CREATOR';
  const roleColor = isAdmin ? '#e50914' : '#f5a623';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={onToggle} title="Toggle sidebar">
          {collapsed ? '☰' : '✕'}
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <div className="topbar-role" style={{ background: `${roleColor}22`, color: roleColor }}>
          {roleLabel}
        </div>
        <div className="topbar-user">
          <div className="topbar-avatar">{(user?.username || 'U')[0].toUpperCase()}</div>
          <span className="topbar-username">{user?.username}</span>
        </div>
      </div>
    </div>
  );
};

export default Topbar;