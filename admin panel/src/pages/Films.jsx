import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/Films.css';

const Films = () => {
  const navigate = useNavigate();
  const [films, setFilms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPremium, setFilterPremium] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchFilms();
  }, [search, filterCategory, filterStatus, filterPremium, page]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('categories/');
      setCategories(res.data?.results || res.data || []);
    } catch { }
  };

  const fetchFilms = async () => {
    try {
      setLoading(true);
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (filterPremium !== '') params.is_premium = filterPremium;

      const res = await api.get('shortfilms/', { params });
      const data = res.data;
      if (data.results) {
        setFilms(data.results);
        setTotalCount(data.count);
      } else {
        setFilms(data);
        setTotalCount(data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: `Delete "${title}"?`,
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e50914',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`shortfilms/${id}/`);
      setFilms(prev => prev.filter(f => f.id !== id));
      setTotalCount(prev => prev - 1);
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire('Error', 'Could not delete film', 'error');
    }
  };

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="films-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Short Films</h1>
          <p className="page-subtitle">{totalCount} film{totalCount !== 1 ? 's' : ''} total</p>
        </div>
        <div className="header-actions">
          <Link to="/films/approval" className="btn-outline">⏳ Pending ({films.filter(f => f.status === 'PENDING').length})</Link>
          <Link to="/films/add" className="btn-primary-red">+ Add Film</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="films-filters">
        <input
          type="text"
          className="search-input-large"
          placeholder="🔍 Search by title, language..."
          value={search}
          onChange={handleSearch}
        />
        <select className="filter-select" value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select className="filter-select" value={filterPremium} onChange={e => { setFilterPremium(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="false">Free</option>
          <option value="true">Premium</option>
        </select>
        {(search || filterCategory || filterStatus || filterPremium) && (
          <button className="btn-clear-filters" onClick={() => { setSearch(''); setFilterCategory(''); setFilterStatus(''); setFilterPremium(''); setPage(1); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner-border"></div></div>
      ) : films.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <h3 className="empty-state-title">No films found</h3>
          <p className="empty-state-description">Try adjusting your filters or add a new film.</p>
          <Link to="/films/add" className="btn-primary-red" style={{ display: 'inline-block', marginTop: 10 }}>+ Add First Film</Link>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Film</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {films.map(film => (
                  <tr key={film.id}>
                    <td>
                      <div className="film-info">
                        <img
                          src={film.thumbnail_url || 'https://placehold.co/48x64/1a1a1a/666?text=?'}
                          alt={film.title}
                          className="film-thumbnail"
                        />
                        <div>
                          <div className="film-title-cell">{film.title}</div>
                          <div className="film-lang-cell">{film.language || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{film.category_detail?.name || film.category || '—'}</td>
                    <td>{film.duration_minutes ? `${film.duration_minutes} min` : '—'}</td>
                    <td>
                      <span className={`badge-custom ${film.is_premium ? 'badge-premium' : 'badge-free'}`}>
                        {film.is_premium ? '👑 Premium' : '🆓 Free'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-custom ${film.status === 'APPROVED' ? 'badge-success' :
                          film.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                        }`}>{film.status}</span>
                    </td>
                    <td>{film.views?.toLocaleString() ?? 0}</td>
                    <td>{new Date(film.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-edit" onClick={() => navigate(`/films/edit/${film.id}`)}>✏️</button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(film.id, film.title)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="page-btn">← Prev</button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...'
                      ? <span key={`dots-${idx}`} className="page-dots">...</span>
                      : <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  )
                }
              </div>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="page-btn">Next →</button>
              <span className="page-info">Page {page} of {totalPages} ({totalCount} total)</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Films;