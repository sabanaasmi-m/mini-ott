import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import './styles/Player.css';

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const videoRef = useRef();

  const [film,    setFilm]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [playing, setPlaying] = useState(false);
  const [controls, setControls] = useState(true);
  const controlsTimer = useRef();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchFilm();
    return () => clearTimeout(controlsTimer.current);
  }, [id]);

  const fetchFilm = async () => {
    try {
      const res = await api.get(`shortfilms/${id}/`);
      const f = res.data;
      // Premium gate
      if (f.is_premium && !user?.is_subscribed) {
        setError('premium');
        setFilm(f);
        setLoading(false);
        return;
      }
      if (!f.video_url) {
        setError('no_video');
        setFilm(f);
        setLoading(false);
        return;
      }
      setFilm(f);
      // Track view (fire and forget)
      api.post(`shortfilms/${id}/view/`).catch(() => {});
    } catch {
      setError('not_found');
    } finally {
      setLoading(false);
    }
  };

  const showControls = () => {
    setControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (playing) setControls(false);
    }, 3000);
  };

  if (loading) return (
    <div className="player-loading">
      <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      <p>Loading film…</p>
    </div>
  );

  // Premium gate
  if (error === 'premium') return (
    <div className="player-gate">
      <div className="gate-backdrop">
        {film?.thumbnail_url && <img src={film.thumbnail_url} alt="" />}
        <div className="gate-overlay" />
      </div>
      <div className="gate-content">
        <div className="gate-lock">👑</div>
        <h2 className="gate-title">Premium Content</h2>
        <p className="gate-film-name">{film?.title}</p>
        <p className="gate-desc">Subscribe to FilmHub to watch this premium film and unlock unlimited access to our entire collection.</p>
        <div className="gate-actions">
          <Link to="/subscriptions" className="btn btn-gold btn-lg">View Subscription Plans</Link>
          <button className="btn btn-outline btn-lg" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </div>
    </div>
  );

  if (error === 'no_video') return (
    <div className="player-gate">
      <div className="gate-content">
        <div className="gate-lock">⚠️</div>
        <h2 className="gate-title">Video Unavailable</h2>
        <p className="gate-desc">This film's video is not available at the moment. Please try again later.</p>
        <button className="btn btn-outline btn-lg" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  );

  if (error) return (
    <div className="player-gate">
      <div className="gate-content">
        <div className="gate-lock">🎬</div>
        <h2 className="gate-title">Film Not Found</h2>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/browse')}>Browse Films</button>
      </div>
    </div>
  );

  return (
    <div className="player-page" onMouseMove={showControls}>
      {/* Back bar */}
      <div className={`player-topbar ${controls ? 'visible' : ''}`}>
        <button className="player-back" onClick={() => navigate(`/film/${id}`)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Film
        </button>
        <div className="player-title-bar">
          <h2>{film.title}</h2>
          {film.is_premium && <span className="badge badge-premium">👑 Premium</span>}
        </div>
        <div className="player-meta">
          {film.duration_minutes && <span>{film.duration_minutes} min</span>}
          {film.language && <span>{film.language}</span>}
        </div>
      </div>

      {/* Video */}
      <div className="player-wrap">
        <video
          ref={videoRef}
          className="player-video"
          src={film.video_url}
          controls
          autoPlay
          onPlay={() => { setPlaying(true); }}
          onPause={() => { setPlaying(false); setControls(true); }}
          onEnded={() => { setPlaying(false); setControls(true); }}
        />
      </div>

      {/* Film info below */}
      <div className="player-info container">
        <div className="player-info-layout">
          <div>
            <h1 className="player-info-title">{film.title}</h1>
            {film.description && (
              <p className="player-info-desc">{film.description}</p>
            )}
          </div>
          <div className="player-info-actions">
            <Link to={`/film/${id}`} className="btn btn-outline">
              Reviews & Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
