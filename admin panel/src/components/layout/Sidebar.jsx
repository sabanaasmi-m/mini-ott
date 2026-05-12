import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import './Sidebar.css';

const adminMenu = [
  { id: 'dashboard', path: '/dashboard', icon: '📊', label: 'Dashboard', end: true },
  { id: 'films', path: '/films', icon: '🎬', label: 'Short Films', end: true },
  { id: 'approval', path: '/films/approval', icon: '✅', label: 'Film Approval', end: true },
  { id: 'categories', path: '/categories', icon: '📂', label: 'Categories', end: true },
  { id: 'users', path: '/users', icon: '👥', label: 'Users', end: true },
  { id: 'analytics', path: '/analytics', icon: '📈', label: 'Analytics', end: true },
  { id: 'comments', path: '/comments', icon: '💬', label: 'Comments', end: true },
  { id: 'subscriptions', path: '/subscriptions', icon: '💳', label: 'Subscriptions', end: true },
  { id: 'settings', path: '/settings', icon: '⚙️', label: 'Settings', end: true },
];

const creatorMenu = [
  { id: 'cdashboard', path: '/creator/dashboard', icon: '📊', label: 'Dashboard', end: true },
  { id: 'myfilms', path: '/creator/films', icon: '🎬', label: 'My Films', end: true },
  { id: 'upload', path: '/creator/films/upload', icon: '⬆️', label: 'Upload Film', end: true },
  { id: 'canalytics', path: '/creator/analytics', icon: '📈', label: 'Analytics', end: true },
  { id: 'ccomments', path: '/creator/comments', icon: '💬', label: 'Comments', end: true },
  { id: 'earnings', path: '/creator/earnings', icon: '💰', label: 'Earnings', end: true },
  { id: 'csettings', path: '/creator/settings', icon: '⚙️', label: 'Settings', end: true },
];

const Sidebar = ({ collapsed }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const menuItems = isAdmin ? adminMenu : creatorMenu;
  const roleLabel = isAdmin ? 'ADMIN' : 'CREATOR';
  const roleColor = isAdmin ? '#e50914' : '#f5a623';

  // BUG FIX 6: Confirm before logout
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to sign out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e50914',
      cancelButtonColor: '#3a3a3a',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      background: '#111118',
      color: '#f0f0e8',
    });

    if (result.isConfirmed) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">🎥</div>
          {!collapsed && <span className="logo-text">FilmHub</span>}
        </div>
      </div>

      {!collapsed && (
        <div className="sidebar-user">
          <div className="sidebar-avatar">{(user?.username || 'U')[0].toUpperCase()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{user?.username}</div>
            <div className="sidebar-role" style={{ color: roleColor }}>{roleLabel}</div>
          </div>
        </div>
      )}

      <nav className="sidebar-menu">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id} className="menu-item">
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                style={({ isActive }) => isActive ? { '--active-color': roleColor } : {}}
              >
                <span className="menu-icon">{item.icon}</span>
                {!collapsed && <span className="menu-text">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {/* BUG FIX 6: Logout now shows confirmation */}
        <button className="sidebar-logout" onClick={handleLogout}>
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;