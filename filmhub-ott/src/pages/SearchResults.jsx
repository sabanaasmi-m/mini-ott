import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import FilmCard from '../components/film/FilmCard';
import './styles/Browse.css'; // reuse browse styles

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [films,   setFilms]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    api.get('shortfilms/', {
      params: { status: 'APPROVED', search: query, page_size: 40 }
    })
      .then(r => {
        const data = r.data;
        setFilms(data?.results || data || []);
        setTotal(data?.count ?? (data?.results ?? data)?.length ?? 0);
      })
      .catch(() => setFilms([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="browse-page">
      <div className="browse-header">
        <div className="browse-header-inner container">
          <div style={{ flex: 1 }}>
            <h1 className="browse-title">
              {query ? `Results for "${query}"` : 'Search Films'}
            </h1>
            <p className="browse-subtitle">
              {loading ? 'Searching…' : `${total} film${total !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link to="/browse" className="btn btn-outline btn-sm">Browse All</Link>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
        {loading ? (
          <div className="browse-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="film-card-skeleton">
                <div className="skeleton poster-skel" />
                <div className="skeleton title-skel" style={{ marginBottom: 6 }} />
                <div className="skeleton sub-skel" />
              </div>
            ))}
          </div>
        ) : !query ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">Start searching</h3>
            <p className="empty-desc">Use the search bar in the navigation to find films by title or language.</p>
          </div>
        ) : films.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3 className="empty-title">No results for "{query}"</h3>
            <p className="empty-desc">Try a different search term, or browse all films.</p>
            <Link to="/browse" className="btn btn-outline" style={{ marginTop: 8 }}>Browse All Films</Link>
          </div>
        ) : (
          <div className="browse-grid">
            {films.map(film => <FilmCard key={film.id} film={film} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;