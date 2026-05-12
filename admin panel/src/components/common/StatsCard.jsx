import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, change, isPositive = true, icon, iconColor = 'red' }) => {
  return (
    <div className="stats-card-widget">
      <div className="stats-card-header">
        <div className="stats-card-title">{title}</div>
        <div className={`stats-card-icon ${iconColor}`}>{icon}</div>
      </div>
      <div className="stats-card-value">{value}</div>
      {change && (
        <div className={`stats-card-change ${!isPositive ? 'negative' : ''}`}>
          {change}
        </div>
      )}
    </div>
  );
};

export default StatsCard;