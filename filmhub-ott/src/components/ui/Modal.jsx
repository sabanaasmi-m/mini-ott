import React, { useEffect } from 'react';

const Modal = ({ open, onClose, title, children, maxWidth = 480 }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--border)'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 22,
            color: 'var(--text)', letterSpacing: '0.02em', margin: 0
          }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text2)',
            fontSize: 22, cursor: 'pointer', lineHeight: 1,
            transition: 'color 0.2s'
          }}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
