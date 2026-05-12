import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import Swal from 'sweetalert2'
import '../styles/CreatorComments.css'

const Comments = () => {
  const { user } = useAuth()
  const [films, setFilms] = useState([])
  const [comments, setComments] = useState([])
  const [selectedFilm, setSelectedFilm] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState({})
  const [submitting, setSubmitting] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const filmsRes = await api.get('shortfilms/', { params: { uploaded_by: user?.id, status: 'APPROVED' } })
      const myFilms = filmsRes.data?.results || filmsRes.data || []
      setFilms(myFilms)

      // Fetch comments for each approved film
      let allComments = []
      for (const film of myFilms) {
        try {
          const cRes = await api.get(`comments/?film=${film.id}`)
          const filmComments = (cRes.data?.results || cRes.data || []).map(c => ({
            ...c, film_title: film.title, film_id: film.id,
          }))
          allComments = [...allComments, ...filmComments]
        } catch {}
      }
      allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setComments(allComments)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (commentId) => {
    const text = replyText[commentId]?.trim()
    if (!text) return
    setSubmitting(commentId)
    try {
      // Post reply as a new comment tagged to same film
      const comment = comments.find(c => c.id === commentId)
      await api.post('comments/', {
        film: comment.film_id,
        text: `↩ Reply to @${comment.username}: ${text}`,
      })
      setReplyText(prev => ({ ...prev, [commentId]: '' }))
      Swal.fire({ icon: 'success', title: 'Reply posted!', timer: 1200, showConfirmButton: false, background: '#111118', color: '#f0f0e8' })
      fetchData()
    } catch {
      Swal.fire('Error', 'Could not post reply', 'error')
    } finally {
      setSubmitting(null) }
  }

  const filtered = selectedFilm === 'ALL'
    ? comments
    : comments.filter(c => c.film_id === parseInt(selectedFilm))

  const renderStars = (rating) => {
    if (!rating) return null
    return (
      <span className="star-rating">
        {[1,2,3,4,5].map(s => (
          <span key={s} style={{ color: s <= rating ? 'var(--accent)' : 'var(--bg4)' }}>★</span>
        ))}
      </span>
    )
  }

  return (
    <div className="comments-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comments</h1>
          <p className="page-subtitle">{comments.length} comment{comments.length !== 1 ? 's' : ''} on your films</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchData}>↻ Refresh</button>
      </div>

      {/* Film filter */}
      <div className="comments-film-filter">
        <button
          className={`film-filter-btn ${selectedFilm === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedFilm('ALL')}
        >
          All Films ({comments.length})
        </button>
        {films.map(f => (
          <button
            key={f.id}
            className={`film-filter-btn ${selectedFilm === f.id ? 'active' : ''}`}
            onClick={() => setSelectedFilm(f.id)}
          >
            {f.title.slice(0, 20)}{f.title.length > 20 ? '...' : ''} ({comments.filter(c => c.film_id === f.id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3 className="empty-title">No comments yet</h3>
          <p className="empty-desc">When viewers comment on your films, they'll appear here.</p>
        </div>
      ) : (
        <div className="comments-list">
          {filtered.map(comment => (
            <div key={comment.id} className="comment-card">
              <div className="comment-header">
                <div className="commenter-info">
                  <div className="commenter-avatar">
                    {(comment.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="commenter-name">{comment.username || `User #${comment.user}`}</p>
                    <p className="comment-film-label">on <em>{comment.film_title}</em></p>
                  </div>
                </div>
                <div className="comment-meta-right">
                  {renderStars(comment.rating)}
                  <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="comment-body">{comment.text}</p>

              <div className="comment-likes">
                👍 {comment.likes_count || 0} likes
              </div>

              {/* Reply box */}
              <div className="reply-box">
                <input
                  className="form-input reply-input"
                  placeholder={`Reply to ${comment.username}...`}
                  value={replyText[comment.id] || ''}
                  onChange={e => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply(comment.id)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={submitting === comment.id || !replyText[comment.id]?.trim()}
                >
                  {submitting === comment.id ? '...' : 'Reply'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Comments
