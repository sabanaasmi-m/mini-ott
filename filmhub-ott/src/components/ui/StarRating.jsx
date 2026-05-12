import React, { useState } from 'react';

const StarRating = ({ value = 0, onChange, readonly = false, size = 22 }) => {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize: size,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= display ? '#c9a84c' : 'var(--bg5)',
            transition: 'color 0.15s, transform 0.15s',
            display: 'inline-block',
            transform: !readonly && hovered >= star ? 'scale(1.15)' : 'scale(1)',
            userSelect: 'none',
          }}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange && onChange(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
