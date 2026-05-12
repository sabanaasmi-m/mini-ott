import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroBanner.css';

const HeroBanner = ({ films = [] }) => {
  const [current, setCurrent] = useState(0);
  const [fading, setFading]   = useState(false);

  const featured = films.slice(0, 5);

  useEffect(() => {
    if (featured.length < 2) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % featured.length);
        setFading(false);
      }, 500);
    }, 7000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (!featured.length) return (
    <div className="hero-skeleton">
      <div className="hero-skeleton-content">
        <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '60%', height: 56, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '40%', height: 20, marginBottom: 28 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="skeleton" style={{ width: 130, height: 46, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 130, height: 46, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );

  const film = featured[current];

  return (
    <section className="hero">
      {/* Background */}
      <div className={`hero-bg ${fading ? 'fading' : ''}`}>
        {film.thumbnail_url ? (
          <img src={film.thumbnail_url} alt={film.title} className="hero-bg-img" />
        ) : (
          <div className="hero-bg-fallback" />
        )}
        <div className="hero-grad-overlay" />
        <div className="hero-grain" />
      </div>

      {/* Content */}
      <div className={`hero-content ${fading ? 'fading' : ''}`}>
        <div className="hero-meta">
          {film.is_premium && <span className="badge badge-premium">👑 Premium</span>}
          {film.language && <span className="hero-lang">{film.language}</span>}
          {film.duration_minutes && <span className="hero-dur">{film.duration_minutes} min</span>}
        </div>

        <h1 className="hero-title">{film.title}</h1>

        {film.description && (
          <p className="hero-desc">{film.description.slice(0, 160)}{film.description.length > 160 ? '…' : ''}</p>
        )}

        <div className="hero-actions">
          <Link to={`/watch/${film.id}`} className="btn btn-primary btn-xl hero-play-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Watch Now
          </Link>
          <Link to={`/film/${film.id}`} className="btn btn-outline btn-xl">
            More Info
          </Link>
        </div>

        {film.category_detail?.name && (
          <p className="hero-category">
            <span>Category:</span> {film.category_detail.name}
          </p>
        )}
      </div>

      {/* Slide indicators */}
      {featured.length > 1 && (
        <div className="hero-dots">
          {featured.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === current ? 'active' : ''}`}
              onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 300); }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className="hero-scroll-hint">
        <span>Scroll</span>
        <div className="scroll-line" />
      </div>
    </section>
  );
};

export default HeroBanner;
