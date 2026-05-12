import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import FilmCard from '../components/film/FilmCard';
import './styles/Browse.css';

const LANGUAGES = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Other'];
const SORT_OPTIONS = [
  { value: '-views',       label: 'Most Viewed' },
  { value: '-created_at',  label: 'Newest First' },
  { value: 'created_at',   label: 'Oldest First' },
  { value: 'title',        label: 'A – Z' },
  { value: '-title',       label: 'Z – A' },
];
const PAGE_SIZE = 24;

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [films,      setFilms]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);

  // Filters (controlled from URL params for shareability)
  const [search,    setSearch]    = useState(searchParams.get('search')    || '');
  const [category,  setCategory]  = useState(searchParams.get('category')  || '');
  const [language,  setLanguage]  = useState(searchParams.get('language')  || '');
  const [isPremium, setIsPremium] = useState(searchParams.get('is_premium') || '');
  const [ordering,  setOrdering]  = useState(searchParams.get('ordering')  || '-views');
  const [sideOpen,  setSideOpen]  = useState(false);

  const searchRef = useRef();

  useEffect(() => {
    api.get('categories/').then(r => setCategories(r.data?.results || r.data || []));
  }, []);

  const fetchFilms = useCallback(async (resetPage = true) => {
    const p = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    setLoading(true);
    try {
      const params = { status: 'APPROVED', page: p, page_size: PAGE_SIZE };
      if (search)    params.search    = search;
      if (category)  params.category  = category;
      if (language)  params.language  = language;
      if (isPremium !== '') params.is_premium = isPremium;
      if (ordering)  params.ordering  = ordering;

      const res = await api.get('shortfilms/', { params });
      const data = res.data;
      if (resetPage) setFilms(data?.results || data || []);
      else setFilms(prev => [...prev, ...(data?.results || data || [])]);
      setTotal(data?.count ?? (data?.results ?? data)?.length ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, language, isPremium, ordering, page]);

  // Refetch when filters change
  useEffect(() => { fetchFilms(true); }, [search, category, language, isPremium, ordering]);

  const handleLoadMore = () => {
    setPage(p => p + 1);
    fetchFilms(false);
  };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setLanguage(''); setIsPremium(''); setOrdering('-views');
    setSearchParams({});
  };

  const hasFilters = search || category || language || isPremium !== '';
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="browse-page">
      {/* Header */}
      <div className="browse-header">
        <div className="browse-header-inner container">
          <div>
            <h1 className="browse-title">Browse Films</h1>
            <p className="browse-subtitle">
              {loading ? 'Loading…' : `${total} film${total !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Search bar */}
          <form className="browse-search" onSubmit={(e) => { e.preventDefault(); fetchFilms(true); }}>
            <div className="browse-search-wrap">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={searchRef}
                className="browse-search-input"
                placeholder="Search by title, language…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
          </form>

          <button className="filter-toggle-btn" onClick={() => setSideOpen(o => !o)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
            </svg>
            Filters {hasFilters && <span className="filter-badge">!</span>}
          </button>
        </div>
      </div>

      <div className="browse-body container">
        {/* ── Sidebar filters ── */}
        <aside className={`browse-sidebar ${sideOpen ? 'open' : ''}`}>
          <div className="sidebar-head">
            <h3>Filters</h3>
            {hasFilters && <button className="clear-btn" onClick={clearFilters}>Clear all</button>}
          </div>

          {/* Sort */}
          <div className="filter-section">
            <h4 className="filter-label">Sort By</h4>
            {SORT_OPTIONS.map(o => (
              <label key={o.value} className={`filter-radio ${ordering === o.value ? 'checked' : ''}`}>
                <input type="radio" name="sort" value={o.value} checked={ordering === o.value}
                  onChange={() => setOrdering(o.value)} />
                {o.label}
              </label>
            ))}
          </div>

          {/* Type */}
          <div className="filter-section">
            <h4 className="filter-label">Type</h4>
            {[['', 'All Films'], ['false', '🆓 Free'], ['true', '👑 Premium']].map(([val, lbl]) => (
              <label key={val} className={`filter-radio ${isPremium === val ? 'checked' : ''}`}>
                <input type="radio" name="type" value={val} checked={isPremium === val}
                  onChange={() => setIsPremium(val)} />
                {lbl}
              </label>
            ))}
          </div>

          {/* Category */}
          <div className="filter-section">
            <h4 className="filter-label">Category</h4>
            <select className="form-select filter-select" value={category}
              onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Language */}
          <div className="filter-section">
            <h4 className="filter-label">Language</h4>
            <div className="lang-chips">
              {['', ...LANGUAGES].map(lang => (
                <button key={lang} className={`lang-chip ${language === lang ? 'active' : ''}`}
                  onClick={() => setLanguage(lang)}>
                  {lang || 'All'}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Film Grid ── */}
        <div className="browse-main">
          {/* Active filters */}
          {hasFilters && (
            <div className="active-filters">
              {search    && <span className="filter-tag">"{search}" <button onClick={() => setSearch('')}>✕</button></span>}
              {category  && <span className="filter-tag">{categories.find(c => String(c.id) === String(category))?.name} <button onClick={() => setCategory('')}>✕</button></span>}
              {language  && <span className="filter-tag">{language} <button onClick={() => setLanguage('')}>✕</button></span>}
              {isPremium === 'true'  && <span className="filter-tag">Premium <button onClick={() => setIsPremium('')}>✕</button></span>}
              {isPremium === 'false' && <span className="filter-tag">Free <button onClick={() => setIsPremium('')}>✕</button></span>}
            </div>
          )}

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
              <h3 className="empty-title">No films found</h3>
              <p className="empty-desc">Try adjusting your filters or search term.</p>
              {hasFilters && <button className="btn btn-outline" onClick={clearFilters}>Clear Filters</button>}
            </div>
          ) : (
            <>
              <div className="browse-grid">
                {films.map(film => <FilmCard key={film.id} film={film} />)}
              </div>

              {/* Load more */}
              {page < totalPages && (
                <div className="load-more-wrap">
                  <button className="btn btn-outline btn-lg load-more-btn"
                    onClick={handleLoadMore} disabled={loading}>
                    {loading ? <><div className="spinner" style={{width:18,height:18,borderWidth:2}} /> Loading…</> : 'Load More Films'}
                  </button>
                  <p className="load-more-info">
                    Showing {films.length} of {total} films
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Browse;
