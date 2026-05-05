import { useState, useEffect } from "react";

const API_URL = "http://127.0.0.1:8000";
const API_KEY = "6b4f5d85dddf41d243929e0d3073c8296254d49dd2942a9779e6aef40d1eca88";
const initialReels = () => Array(3).fill({ url: "", file: null });

export default function App() {
  const [mode, setMode] = useState("home");
  const [singleUrl, setSingleUrl] = useState("");
  const [bestReels, setBestReels] = useState(initialReels());
  const [worstReels, setWorstReels] = useState(initialReels());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("report");
  const [error, setError] = useState(null);
  const [creatorName, setCreatorName] = useState("");

  const updateReel = (list, setList, index, field, value) => {
    setList(list.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const downloadPDF = async (reportText, filename) => {
    const formData = new FormData();
    formData.append("report", reportText);
    formData.append("creator_name", creatorName.trim() || "Creator");
    const res = await fetch(`${API_URL}/generate-pdf`, {
      method: "POST",
      headers: { "x-api-key": API_KEY },
      body: formData,
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const analyzeSingle = async () => {
    if (!singleUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify({ url: singleUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setResult({ type: "single", ...data });
      setActiveTab("playbook");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCreator = async () => {
    const bestUrls = bestReels.map((r) => r.url).filter(Boolean);
    const worstUrls = worstReels.map((r) => r.url).filter(Boolean);
    const bestFiles = bestReels.map((r) => r.file).filter(Boolean);
    const worstFiles = worstReels.map((r) => r.file).filter(Boolean);
    if (bestUrls.length < 1 || worstUrls.length < 1) { setError("Please add at least 1 best and 1 worst reel URL."); return; }
    if (bestFiles.length !== bestUrls.length || worstFiles.length !== worstUrls.length) { setError("Please upload an insights screenshot for every reel URL you added."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const formData = new FormData();
      formData.append("best_urls", bestUrls.join(","));
      formData.append("worst_urls", worstUrls.join(","));
      bestFiles.forEach((f) => formData.append("best_insights", f));
      worstFiles.forEach((f) => formData.append("worst_insights", f));
      const res = await fetch(`${API_URL}/creator-report`, { method: "POST", headers: { "x-api-key": API_KEY }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setResult({ type: "creator", ...data });
      setActiveTab("report");
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const goHome = () => { setMode("home"); setResult(null); setError(null); };

  return (
    <div className="r-page">
      <style>{globalStyles}</style>
      <div className="r-orb r-orb1" />
      <div className="r-orb r-orb2" />

      {/* Header */}
      <header className="r-header">
        <div className="r-header-inner">
          <div className="r-logo" onClick={goHome}>
            <div className="r-logo-mark"><span className="r-logo-mark-inner">R</span></div>
            <div>
              <div className="r-logo-text">Reelify</div>
              <div className="r-logo-tagline">Creator Intelligence</div>
            </div>
          </div>
          <span className="r-badge">✦ Early Access</span>
        </div>
      </header>

      {/* HOME */}
      {mode === "home" && !result && (
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
            Deep analysis of your Instagram content — understand exactly why your best reels work and transform your worst into winners.
          </p>
          <div className="r-cards">
            <ModeCard icon="◎" title="Quick Analysis" desc="Paste one reel URL. Get instant breakdown — hook style, structure, viral triggers, and your personalized playbook." cta="Analyze a reel" onClick={() => setMode("single")} />
            <ModeCard icon="◈" title="Creator Report" desc="Upload your 3 best and 3 worst reels with insights. Receive a complete growth strategy with your next 5 reel scripts." cta="Get my report" highlight badge="Recommended" onClick={() => setMode("creator")} />
          </div>
          <div className="r-trust">
            <span className="r-trust-item">✦ Gemini 2.5 Flash</span>
            <span className="r-trust-dot">·</span>
            <span className="r-trust-item">✦ Hinglish Support</span>
            <span className="r-trust-dot">·</span>
            <span className="r-trust-item">✦ PDF Export</span>
          </div>
        </section>
      )}

      {/* SINGLE ANALYZE */}
      {mode === "single" && !result && (
        <section className="r-section fade-up">
          <button className="r-back back-btn" onClick={() => { setMode("home"); setError(null); }}>← Back</button>
          <div className="r-page-title">
            <div className="r-page-icon">◎</div>
            <div>
              <h2 className="r-section-title">Quick Reel Analysis</h2>
              <p className="r-section-sub">Paste any public Instagram reel URL — results in under 60 seconds.</p>
            </div>
          </div>
          <div className="r-form-card">
            <label className="r-label">Your Name <span className="r-hint">for PDF</span></label>
            <input className="r-input" placeholder="e.g. Priya Sharma or @priyacreates" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} />
            <div className="r-divider" />
            <label className="r-label">Instagram Reel URL</label>
            <div className="r-input-row">
              <input className="r-input r-input-flex" placeholder="https://www.instagram.com/reel/..." value={singleUrl} onChange={(e) => setSingleUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && analyzeSingle()} />
              <button className="r-btn btn-press" onClick={analyzeSingle} disabled={loading}>{loading ? "Analyzing…" : "Analyze →"}</button>
            </div>
          </div>
          {error && <ErrorBox message={error} />}
          {loading && <LoadingSteps steps={["Downloading reel from Instagram", "Sending to Gemini 2.5 Flash", "Generating your viral playbook"]} />}
        </section>
      )}

      {/* CREATOR REPORT */}
      {mode === "creator" && !result && (
        <section className="r-section fade-up">
          <button className="r-back back-btn" onClick={() => { setMode("home"); setError(null); }}>← Back</button>
          <div className="r-page-title">
            <div className="r-page-icon">◈</div>
            <div>
              <h2 className="r-section-title">Creator Strategy Report</h2>
              <p className="r-section-sub">Add your 3 best and 3 worst performing reels with their insights screenshots.</p>
            </div>
          </div>
          <div className="r-form-card">
            <label className="r-label">Your Name <span className="r-hint">appears in PDF report</span></label>
            <input className="r-input" style={{ maxWidth: "380px" }} placeholder="e.g. Priya Sharma or @priyacreates" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} />
          </div>
          <div className="r-reel-grid">
            <div>
              <div className="r-group-pill r-group-pill-best">
                <span className="r-group-dot" style={{ background: "#86BC8F" }} />
                <span style={{ color: "#86BC8F" }}>Best Performing</span>
              </div>
              {bestReels.map((reel, i) => (
                <ReelInput key={i} index={i} reel={reel} type="best"
                  onUrlChange={(val) => updateReel(bestReels, setBestReels, i, "url", val)}
                  onFileChange={(file) => updateReel(bestReels, setBestReels, i, "file", file)} />
              ))}
            </div>
            <div>
              <div className="r-group-pill r-group-pill-worst">
                <span className="r-group-dot" style={{ background: "#C4614A" }} />
                <span style={{ color: "#C4614A" }}>Worst Performing</span>
              </div>
              {worstReels.map((reel, i) => (
                <ReelInput key={i} index={i} reel={reel} type="worst"
                  onUrlChange={(val) => updateReel(worstReels, setWorstReels, i, "url", val)}
                  onFileChange={(file) => updateReel(worstReels, setWorstReels, i, "file", file)} />
              ))}
            </div>
          </div>
          {error && <ErrorBox message={error} />}
          {loading
            ? <LoadingSteps steps={["Downloading all 6 reels", "Parsing insights screenshots", "Cross-referencing best vs worst", "Generating your Creator Report"]} />
            : <button className="r-btn r-btn-large btn-press" onClick={analyzeCreator}>Generate Creator Report →</button>
          }
        </section>
      )}

      {/* RESULTS */}
      {result && (
        <section className="r-section fade-up">
          <button className="r-back back-btn" onClick={() => { setResult(null); setError(null); }}>← Back</button>
          {result.type === "creator" && (
            <>
              <div className="r-report-header">
                <div>
                  <div className="r-report-eyebrow">✦ Creator Strategy Report</div>
                  <h2 className="r-section-title">{creatorName ? `${creatorName}'s Growth Playbook` : "Your Growth Playbook"}</h2>
                  <p className="r-section-sub">Based on {result.best_reels_count} best + {result.worst_reels_count} worst performing reels</p>
                </div>
                <button className="r-dl-btn btn-press" onClick={() => downloadPDF(result.report, `reelify_report_${(creatorName || "creator").replace(/\s+/g, "_")}.pdf`)}>↓ Download PDF</button>
              </div>
              <div className="r-result-box"><MarkdownRenderer text={result.report} /></div>
            </>
          )}
          {result.type === "single" && (
            <>
              <div className="r-report-header">
                <div>
                  <div className="r-report-eyebrow">✦ Quick Analysis</div>
                  <h2 className="r-section-title">{creatorName ? `${creatorName}'s Reel Decoded` : "Reel Analysis Complete"}</h2>
                </div>
                <button className="r-dl-btn btn-press" onClick={() => downloadPDF(result.playbook, `reelify_playbook_${(creatorName || "creator").replace(/\s+/g, "_")}.pdf`)}>↓ Download PDF</button>
              </div>
              <div className="r-tabs">
                {[{ id: "playbook", label: "Viral Playbook" }, { id: "analysis", label: "Reel Analysis" }].map((tab) => (
                  <button key={tab.id} className={`r-tab tab-btn${activeTab === tab.id ? " r-tab-active" : ""}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
                ))}
              </div>
              <div className="r-result-box"><MarkdownRenderer text={activeTab === "playbook" ? result.playbook : result.analysis} /></div>
            </>
          )}
        </section>
      )}

      <footer className="r-footer">
        <span>Reelify</span><span className="r-footer-dot">·</span>
        <span>Built for micro creators</span><span className="r-footer-dot">·</span>
        <span>Powered by Gemini 2.5 Flash</span>
      </footer>
    </div>
  );
}

function ModeCard({ icon, title, desc, cta, onClick, highlight, badge }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`r-card${highlight ? " r-card-highlight" : ""}${hovered ? (highlight ? " r-card-highlight-hover" : " r-card-hover") : ""}`}
      onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      {badge && <div className="r-card-badge">{badge}</div>}
      <div className={`r-card-icon${highlight ? " r-card-icon-gold" : ""}`}>{icon}</div>
      <h3 className="r-card-title">{title}</h3>
      <p className="r-card-desc">{desc}</p>
      <div className={`r-card-cta${highlight ? " r-card-cta-gold" : ""}`}>{cta} →</div>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="r-error">
      <span>⚠</span>
      <p>{message}</p>
    </div>
  );
}

function LoadingSteps({ steps }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setActive((a) => (a < steps.length - 1 ? a + 1 : a)), 2800);
    return () => clearInterval(interval);
  }, [steps.length]);
  return (
    <div className="r-loading fade-up">
      <div className="r-loading-top">
        <div className="r-spin-wrap"><div className="r-spinner" /></div>
        <span className="r-loading-label">Working on it…</span>
      </div>
      <div className="r-steps">
        {steps.map((step, i) => (
          <div key={i} className="r-step">
            <div className="r-step-dot" style={{
              background: i < active ? "#86BC8F" : i === active ? "#C9A84C" : "transparent",
              borderColor: i < active ? "#86BC8F" : i === active ? "#C9A84C" : "#2a2420",
              boxShadow: i === active ? "0 0 12px rgba(201,168,76,0.4)" : "none",
            }}>
              {i < active && <span className="r-step-check">✓</span>}
            </div>
            <span className="r-step-label" style={{ color: i < active ? "#86BC8F" : i === active ? "#F5F0E8" : "#3a3530" }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReelInput({ index, reel, type, onUrlChange, onFileChange }) {
  const [dragging, setDragging] = useState(false);
  const accent = type === "best" ? "#86BC8F" : "#C4614A";
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) onFileChange(f); };
  return (
    <div className="r-reel-card">
      <div className="r-reel-num" style={{ color: accent, borderColor: `${accent}30` }}>{String(index + 1).padStart(2, "0")}</div>
      <div style={{ flex: 1 }}>
        <input className="r-input" placeholder="https://www.instagram.com/reel/..." value={reel.url} onChange={(e) => onUrlChange(e.target.value)} />
        <label
          className={`r-file-zone${dragging ? " r-file-zone-drag" : ""}${reel.file ? " r-file-zone-done" : ""}`}
          style={reel.file ? { borderColor: `${accent}50` } : {}}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {reel.file ? <><span style={{ color: accent }}>✓</span> {reel.file.name}</> : <><span style={{ opacity: 0.4 }}>↑</span> Drop insights screenshot or click to upload</>}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onFileChange(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}

function MarkdownRenderer({ text }) {
  return (
    <div className="r-md">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return (
          <div key={i} className="r-md-h2-block">
            <div className="r-md-h2-bar" />
            <h2 className="r-md-h2">{renderInline(line.replace(/^##\s*/, ""))}</h2>
          </div>
        );
        if (line.startsWith("### ")) return <h3 key={i} className="r-md-h3">{renderInline(line.replace(/^###\s*/, ""))}</h3>;
        if (line.trim() === "---") return <div key={i} className="r-md-rule" />;
        if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
          const content = line.trim().replace(/^[*-]\s/, "");
          return <div key={i} className="r-md-bullet"><span className="r-md-bullet-mark">◆</span><span>{renderInline(content)}</span></div>;
        }
        if (/^\d+\.\s/.test(line.trim())) {
          const match = line.trim().match(/^(\d+)\.\s(.*)/);
          return <div key={i} className="r-md-num"><span className="r-md-num-mark">{match[1]}</span><span>{renderInline(match[2])}</span></div>;
        }
        if (!line.trim()) return <div key={i} style={{ height: "12px" }} />;
        return <p key={i} className="r-md-para">{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} style={{ color: "#F5F0E8", fontWeight: "600" }}>{part.slice(2, -2)}</strong>
      : part
  );
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Jost:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; min-height: 100vh; background: #0e0c09; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes heroReveal { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes orbFloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } }
  @keyframes shimmerGold { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

  .fade-up { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }

  input::placeholder { color: #3a3530; font-family: 'Jost', sans-serif; }
  input:focus { outline: none; border-color: rgba(201,168,76,0.5) !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.08) !important; }

  .btn-press { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
  .btn-press:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.25); }
  .btn-press:active:not(:disabled) { transform: translateY(0) scale(0.98); }
  .back-btn { transition: color 0.2s ease; }
  .back-btn:hover { color: #C9A84C !important; }
  .tab-btn { transition: all 0.2s ease; }
  .tab-btn:hover { border-color: rgba(201,168,76,0.3) !important; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0e0c09; }
  ::-webkit-scrollbar-thumb { background: #2a2420; border-radius: 2px; }

  /* ── Base ── */
  .r-page { min-height: 100vh; width: 100%; background: #0e0c09; color: #F5F0E8; font-family: 'Jost', sans-serif; position: relative; overflow-x: hidden; padding-top: 76px; }

  /* ── Orbs ── */
  .r-orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; }
  .r-orb1 { top: -200px; right: -100px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%); animation: orbFloat 8s ease-in-out infinite; }
  .r-orb2 { bottom: -300px; left: -150px; width: 700px; height: 700px; background: radial-gradient(circle, rgba(134,188,143,0.04) 0%, transparent 70%); animation: orbFloat 10s ease-in-out infinite reverse; }

  /* ── Header ── */
  .r-header { border-bottom: 1px solid rgba(201,168,76,0.08); position: fixed; top: 0; left: 0; right: 0; width: 100%; background: rgba(14,12,9,0.95); backdrop-filter: blur(20px); z-index: 100; }
  .r-header-inner { display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; padding: 20px 24px; }
  .r-logo { display: flex; align-items: center; gap: 14px; cursor: pointer; }
  .r-logo-mark { width: 36px; height: 36px; background: linear-gradient(135deg, #C9A84C 0%, #8B6914 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(201,168,76,0.2); flex-shrink: 0; }
  .r-logo-mark-inner { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #0e0c09; line-height: 1; }
  .r-logo-text { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #F5F0E8; letter-spacing: 0.3px; line-height: 1.1; }
  .r-logo-tagline { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #5a5048; letter-spacing: 2px; text-transform: uppercase; line-height: 1; }
  .r-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #C9A84C; border: 1px solid rgba(201,168,76,0.2); background: rgba(201,168,76,0.05); padding: 5px 12px; border-radius: 20px; letter-spacing: 0.5px; white-space: nowrap; }

  /* ── Home ── */
  .r-home { max-width: 780px; margin: 0 auto; padding: 100px 24px 120px; position: relative; z-index: 1; }
  .r-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8a7a60; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 28px; }
  .r-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #C9A84C; box-shadow: 0 0 8px rgba(201,168,76,0.6); flex-shrink: 0; }
  .r-hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(44px, 7vw, 80px); font-weight: 600; line-height: 1.05; letter-spacing: -0.5px; color: #F5F0E8; margin-bottom: 24px; }
  .r-hero-accent { background: linear-gradient(135deg, #C9A84C 0%, #E8CC7A 40%, #C9A84C 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmerGold 4s linear infinite; font-style: italic; }
  .r-hero-sub { font-family: 'Jost', sans-serif; font-size: 17px; color: #6a6058; line-height: 1.8; margin-bottom: 56px; max-width: 560px; font-weight: 400; }

  /* ── Mode Cards ── */
  .r-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 48px; }
  .r-card { background: #131008; border: 1px solid #1e1c14; border-radius: 20px; padding: 36px 32px; cursor: pointer; transition: all 0.3s cubic-bezier(0.16,1,0.3,1); position: relative; overflow: hidden; }
  .r-card-hover { transform: translateY(-4px); border-color: #2a2820; box-shadow: 0 32px 64px rgba(0,0,0,0.5); }
  .r-card-highlight { background: #14110a; border: 1px solid rgba(201,168,76,0.2); }
  .r-card-highlight-hover { transform: translateY(-4px); border-color: rgba(201,168,76,0.45); box-shadow: 0 32px 64px rgba(201,168,76,0.09); }
  .r-card-badge { position: absolute; top: 20px; right: 20px; background: rgba(201,168,76,0.12); color: #C9A84C; border: 1px solid rgba(201,168,76,0.25); font-family: 'JetBrains Mono', monospace; font-size: 9px; padding: 3px 9px; border-radius: 20px; letter-spacing: 0.8px; text-transform: uppercase; }
  .r-card-icon { font-size: 26px; color: #3a3530; margin-bottom: 20px; font-family: monospace; }
  .r-card-icon-gold { color: #C9A84C; }
  .r-card-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #F5F0E8; margin-bottom: 12px; }
  .r-card-desc { font-family: 'Jost', sans-serif; font-size: 14px; color: #5a5048; line-height: 1.75; margin-bottom: 28px; font-weight: 400; }
  .r-card-cta { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: #6a6058; }
  .r-card-cta-gold { color: #C9A84C; }

  /* ── Trust bar ── */
  .r-trust { display: flex; align-items: center; gap: 16px; justify-content: center; flex-wrap: wrap; }
  .r-trust-item { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #3a3530; letter-spacing: 0.5px; }
  .r-trust-dot { color: #2a2420; }

  /* ── Section ── */
  .r-section { max-width: 900px; margin: 0 auto; padding: 48px 24px 120px; position: relative; z-index: 1; }
  .r-page-title { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 36px; }
  .r-page-icon { font-family: monospace; font-size: 22px; color: #C9A84C; width: 48px; height: 48px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .r-section-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; color: #F5F0E8; margin-bottom: 6px; letter-spacing: 0.2px; }
  .r-section-sub { font-family: 'Jost', sans-serif; font-size: 14px; color: #5a5048; line-height: 1.7; font-weight: 400; }
  .r-back { background: none; border: none; color: #3a3530; font-size: 13px; cursor: pointer; margin-bottom: 32px; font-family: 'JetBrains Mono', monospace; padding: 0; display: block; letter-spacing: 0.3px; }

  /* ── Form ── */
  .r-form-card { background: #131008; border: 1px solid #1e1c14; border-radius: 16px; padding: 28px 32px; margin-bottom: 28px; }
  .r-label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #5a5048; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 10px; }
  .r-hint { text-transform: none; color: #3a3530; letter-spacing: 0; font-family: 'Jost', sans-serif; font-size: 11px; }
  .r-divider { height: 1px; background: #1e1c14; margin: 20px 0; }
  .r-input-row { display: flex; gap: 10px; }
  .r-input-flex { flex: 1; }
  .r-input { width: 100%; padding: 12px 16px; background: #0e0c09; border: 1px solid #1e1c14; border-radius: 10px; color: #F5F0E8; font-size: 14px; font-family: 'Jost', sans-serif; font-weight: 400; transition: border-color 0.2s ease, box-shadow 0.2s ease; display: block; }
  .r-btn { padding: 12px 24px; background: linear-gradient(135deg, #C9A84C 0%, #A8842A 100%); color: #0e0c09; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Jost', sans-serif; white-space: nowrap; letter-spacing: 0.2px; }
  .r-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .r-btn-large { width: 100%; padding: 16px; font-size: 15px; margin-top: 32px; border-radius: 12px; }

  /* ── Error ── */
  .r-error { display: flex; align-items: flex-start; gap: 12px; background: rgba(196,97,74,0.06); border: 1px solid rgba(196,97,74,0.2); border-radius: 12px; padding: 16px 20px; margin-top: 16px; color: #C4614A; font-family: 'Jost', sans-serif; font-size: 13px; line-height: 1.6; }

  /* ── Loading ── */
  .r-loading { background: #131008; border: 1px solid #1e1c14; border-radius: 16px; padding: 28px 32px; margin-top: 24px; }
  .r-loading-top { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #1e1c14; }
  .r-spin-wrap { width: 28px; height: 28px; border-radius: 50%; background: rgba(201,168,76,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .r-spinner { width: 14px; height: 14px; border: 1.5px solid #2a2420; border-top: 1.5px solid #C9A84C; border-radius: 50%; animation: spin 0.8s linear infinite; }
  .r-loading-label { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; color: #8a7a60; }
  .r-steps { display: flex; flex-direction: column; gap: 16px; }
  .r-step { display: flex; align-items: center; gap: 14px; }
  .r-step-dot { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.5s ease; }
  .r-step-check { font-size: 10px; color: #0e0c09; font-weight: 700; }
  .r-step-label { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400; transition: color 0.5s ease; }

  /* ── Reel inputs ── */
  .r-reel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 8px; }
  .r-group-pill { display: inline-flex; align-items: center; gap: 8px; border: 1px solid; border-radius: 20px; padding: 5px 12px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 16px; }
  .r-group-pill-best { background: rgba(134,188,143,0.1); border-color: rgba(134,188,143,0.3); }
  .r-group-pill-worst { background: rgba(196,97,74,0.1); border-color: rgba(196,97,74,0.3); }
  .r-group-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .r-reel-card { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px; background: #131008; border: 1px solid #1e1c14; border-radius: 12px; padding: 16px 18px; }
  .r-reel-num { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; font-weight: 600; border: 1px solid; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 6px; background: rgba(0,0,0,0.2); }
  .r-file-zone { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding: 10px 14px; background: #0e0c09; border: 1px dashed #1e1c14; border-radius: 8px; font-size: 12px; color: #3a3530; cursor: pointer; font-family: 'Jost', sans-serif; font-weight: 400; transition: all 0.2s ease; }
  .r-file-zone-drag { border-color: #C9A84C; background: rgba(201,168,76,0.04); }
  .r-file-zone-done { border-style: solid; color: #8a7a60; }

  /* ── Results ── */
  .r-report-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
  .r-report-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #C9A84C; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
  .r-dl-btn { display: flex; align-items: center; gap: 8px; padding: 11px 20px; background: transparent; color: #C9A84C; border: 1px solid rgba(201,168,76,0.3); border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Jost', sans-serif; white-space: nowrap; flex-shrink: 0; letter-spacing: 0.3px; }
  .r-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
  .r-tab { padding: 10px 20px; background: transparent; border: 1px solid #1e1c14; border-radius: 8px; color: #3a3530; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Jost', sans-serif; letter-spacing: 0.2px; }
  .r-tab-active { background: rgba(201,168,76,0.1); color: #C9A84C; border-color: rgba(201,168,76,0.3); }
  .r-result-box { background: #131008; border: 1px solid #1e1c14; border-radius: 16px; padding: 36px 40px; max-height: 700px; overflow-y: auto; }

  /* ── Markdown ── */
  .r-md { font-family: 'Jost', sans-serif; font-size: 15px; line-height: 1.85; color: #8a7a60; }
  .r-md-h2-block { display: flex; align-items: flex-start; gap: 16px; margin-top: 36px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #1e1c14; }
  .r-md-h2-bar { width: 3px; min-height: 28px; background: linear-gradient(180deg, #C9A84C 0%, #8B6914 100%); border-radius: 2px; flex-shrink: 0; margin-top: 3px; }
  .r-md-h2 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #F5F0E8; letter-spacing: 0.2px; }
  .r-md-h3 { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; font-style: italic; color: #C9A84C; margin-top: 24px; margin-bottom: 10px; }
  .r-md-rule { height: 1px; background: #1e1c14; margin: 24px 0; }
  .r-md-bullet { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 8px; padding-left: 4px; color: #7a6a58; }
  .r-md-bullet-mark { color: #C9A84C; font-size: 7px; flex-shrink: 0; margin-top: 8px; }
  .r-md-num { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 8px; padding-left: 4px; color: #7a6a58; }
  .r-md-num-mark { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; color: #C9A84C; flex-shrink: 0; min-width: 20px; line-height: 1.5; }
  .r-md-para { color: #7a6a58; margin-bottom: 6px; line-height: 1.85; font-weight: 400; }

  /* ── Footer ── */
  .r-footer { text-align: center; padding: 32px; display: flex; justify-content: center; align-items: center; gap: 12px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #2a2420; letter-spacing: 0.5px; flex-wrap: wrap; position: relative; z-index: 1; }
  .r-footer-dot { color: #1e1c14; }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .r-header { padding: 14px 20px; }
    .r-logo-tagline { display: none; }
    .r-badge { font-size: 9px; padding: 4px 10px; }

    .r-home { padding: 56px 20px 72px; }
    .r-eyebrow { font-size: 10px; letter-spacing: 1px; }
    .r-hero-sub { font-size: 15px; margin-bottom: 40px; }
    .r-cards { grid-template-columns: 1fr; gap: 12px; margin-bottom: 36px; }
    .r-card { padding: 28px 24px; }
    .r-trust { gap: 10px; }

    .r-section { padding: 32px 16px 80px; }
    .r-page-title { flex-direction: column; gap: 12px; }
    .r-page-icon { width: 40px; height: 40px; font-size: 18px; }
    .r-section-title { font-size: 26px; }

    .r-form-card { padding: 20px; }
    .r-input-row { flex-direction: column; }
    .r-btn { width: 100%; text-align: center; }

    .r-reel-grid { grid-template-columns: 1fr; gap: 24px; }
    .r-btn-large { margin-top: 24px; }

    .r-report-header { flex-direction: column; align-items: flex-start; }
    .r-dl-btn { width: 100%; justify-content: center; }
    .r-result-box { padding: 20px; max-height: none; }
    .r-tab { flex: 1; text-align: center; }

    .r-orb1 { width: 300px; height: 300px; top: -100px; right: -50px; }
    .r-orb2 { width: 350px; height: 350px; bottom: -150px; left: -75px; }
  }
`;