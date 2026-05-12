import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import FilmCard from '../components/film/FilmCard';
import './styles/Watchlist.css';

const Watchlist = () => {
  const navigate  = useNavigate();
  const [films,   setFilms]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('watchlist/')
      .then(r => {
        const items = r.data?.results || r.data || [];
        // Watchlist may return {film: {...}} or directly film objects
        const filmList = items.map(i => i.film || i).filter(Boolean);
        setFilms(filmList);
      })
      .catch(() => setFilms([]))
      .finally(() => setLoading(false));
  }, []);

  const removeFilm = (filmId) => {
    setFilms(prev => prev.filter(f => f.id !== filmId));
  };

  return (
    <div className="watchlist-page">
      <div className="watchlist-header container">
        <div>
          <h1 className="watchlist-title">My Watchlist</h1>
          <p className="watchlist-subtitle">
            {loading ? 'Loading…' : `${films.length} film${films.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>
        <Link to="/browse" className="btn btn-outline btn-sm">+ Browse More</Link>
      </div>

      <div className="container">
        {loading ? (
          <div className="watchlist-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="film-card-skeleton">
                <div className="skeleton poster-skel" />
                <div className="skeleton title-skel" style={{ marginBottom: 6 }} />
                <div className="skeleton sub-skel" />
              </div>
            ))}
          </div>
        ) : films.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <div className="empty-icon">🔖</div>
            <h3 className="empty-title">Your watchlist is empty</h3>
            <p className="empty-desc">Browse films and click + to save them here for later.</p>
            <Link to="/browse" className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>
              Browse Films
            </Link>
          </div>
        ) : (
          <div className="watchlist-grid">
            {films.map(film => (
              <div key={film.id} className="watchlist-item">
                <FilmCard film={{ ...film, in_watchlist: true }} />
                <button
                  className="remove-btn"
                  onClick={() => {
                    api.delete(`watchlist/${film.id}/`).then(() => removeFilm(film.id)).catch(() => {});
                  }}
                  title="Remove from watchlist"
                >
                  ✕ Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
