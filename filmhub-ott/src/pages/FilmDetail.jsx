import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/ui/StarRating';
import FilmRow from '../components/film/FilmRow';
import './styles/FilmDetail.css';

const FilmDetail = () => {
  const { id } = useParams();
  const navigate  = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [film,        setFilm]        = useState(null);
  const [comments,    setComments]    = useState([]);
  const [related,     setRelated]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [toggling,    setToggling]    = useState(false);

  // Comment form
  const [commentText, setCommentText] = useState('');
  const [rating,      setRating]      = useState(0);
  const [submitting,  setSubmitting]  = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchFilm();
  }, [id]);

  const fetchFilm = async () => {
    setLoading(true);
    try {
      const [filmRes, commentsRes] = await Promise.all([
        api.get(`shortfilms/${id}/`),
        api.get(`comments/?film=${id}`),
      ]);
      const f = filmRes.data;
      setFilm(f);
      setInWatchlist(f.in_watchlist || false);
      setComments(commentsRes.data?.results || commentsRes.data || []);

      // Fetch related by same category
      if (f.category) {
        const relRes = await api.get('shortfilms/', {
          params: { status: 'APPROVED', category: f.category, page_size: 12 },
        });
        const allRel = relRes.data?.results || relRes.data || [];
        setRelated(allRel.filter(r => r.id !== Number(id)));
      }
    } catch {
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (toggling) return;
    setToggling(true);
    try {
      if (inWatchlist) { await api.delete(`watchlist/${id}/`); setInWatchlist(false); }
      else             { await api.post('watchlist/', { film: id }); setInWatchlist(true); }
    } catch {/* silent */}
    finally { setToggling(false); }
  };

  const handleWatch = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate(`/watch/${id}`);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!commentText.trim()) { setCommentError('Please write something.'); return; }
    setSubmitting(true);
    setCommentError('');
    try {
      const res = await api.post('comments/', {
        film: id,
        text: commentText.trim(),
        rating: rating || null,
      });
      setComments(prev => [res.data, ...prev]);
      setCommentText('');
      setRating(0);
    } catch (err) {
      setCommentError(err?.response?.data?.detail || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="film-detail-page">
      <div className="detail-skeleton">
        <div className="skeleton detail-hero-skel" />
        <div className="container" style={{ paddingTop: 40 }}>
          <div className="skeleton" style={{ width: '60%', height: 52, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '40%', height: 18, marginBottom: 24 }} />
          <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
            <div className="skeleton" style={{ width: 150, height: 48, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 150, height: 48, borderRadius: 8 }} />
          </div>
          <div className="skeleton" style={{ width: '80%', height: 80, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );

  if (!film) return null;

  const approvedComments = comments.filter(c => c.is_approved !== false);

  return (
    <div className="film-detail-page">
      {/* ── Hero backdrop ── */}
      <div className="detail-hero">
        {film.thumbnail_url && (
          <img src={film.thumbnail_url} alt={film.title} className="detail-hero-img" />
        )}
        <div className="detail-hero-overlay" />
      </div>

      {/* ── Main content ── */}
      <div className="detail-main container">
        <div className="detail-layout">
          {/* Left: Poster + actions */}
          <div className="detail-poster-col">
            <div className="detail-poster">
              {film.thumbnail_url
                ? <img src={film.thumbnail_url} alt={film.title} />
                : <div className="detail-poster-fallback">🎬</div>
              }
            </div>

            <div className="detail-poster-actions">
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={handleWatch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                {film.is_premium && !user?.is_subscribed ? 'Subscribe to Watch' : 'Watch Now'}
              </button>

              <button
                className={`btn btn-outline btn-lg ${inWatchlist ? 'btn-watchlist-active' : ''}`}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={toggleWatchlist}
                disabled={toggling}
              >
                {inWatchlist ? '🔖 In Watchlist' : '＋ Watchlist'}
              </button>
            </div>

            {/* Meta panel */}
            <div className="detail-meta-panel">
              {[
                film.language       && ['Language',  film.language],
                film.duration_minutes && ['Duration', `${film.duration_minutes} min`],
                film.category_detail?.name && ['Category', film.category_detail.name],
                film.views > 0      && ['Views',     film.views.toLocaleString()],
                film.average_rating && ['Rating',    `${film.average_rating} / 5`],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="meta-row">
                  <span className="meta-label">{label}</span>
                  <span className="meta-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="detail-info-col">
            {/* Breadcrumb */}
            <div className="detail-breadcrumb">
              <Link to="/">Home</Link> / <Link to="/browse">Browse</Link>
              {film.category_detail?.name && (
                <> / <Link to={`/category/${film.category}`}>{film.category_detail.name}</Link></>
              )}
            </div>

            {/* Badges */}
            <div className="detail-badges">
              {film.is_premium && <span className="badge badge-premium">👑 Premium</span>}
              {!film.is_premium && <span className="badge badge-free">🆓 Free</span>}
              {film.language && <span className="badge" style={{ background: 'var(--bg4)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>{film.language}</span>}
            </div>

            <h1 className="detail-title">{film.title}</h1>

            {film.average_rating && (
              <div className="detail-rating">
                <StarRating value={Math.round(film.average_rating)} readonly size={20} />
                <span className="rating-num">{film.average_rating} out of 5</span>
                <span className="rating-count">({approvedComments.length} review{approvedComments.length !== 1 ? 's' : ''})</span>
              </div>
            )}

            <p className="detail-desc">{film.description}</p>

            {/* Premium notice */}
            {film.is_premium && isAuthenticated && !user?.is_subscribed && (
              <div className="premium-notice">
                <span>👑</span>
                <div>
                  <strong>Premium Content</strong>
                  <p>Subscribe to FilmHub to watch this film and hundreds more.</p>
                  <Link to="/subscriptions" className="btn btn-gold btn-sm" style={{ marginTop: 10, display: 'inline-flex' }}>
                    View Plans
                  </Link>
                </div>
              </div>
            )}

            {/* ── Comments ── */}
            <div className="detail-comments">
              <h2 className="comments-heading">
                Reviews <span>({approvedComments.length})</span>
              </h2>

              {/* Write review form */}
              {isAuthenticated ? (
                <form className="comment-form" onSubmit={submitComment}>
                  <div className="comment-form-head">
                    <div className="comment-avatar">{(user?.username || 'U')[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <p className="comment-form-user">{user?.username}</p>
                      <StarRating value={rating} onChange={setRating} size={20} />
                    </div>
                  </div>
                  <textarea
                    className="comment-textarea"
                    placeholder="Share your thoughts about this film…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  {commentError && <p className="error-text" style={{ marginBottom: 8 }}>{commentError}</p>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                      {submitting ? 'Posting…' : 'Post Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="comment-login-prompt">
                  <Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
                  <span> to write a review</span>
                </div>
              )}

              {/* Comment list */}
              {approvedComments.length === 0 ? (
                <div className="no-comments">
                  <p>No reviews yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="comments-list">
                  {approvedComments.map(c => (
                    <div key={c.id} className="comment-card">
                      <div className="comment-header">
                        <div className="comment-avatar">{(c.username || c.user_name || 'U')[0].toUpperCase()}</div>
                        <div>
                          <p className="comment-username">{c.username || c.user_name || `User #${c.user}`}</p>
                          <p className="comment-date">{new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                        {c.rating && (
                          <div className="comment-stars">
                            <StarRating value={c.rating} readonly size={14} />
                          </div>
                        )}
                      </div>
                      <p className="comment-text">{c.text}</p>
                      {c.likes_count > 0 && (
                        <p className="comment-likes">👍 {c.likes_count}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Related films ── */}
      {related.length > 0 && (
        <FilmRow
          title="More Like This"
          films={related}
          viewAllLink={`/category/${film.category}`}
        />
      )}
    </div>
  );
};

export default FilmDetail;
