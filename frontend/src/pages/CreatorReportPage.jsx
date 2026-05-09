import ErrorBox from '../components/ErrorBox';
import LoadingSteps from '../components/LoadingSteps';
import ReelInput from '../components/ReelInput';

export default function CreatorReportPage({
  creatorName, setCreatorName,
  bestReels, setBestReels,
  worstReels, setWorstReels,
  loading, error,
  onAnalyze, onBack, updateReel,
}) {
  return (
    <section className="r-section fade-up">
      <button className="r-back back-btn" onClick={onBack}>← Back</button>
      <div className="r-page-title">
        <div className="r-page-icon">◈</div>
        <div>
          <h2 className="r-section-title">Creator Strategy Report</h2>
          <p className="r-section-sub">Add your 3 best and 3 worst performing reels with their insights screenshots.</p>
        </div>
      </div>
      <div className="r-form-card">
        <label className="r-label">Your Name <span className="r-hint">appears in PDF report</span></label>
        <input
          className="r-input"
          style={{ maxWidth: '380px' }}
          placeholder="e.g. Priya Sharma or @priyacreates"
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
        />
      </div>
      <div className="r-reel-grid">
        <div>
          <div className="r-group-pill r-group-pill-best">
            <span className="r-group-dot" style={{ background: '#86BC8F' }} />
            <span style={{ color: '#86BC8F' }}>Best Performing</span>
          </div>
          {bestReels.map((reel, i) => (
            <ReelInput
              key={i} index={i} reel={reel} type="best"
              onUrlChange={(val) => updateReel(bestReels, setBestReels, i, 'url', val)}
              onFileChange={(file) => updateReel(bestReels, setBestReels, i, 'file', file)}
            />
          ))}
        </div>
        <div>
          <div className="r-group-pill r-group-pill-worst">
            <span className="r-group-dot" style={{ background: '#C4614A' }} />
            <span style={{ color: '#C4614A' }}>Worst Performing</span>
          </div>
          {worstReels.map((reel, i) => (
            <ReelInput
              key={i} index={i} reel={reel} type="worst"
              onUrlChange={(val) => updateReel(worstReels, setWorstReels, i, 'url', val)}
              onFileChange={(file) => updateReel(worstReels, setWorstReels, i, 'file', file)}
            />
          ))}
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      {loading
        ? <LoadingSteps steps={[
            'Downloading all 6 reels',
            'Parsing insights screenshots',
            'Cross-referencing best vs worst',
            'Generating your Creator Report',
          ]} />
        : <button className="r-btn r-btn-large btn-press" onClick={onAnalyze}>
            Generate Creator Report →
          </button>
      }
    </section>
  );
}
