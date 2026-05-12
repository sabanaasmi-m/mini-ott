import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import './FilmCard.css';

const FilmCard = ({ film, showWatchlistBtn = true }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [inWatchlist, setInWatchlist] = useState(film.in_watchlist || false);
  const [toggling, setToggling] = useState(false);

  const handleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (toggling) return;
    setToggling(true);
    try {
      if (inWatchlist) {
        await api.delete(`watchlist/${film.id}/`);
        setInWatchlist(false);
      } else {
        await api.post('watchlist/', { film: film.id });
        setInWatchlist(true);
      }
    } catch {/* silent */}
    finally { setToggling(false); }
  };

  const stars = film.average_rating
    ? Math.round(film.average_rating)
    : null;

  return (
    <Link to={`/film/${film.id}`} className="film-card" title={film.title}>
      {/* Poster */}
      <div className="film-card-poster">
        {film.thumbnail_url ? (
          <img src={film.thumbnail_url} alt={film.title} loading="lazy" />
        ) : (
          <div className="film-card-no-thumb">
            <span>🎬</span>
          </div>
        )}

        {/* Badges */}
        <div className="film-card-badges">
          {film.is_premium && <span className="badge badge-premium">👑</span>}
          {film.duration_minutes && (
            <span className="film-card-dur">{film.duration_minutes}m</span>
          )}
        </div>

        {/* Watchlist toggle */}
        {showWatchlistBtn && (
          <button
            className={`wl-btn ${inWatchlist ? 'active' : ''}`}
            onClick={handleWatchlist}
            title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            {inWatchlist ? '🔖' : '＋'}
          </button>
        )}

        {/* Hover overlay */}
        <div className="film-card-overlay">
          <div className="overlay-play">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <p className="overlay-desc">
            {(film.description || '').slice(0, 80)}{film.description?.length > 80 ? '…' : ''}
          </p>
          <div className="overlay-meta">
            {film.language && <span>{film.language}</span>}
            {film.views > 0 && <span>👁 {film.views >= 1000 ? (film.views/1000).toFixed(1)+'K' : film.views}</span>}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="film-card-info">
        <h3 className="film-card-title">{film.title}</h3>
        <div className="film-card-sub">
          {film.category_detail?.name && (
            <span className="film-card-cat">{film.category_detail.name}</span>
          )}
          {stars && (
            <span className="film-card-rating">
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)} {film.average_rating?.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default FilmCard;
