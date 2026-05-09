import MarkdownRenderer from '../components/MarkdownRenderer';
import './ResultsPage.css';

export default function ResultsPage({ result, activeTab, setActiveTab, creatorName, onDownloadPDF, onBack }) {
  const slugName = (creatorName || 'creator').replace(/\s+/g, '_');

  return (
    <section className="r-section fade-up">
      <button className="r-back back-btn" onClick={onBack}>← Back</button>

      {result.type === 'creator' && (
        <>
          <div className="r-report-header">
            <div>
              <div className="r-report-eyebrow">✦ Creator Strategy Report</div>
              <h2 className="r-section-title">
                {creatorName ? `${creatorName}'s Growth Playbook` : 'Your Growth Playbook'}
              </h2>
              <p className="r-section-sub">
                Based on {result.best_reels_count} best + {result.worst_reels_count} worst performing reels
              </p>
            </div>
            <button
              className="r-dl-btn btn-press"
              onClick={() => onDownloadPDF(result.report, `reelify_report_${slugName}.pdf`)}
            >
              ↓ Download PDF
            </button>
          </div>
          <div className="r-result-box">
            <MarkdownRenderer text={result.report} />
          </div>
        </>
      )}

      {result.type === 'single' && (
        <>
          <div className="r-report-header">
            <div>
              <div className="r-report-eyebrow">✦ Quick Analysis</div>
              <h2 className="r-section-title">
                {creatorName ? `${creatorName}'s Reel Decoded` : 'Reel Analysis Complete'}
              </h2>
            </div>
            <button
              className="r-dl-btn btn-press"
              onClick={() => onDownloadPDF(result.playbook, `reelify_playbook_${slugName}.pdf`)}
            >
              ↓ Download PDF
            </button>
          </div>
          <div className="r-tabs">
            {[{ id: 'playbook', label: 'Viral Playbook' }, { id: 'analysis', label: 'Reel Analysis' }].map((tab) => (
              <button
                key={tab.id}
                className={`r-tab tab-btn${activeTab === tab.id ? ' r-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="r-result-box">
            <MarkdownRenderer text={activeTab === 'playbook' ? result.playbook : result.analysis} />
          </div>
        </>
      )}
    </section>
  );
}
