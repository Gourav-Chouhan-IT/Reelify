import { useState } from 'react';
import './ModeCard.css';

export default function ModeCard({ icon, title, desc, cta, onClick, highlight, badge }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`r-card${highlight ? ' r-card-highlight' : ''}${hovered ? (highlight ? ' r-card-highlight-hover' : ' r-card-hover') : ''}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {badge && <div className="r-card-badge">{badge}</div>}
      <div className={`r-card-icon${highlight ? ' r-card-icon-gold' : ''}`}>{icon}</div>
      <h3 className="r-card-title">{title}</h3>
      <p className="r-card-desc">{desc}</p>
      <div className={`r-card-cta${highlight ? ' r-card-cta-gold' : ''}`}>{cta} →</div>
    </div>
  );
}
