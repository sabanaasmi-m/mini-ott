import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import FilmCard from './FilmCard';
import './FilmRow.css';

const FilmRow = ({ title, films = [], viewAllLink, loading = false }) => {
  const rowRef = useRef();

  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  if (!loading && !films.length) return null;

  return (
    <section className="film-row">
      <div className="film-row-head">
        <h2 className="film-row-title">{title}</h2>
        {viewAllLink && (
          <Link to={viewAllLink} className="film-row-more">
            View all <span>→</span>
          </Link>
        )}
      </div>

      <div className="film-row-wrap">
        <button className="row-arrow left"  onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
        <button className="row-arrow right" onClick={() => scroll(1)}  aria-label="Scroll right">›</button>

        <div className="film-row-scroll" ref={rowRef}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="film-card-skeleton">
                  <div className="skeleton poster-skel" />
                  <div className="skeleton title-skel" />
                  <div className="skeleton sub-skel" />
                </div>
              ))
            : films.map(film => (
                <FilmCard key={film.id} film={film} />
              ))
          }
        </div>
      </div>
    </section>
  );
};

export default FilmRow;
