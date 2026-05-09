import './Header.css';

export default function Header({ onLogoClick }) {
  return (
    <header className="r-header">
      <div className="r-header-inner">
        <div className="r-logo" onClick={onLogoClick}>
          <div className="r-logo-mark">
            <span className="r-logo-mark-inner">R</span>
          </div>
          <div>
            <div className="r-logo-text">Reelify</div>
            <div className="r-logo-tagline">Creator Intelligence</div>
          </div>
        </div>
        <span className="r-badge">✦ Early Access</span>
      </div>
    </header>
  );
}
