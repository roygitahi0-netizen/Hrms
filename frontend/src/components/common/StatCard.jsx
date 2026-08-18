import React from 'react';

const StatCard = ({ icon: Icon, label, value, subtext, color = 'var(--accent-cyan)' }) => {
  return (
    <div className="glass-card stat-card">
      <div>
        <span className="stat-label">{label}</span>
        <div className="stat-value">{value}</div>
        {subtext && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtext}</div>}
      </div>
      <div className="stat-icon" style={{ color }}>
        {Icon && <Icon size={26} />}
      </div>
    </div>
  );
};

export default StatCard;
