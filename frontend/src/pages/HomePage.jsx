import ModeCard from '../components/ModeCard';
import './HomePage.css';

export default function HomePage({ onModeSelect }) {
  return (
    <section className="r-home">
      <div className="r-eyebrow">
        <span className="r-eyebrow-dot" />
        AI-Powered Reel Intelligence
      </div>
      <h1 className="r-hero-title">
        Decode What Makes<br />
        <span className="r-hero-accent">Your Reels Viral</span>
      </h1>
      <p className="r-hero-sub">
        Deep analysis of your Instagram content — understand exactly why your best reels work
        and transform your worst into winners.
      </p>
      <div className="r-cards">
        <ModeCard
          icon="◎"
          title="Quick Analysis"
          desc="Paste one reel URL. Get instant breakdown — hook style, structure, viral triggers, and your personalized playbook."
          cta="Analyze a reel"
          onClick={() => onModeSelect('single')}
        />
        <ModeCard
          icon="◈"
          title="Creator Report"
          desc="Upload your 3 best and 3 worst reels with insights. Receive a complete growth strategy with your next 5 reel scripts."
          cta="Get my report"
          highlight
          badge="Recommended"
          onClick={() => onModeSelect('creator')}
        />
      </div>
      <div className="r-trust">
        <span className="r-trust-item">✦ Gemini 2.5 Flash</span>
        <span className="r-trust-dot">·</span>
        <span className="r-trust-item">✦ Hinglish Support</span>
        <span className="r-trust-dot">·</span>
        <span className="r-trust-item">✦ PDF Export</span>
      </div>
    </section>
  );
}
