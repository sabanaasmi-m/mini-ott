import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import FilmCard from '../components/film/FilmCard';
import './styles/CategoryPage.css';

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [films,    setFilms]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [ordering, setOrdering] = useState('-views');
  const PAGE_SIZE = 24;

  useEffect(() => {
    window.scrollTo(0, 0);
    // Fetch category info
    api.get(`categories/${id}/`).then(r => setCategory(r.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    fetchFilms(true);
  }, [id, ordering]);

  const fetchFilms = async (reset = true) => {
    const p = reset ? 1 : page;
    if (reset) setPage(1);
    setLoading(true);
    try {
      const res = await api.get('shortfilms/', {
        params: { status: 'APPROVED', category: id, ordering, page: p, page_size: PAGE_SIZE },
      });
      const data = res.data;
      if (reset) setFilms(data?.results || data || []);
      else setFilms(prev => [...prev, ...(data?.results || data || [])]);
      setTotal(data?.count ?? (data?.results ?? data)?.length ?? 0);
    } catch {
      setFilms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(p => p + 1);
    fetchFilms(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="category-page">
      {/* Header */}
      <div className="cat-page-header">
        {category?.image && (
          <div className="cat-page-backdrop">
            <img src={category.image} alt={category.name} />
            <div className="cat-page-overlay" />
          </div>
        )}
        <div className="cat-page-header-content container">
          <div className="cat-breadcrumb">
            <Link to="/">Home</Link> / <Link to="/browse">Browse</Link> / <span>{category?.name || '…'}</span>
          </div>
          {category?.image && (
            <div className="cat-img-circle">
              <img src={category.image} alt={category.name} />
            </div>
          )}
          <h1 className="cat-page-title">{category?.name || 'Category'}</h1>
          {category?.description && <p className="cat-page-desc">{category.description}</p>}
          <p className="cat-page-count">{total} film{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Films */}
      <div className="cat-page-body container">
        {/* Sort */}
        <div className="cat-page-toolbar">
          <div className="sort-tabs">
            {[
              ['-views',      '🔥 Most Viewed'],
              ['-created_at', '✨ Newest'],
              ['title',       'A–Z'],
            ].map(([val, lbl]) => (
              <button
                key={val}
                className={`sort-tab ${ordering === val ? 'active' : ''}`}
                onClick={() => setOrdering(val)}
              >{lbl}</button>
            ))}
          </div>
        </div>

        {loading && films.length === 0 ? (
          <div className="browse-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="film-card-skeleton">
                <div className="skeleton poster-skel" />
                <div className="skeleton title-skel" style={{ marginBottom: 6 }} />
                <div className="skeleton sub-skel" />
              </div>
            ))}
          </div>
        ) : films.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3 className="empty-title">No films yet</h3>
            <p className="empty-desc">No approved films in this category yet.</p>
            <Link to="/browse" className="btn btn-outline">Browse All Films</Link>
          </div>
        ) : (
          <>
            <div className="browse-grid">
              {films.map(film => <FilmCard key={film.id} film={film} />)}
            </div>
            {page < totalPages && (
              <div className="load-more-wrap">
                <button className="btn btn-outline btn-lg load-more-btn"
                  onClick={handleLoadMore} disabled={loading}>
                  {loading ? 'Loading…' : 'Load More'}
                </button>
                <p className="load-more-info">Showing {films.length} of {total}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
