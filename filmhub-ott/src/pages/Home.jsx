import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import HeroBanner from '../components/film/HeroBanner';
import FilmRow from '../components/film/FilmRow';
import './styles/Home.css';

const Home = () => {
  const [featured,   setFeatured]   = useState([]);
  const [trending,   setTrending]   = useState([]);
  const [newRelease, setNewRelease] = useState([]);
  const [free,       setFree]       = useState([]);
  const [premium,    setPremium]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [filmsRes, catsRes] = await Promise.all([
          api.get('shortfilms/', { params: { status: 'APPROVED', page_size: 40 } }),
          api.get('categories/'),
        ]);

        const films = filmsRes.data?.results || filmsRes.data || [];
        const cats  = catsRes.data?.results  || catsRes.data  || [];

        // Sort variants
        const byViews  = [...films].sort((a, b) => (b.views || 0) - (a.views || 0));
        const byDate   = [...films].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const freeList = films.filter(f => !f.is_premium);
        const premList = films.filter(f =>  f.is_premium);

        setFeatured(byViews.slice(0, 5));
        setTrending(byViews.slice(0, 16));
        setNewRelease(byDate.slice(0, 16));
        setFree(freeList.slice(0, 16));
        setPremium(premList.slice(0, 16));
        setCategories(cats.slice(0, 8));
      } catch (err) {
        console.error('Home fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="home-page">
      {/* Hero */}
      <HeroBanner films={featured} />

      {/* Content */}
      <div className="home-content">

        {/* Trending */}
        <FilmRow
          title="🔥 Trending Now"
          films={trending}
          viewAllLink="/browse?ordering=-views"
          loading={loading}
        />

        {/* Categories strip */}
        {categories.length > 0 && (
          <section className="categories-strip container">
            <h2 className="strip-title">Browse by Genre</h2>
            <div className="cat-scroll">
              {categories.map(cat => (
                <Link key={cat.id} to={`/category/${cat.id}`} className="cat-pill">
                  {cat.image && <img src={cat.image} alt={cat.name} className="cat-pill-img" />}
                  <span>{cat.name}</span>
                </Link>
              ))}
              <Link to="/browse" className="cat-pill cat-pill-more">View All →</Link>
            </div>
          </section>
        )}

        {/* New Releases */}
        <FilmRow
          title="✨ New Releases"
          films={newRelease}
          viewAllLink="/browse?ordering=-created_at"
          loading={loading}
        />

        {/* Premium banner */}
        <section className="premium-banner container">
          <div className="premium-banner-inner">
            <div className="premium-banner-text">
              <span className="premium-banner-eyebrow">FilmHub Premium</span>
              <h2 className="premium-banner-title">Unlock Every Frame</h2>
              <p className="premium-banner-desc">
                Get unlimited access to all premium short films from the world's most
                talented independent creators. No ads. No limits.
              </p>
              <Link to="/subscriptions" className="btn btn-gold btn-lg">
                👑 Explore Plans
              </Link>
            </div>
            <div className="premium-banner-visual">
              <div className="pb-card pb-card-1">🎬</div>
              <div className="pb-card pb-card-2">🏆</div>
              <div className="pb-card pb-card-3">✨</div>
            </div>
          </div>
        </section>

        {/* Free Films */}
        {free.length > 0 && (
          <FilmRow
            title="🆓 Free to Watch"
            films={free}
            viewAllLink="/browse?is_premium=false"
            loading={loading}
          />
        )}

        {/* Premium Films */}
        {premium.length > 0 && (
          <FilmRow
            title="👑 Premium Films"
            films={premium}
            viewAllLink="/browse?is_premium=true"
            loading={loading}
          />
        )}

        {/* Features section */}
        <section className="features-section container">
          <h2 className="features-title">Why FilmHub?</h2>
          <div className="features-grid">
            {[
              { icon: '🎭', title: 'Curated Content', desc: 'Every film is reviewed and approved by our editorial team.' },
              { icon: '🌍', title: 'Global Voices', desc: 'Films in Tamil, English, Hindi, Telugu and more languages.' },
              { icon: '📱', title: 'Watch Anywhere', desc: 'Stream on any device — phone, tablet, or desktop.' },
              { icon: '💬', title: 'Community', desc: 'Rate, review, and discuss films with fellow cinephiles.' },
            ].map((f, i) => (
              <div key={i} className="feature-card fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
