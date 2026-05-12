import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import './styles/Subscriptions.css';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Subscriptions = () => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(null);

  useEffect(() => {
    api.get('subscriptions/plans/')
      .then(r => setPlans(r.data?.results || r.data || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const isFree = parseFloat(plan.price) === 0;
    if (isFree) { navigate('/register'); return; }

    const scriptLoaded = await loadRazorpay();
    if (!scriptLoaded) {
      Swal.fire('Error', 'Payment gateway failed to load. Check your internet connection.', 'error');
      return;
    }

    setPaying(plan.id);
    try {
      const orderRes = await api.post('subscriptions/create-order/', { plan_id: plan.id });
      const { order_id, amount, currency, key, plan_name, plan_id } = orderRes.data;

      const options = {
        key, amount, currency,
        name: 'FilmHub',
        description: `${plan_name} Subscription`,
        order_id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('subscriptions/verify-payment/', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
              plan_id,
            });
            if (refreshUser) await refreshUser();
            Swal.fire({
              icon: 'success', title: '🎉 Subscription Activated!',
              html: `<p style="color:#a09e98;font-size:15px">You now have access to all <strong style="color:#c9a84c">${plan_name}</strong> content.<br>Valid till <strong style="color:#f2f0ea">${verifyRes.data.valid_till}</strong></p>`,
              confirmButtonColor: '#c9a84c', confirmButtonText: 'Watch Now',
              background: '#111', color: '#f2f0ea',
            }).then(() => navigate('/browse?is_premium=true'));
          } catch (err) {
            Swal.fire('Payment Error', err?.response?.data?.error || 'Verification failed. Contact support.', 'error');
          }
          setPaying(null);
        },
        prefill: { name: user?.username || '', email: user?.email || '' },
        theme: { color: '#e8001d' },
        modal: { ondismiss: () => setPaying(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setPaying(null);
        Swal.fire('Payment Failed', response.error?.description || 'Try a different payment method.', 'error');
      });
      rzp.open();
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.error || 'Could not initiate payment. Try again.', 'error');
      setPaying(null);
    }
  };

  const fallbackPlans = [
    { id: 'free',   name: 'Free',    price: '0',   duration_days: null, description: 'Access to all free short films',   features: ['Unlimited free films', 'HD quality', 'Community reviews', 'Personal watchlist'] },
    { id: 'basic',  name: 'Basic',   price: '99',  duration_days: 30,   description: 'Perfect for casual viewers',        features: ['Everything in Free', 'All premium films', 'No ads', 'Priority support'] },
    { id: 'annual', name: 'Premium', price: '799', duration_days: 365,  description: 'Best value for film enthusiasts',   features: ['Everything in Basic', 'Early access to new films', 'Behind-the-scenes content', 'Creator Q&A access'], popular: true },
  ];

  const displayPlans = plans.length > 0 ? plans : fallbackPlans;

  return (
    <div className="subs-page">
      {user?.is_subscribed && (
        <div className="active-sub-banner">
          <div className="asb-inner container">
            <span className="asb-icon">👑</span>
            <div>
              <strong>You have an active {user.plan_name || 'Premium'} subscription</strong>
              <p>Valid till {user.subscription_end ? new Date(user.subscription_end).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} · {user.days_remaining || 0} days remaining</p>
            </div>
            <Link to="/browse?is_premium=true" className="btn btn-gold btn-sm">Watch Premium →</Link>
          </div>
        </div>
      )}

      <div className="subs-header">
        <p className="subs-eyebrow">FilmHub Plans</p>
        <h1 className="subs-title">Unlock the Full Cinema</h1>
        <p className="subs-subtitle">From free independent films to exclusive premium content — find the plan that fits your world.</p>
      </div>

      {loading ? (
        <div className="subs-plans-grid container">
          {[1,2,3].map(i => (
            <div key={i} className="plan-card-skel">
              <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 48, width: '40%', marginBottom: 20 }} />
              <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, marginBottom: 28, width: '80%' }} />
              <div className="skeleton" style={{ height: 44, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="subs-plans-grid container">
          {displayPlans.map((plan, i) => {
            const isPopular      = plan.popular || (i === displayPlans.length - 1 && displayPlans.length > 1);
            const isFree         = parseFloat(plan.price) === 0;
            const features       = plan.features || [plan.description];
            const isCurrentPlan  = user?.plan_name === plan.name && user?.is_subscribed;

            return (
              <div key={plan.id} className={`plan-card ${isPopular ? 'popular' : ''} ${isFree ? 'free-plan' : ''}`}>
                {isPopular    && <div className="plan-popular-badge">Most Popular</div>}
                {isCurrentPlan && <div className="plan-current-badge">✓ Active</div>}

                <div className="plan-header">
                  <h2 className="plan-name">{plan.name}</h2>
                  <div className="plan-price">
                    {isFree ? <span className="price-free">Free</span> : (
                      <><span className="price-currency">₹</span>
                        <span className="price-amount">{plan.price}</span>
                        <span className="price-period">/{plan.duration_days === 365 ? 'year' : plan.duration_days === 30 ? 'month' : `${plan.duration_days}d`}</span>
                      </>
                    )}
                  </div>
                  {plan.description && <p className="plan-desc">{plan.description}</p>}
                </div>

                <ul className="plan-features">
                  {features.map((feat, fi) => (<li key={fi}><span className="feat-check">✓</span>{feat}</li>))}
                </ul>

                <button
                  className={`btn plan-btn ${isCurrentPlan ? 'btn-outline' : isPopular ? 'btn-gold' : isFree ? 'btn-outline' : 'btn-primary'}`}
                  onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                  disabled={paying === plan.id || isCurrentPlan}
                >
                  {paying === plan.id
                    ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing…</>
                    : isCurrentPlan ? '✓ Active Plan'
                    : isFree ? 'Get Started Free'
                    : `Pay ₹${plan.price}`}
                </button>

                {!isFree && !isCurrentPlan && (
                  <p className="plan-secure">🔒 Secured by Razorpay · UPI, Cards, Net Banking</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="trust-badges container">
        {['🔒 256-bit SSL encryption', '💳 UPI / Cards / Net Banking / Wallets', '🇮🇳 Indian payment gateway (Razorpay)', '↩ Easy cancellation anytime'].map((b, i) => (
          <div key={i} className="trust-badge">{b}</div>
        ))}
      </div>

      <section className="subs-faq container">
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your profile settings. Access continues until the period ends.' },
            { q: 'What payment methods are accepted?', a: 'UPI (GPay, PhonePe, Paytm), all credit & debit cards, net banking, and popular wallets via Razorpay.' },
            { q: 'What is a premium film?', a: 'Premium films are exclusive works curated by our editorial team — award-winning, higher production quality short films.' },
            { q: 'Is my payment secure?', a: 'Yes. All payments are processed by Razorpay, a PCI DSS Level 1 certified gateway used by thousands of Indian businesses.' },
          ].map((f, i) => (
            <div key={i} className="faq-item">
              <h4 className="faq-q">{f.q}</h4>
              <p className="faq-a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Subscriptions;