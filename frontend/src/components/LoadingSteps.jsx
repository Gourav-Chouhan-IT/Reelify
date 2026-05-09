import { useState, useEffect } from 'react';
import './LoadingSteps.css';

export default function LoadingSteps({ steps }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setActive((a) => (a < steps.length - 1 ? a + 1 : a)),
      2800
    );
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="r-loading fade-up">
      <div className="r-loading-top">
        <div className="r-spin-wrap">
          <div className="r-spinner" />
        </div>
        <span className="r-loading-label">Working on it…</span>
      </div>
      <div className="r-steps">
        {steps.map((step, i) => (
          <div key={i} className="r-step">
            <div
              className="r-step-dot"
              style={{
                background: i < active ? '#86BC8F' : i === active ? '#C9A84C' : 'transparent',
                borderColor: i < active ? '#86BC8F' : i === active ? '#C9A84C' : '#2a2420',
                boxShadow: i === active ? '0 0 12px rgba(201,168,76,0.4)' : 'none',
              }}
            >
              {i < active && <span className="r-step-check">✓</span>}
            </div>
            <span
              className="r-step-label"
              style={{ color: i < active ? '#86BC8F' : i === active ? '#F5F0E8' : '#3a3530' }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
