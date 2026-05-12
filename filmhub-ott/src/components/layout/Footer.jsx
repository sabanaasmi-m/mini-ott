import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <Link to="/" className="footer-logo">
          <span className="logo-mark">F</span>
          <span className="logo-text">ILMHUB</span>
        </Link>
        <p className="footer-tagline">Where independent cinema finds its audience.</p>
        <div className="footer-social">
          {['𝕏','📘','📸','▶'].map((icon, i) => (
            <a key={i} href="#" className="social-btn" aria-label="social">{icon}</a>
          ))}
        </div>
      </div>

      <div className="footer-links-grid">
        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/browse">Browse Films</Link>
          <Link to="/browse?filter=trending">Trending</Link>
          <Link to="/browse?filter=new">New Releases</Link>
          <Link to="/browse?is_premium=false">Free Films</Link>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/profile">My Profile</Link>
          <Link to="/watchlist">Watchlist</Link>
          <Link to="/subscriptions">Subscription</Link>
          <Link to="/register">Sign Up</Link>
        </div>
        <div className="footer-col">
          <h4>FilmHub</h4>
          <a href="#">About Us</a>
          <a href="#">For Creators</a>
          <a href="#">Careers</a>
          <a href="#">Contact</a>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <a href="#">Terms of Use</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Cookie Policy</a>
          <a href="#">DMCA</a>
        </div>
      </div>
    </div>

    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} FilmHub. All rights reserved.</p>
      <p className="footer-credit">Made with ❤️ for independent cinema</p>
    </div>
  </footer>
);

export default Footer;
