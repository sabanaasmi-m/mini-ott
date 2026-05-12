import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);
  const [search, setSearch]       = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const dropRef   = useRef();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/browse?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setSearchOpen(false);
    }
  };

  // BUG FIX 6: Confirm before logout
  const handleLogout = async () => {
    setDropOpen(false);
    setMenuOpen(false);

    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to sign out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e8001d',
      cancelButtonColor: '#2a2a2a',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      background: '#111',
      color: '#f2f0ea',
    });

    if (result.isConfirmed) {
      logout();
      navigate('/');
    }
  };

  const isHome = location.pathname === '/';

  return (
    <header className={`navbar ${scrolled || !isHome ? 'scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <span className="logo-mark">F</span>
          <span className="logo-text">ILMHUB</span>
        </Link>

        {/* Desktop links */}
        <nav className="nav-links">
          <NavLink to="/"          end className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink>
          <NavLink to="/browse"        className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Browse</NavLink>
          {isAuthenticated && (
            <NavLink to="/watchlist"   className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Watchlist</NavLink>
          )}
          <NavLink to="/subscriptions" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Plans</NavLink>
        </nav>

        {/* Right actions */}
        <div className="nav-actions">
          {/* Search */}
          <div className={`search-wrap ${searchOpen ? 'open' : ''}`}>
            {searchOpen ? (
              <form onSubmit={handleSearch} className="search-form">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search films…"
                  className="search-input"
                />
                <button type="button" className="icon-btn" onClick={() => setSearchOpen(false)}>✕</button>
              </form>
            ) : (
              <button className="icon-btn" onClick={() => setSearchOpen(true)} title="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            )}
          </div>

          {isAuthenticated ? (
            <div className="user-drop" ref={dropRef}>
              <button className="user-avatar-btn" onClick={() => setDropOpen(d => !d)}>
                <div className="user-avatar">{(user?.username || 'U')[0].toUpperCase()}</div>
                <span className="user-name">{user?.username}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={dropOpen ? 'chevron up' : 'chevron'}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {dropOpen && (
                <div className="drop-menu">
                  <Link to="/profile"      className="drop-item">👤 Profile</Link>
                  <Link to="/watchlist"    className="drop-item">🔖 Watchlist</Link>
                  <Link to="/subscriptions" className="drop-item">👑 Subscription</Link>
                  <div className="drop-divider" />
                  {/* BUG FIX 6: Confirm logout */}
                  <button className="drop-item danger" onClick={handleLogout}>🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login"    className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
            </div>
          )}

          {/* Hamburger */}
          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <form onSubmit={handleSearch} className="mobile-search">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search films…" className="form-input" />
          <button type="submit" className="btn btn-primary btn-sm">Go</button>
        </form>
        <NavLink to="/"          end className="mobile-link">Home</NavLink>
        <NavLink to="/browse"        className="mobile-link">Browse</NavLink>
        {isAuthenticated && <NavLink to="/watchlist" className="mobile-link">Watchlist</NavLink>}
        <NavLink to="/subscriptions" className="mobile-link">Plans</NavLink>
        {isAuthenticated ? (
          <>
            <NavLink to="/profile" className="mobile-link">Profile</NavLink>
            {/* BUG FIX 6: Mobile logout also confirms */}
            <button className="mobile-link danger-link" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <div style={{display:'flex',gap:10,padding:'8px 0'}}>
            <Link to="/login"    className="btn btn-outline" style={{flex:1,justifyContent:'center'}}>Sign In</Link>
            <Link to="/register" className="btn btn-primary" style={{flex:1,justifyContent:'center'}}>Join Free</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;