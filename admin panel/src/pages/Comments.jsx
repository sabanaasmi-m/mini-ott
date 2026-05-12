import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import './styles/Comments.css';

const Comments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, approved, pending
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      // Try all films and get their comments
      const filmsRes = await api.get('shortfilms/');
      const films = filmsRes.data;
      
      let allComments = [];
      for (const film of films.slice(0, 20)) { // limit to first 20 films
        try {
          const commentsRes = await api.get(`comments/?film=${film.id}`);
          const filmComments = (commentsRes.data.results || commentsRes.data).map(c => ({
            ...c,
            film_title: film.title,
          }));
          allComments = [...allComments, ...filmComments];
        } catch {}
      }
      setComments(allComments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`comments/${id}/approve/`);
      setComments(prev => prev.map(c => c.id === id ? { ...c, is_approved: true } : c));
      Swal.fire({ icon: 'success', title: 'Approved', timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire('Error', 'Failed to approve comment', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Comment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e50914',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`comments/${id}/`);
      setComments(prev => prev.filter(c => c.id !== id));
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire('Error', 'Failed to delete comment', 'error');
    }
  };

  const renderStars = (rating) => {
    if (!rating) return <span style={{ color: '#666' }}>No rating</span>;
    return (
      <span className="stars">
        {[1,2,3,4,5].map(s => (
          <span key={s} style={{ color: s <= rating ? '#f59e0b' : '#3a3a3a', fontSize: 16 }}>★</span>
        ))}
      </span>
    );
  };

  const filtered = comments.filter(c => {
    const matchFilter = filter === 'all' || (filter === 'approved' ? c.is_approved : !c.is_approved);
    const matchSearch = !search ||
      c.film_title?.toLowerCase().includes(search.toLowerCase()) ||
      (c.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      c.text?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="comments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comments</h1>
          <p className="page-subtitle">Moderate user comments and reviews</p>
        </div>
        <div className="comments-stats">
          <span className="stat-pill">{comments.length} Total</span>
          <span className="stat-pill approved">{comments.filter(c => c.is_approved).length} Approved</span>
          <span className="stat-pill pending">{comments.filter(c => !c.is_approved).length} Pending</span>
        </div>
      </div>

      <div className="filters-section">
        <input
          type="text"
          className="search-input-large"
          placeholder="Search by film, user, or content..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {['all', 'approved', 'pending'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner-border"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3 className="empty-state-title">No comments found</h3>
          <p className="empty-state-description">
            {comments.length === 0 ? 'No comments have been posted yet.' : 'No comments match your filter.'}
          </p>
        </div>
      ) : (
        <div className="comments-list">
          {filtered.map(comment => (
            <div key={comment.id} className={`comment-card ${!comment.is_approved ? 'pending' : ''}`}>
              <div className="comment-meta">
                <div className="comment-user">
                  <div className="user-avatar">
                    {(comment.user_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <strong>{comment.user_name || `User #${comment.user}`}</strong>
                    <div className="comment-film">on: <em>{comment.film_title || `Film #${comment.film}`}</em></div>
                  </div>
                </div>
                <div className="comment-right">
                  {renderStars(comment.rating)}
                  <span className={`status-badge ${comment.is_approved ? 'approved' : 'pending'}`}>
                    {comment.is_approved ? '✓ Approved' : '⏳ Pending'}
                  </span>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="comment-text">{comment.text}</p>
              <div className="comment-actions">
                {!comment.is_approved && (
                  <button className="btn-approve" onClick={() => handleApprove(comment.id)}>
                    ✓ Approve
                  </button>
                )}
                <button className="btn-delete-comment" onClick={() => handleDelete(comment.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments;