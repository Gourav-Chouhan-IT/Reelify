import ErrorBox from '../components/ErrorBox';
import LoadingSteps from '../components/LoadingSteps';

export default function SingleAnalyzePage({
  creatorName, setCreatorName,
  singleUrl, setSingleUrl,
  loading, error,
  onAnalyze, onBack,
}) {
  return (
    <section className="r-section fade-up">
      <button className="r-back back-btn" onClick={onBack}>← Back</button>
      <div className="r-page-title">
        <div className="r-page-icon">◎</div>
        <div>
          <h2 className="r-section-title">Quick Reel Analysis</h2>
          <p className="r-section-sub">Paste any public Instagram reel URL — results in under 60 seconds.</p>
        </div>
      </div>
      <div className="r-form-card">
        <label className="r-label">Your Name <span className="r-hint">for PDF</span></label>
        <input
          className="r-input"
          placeholder="e.g. Priya Sharma or @priyacreates"
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
        />
        <div className="r-divider" />
        <label className="r-label">Instagram Reel URL</label>
        <div className="r-input-row">
          <input
            className="r-input r-input-flex"
            placeholder="https://www.instagram.com/reel/..."
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAnalyze()}
          />
          <button className="r-btn btn-press" onClick={onAnalyze} disabled={loading}>
            {loading ? 'Analyzing…' : 'Analyze →'}
          </button>
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      {loading && (
        <LoadingSteps steps={[
          'Downloading reel from Instagram',
          'Sending to Gemini 2.5 Flash',
          'Generating your viral playbook',
        ]} />
      )}
    </section>
  );
}
