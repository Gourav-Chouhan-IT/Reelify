import { useState, useEffect } from "react";

const API_URL = "http://127.0.0.1:8000";
const API_KEY = "6b4f5d85dddf41d243929e0d3073c8296254d49dd2942a9779e6aef40d1eca88"; // --- IGNORE ---
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
      body: formData
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
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
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

    if (bestUrls.length < 1 || worstUrls.length < 1) {
      setError("Please add at least 1 best and 1 worst reel URL.");
      return;
    }
    if (bestFiles.length !== bestUrls.length || worstFiles.length !== worstUrls.length) {
      setError("Please upload an insights screenshot for every reel URL you added.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("best_urls", bestUrls.join(","));
      formData.append("worst_urls", worstUrls.join(","));
      bestFiles.forEach((f) => formData.append("best_insights", f));
      worstFiles.forEach((f) => formData.append("worst_insights", f));

      const res = await fetch(`${API_URL}/creator-report`, {
        method: "POST",
        headers: { "x-api-key": API_KEY },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setResult({ type: "creator", ...data });
      setActiveTab("report");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => { setMode("home"); setResult(null); setError(null); };

  return (
    <div style={s.page}>
      <style>{globalStyles}</style>

      <header style={s.header}>
        <div style={s.logo} onClick={goHome}>
          <div style={s.logoMark}>R</div>
          <span style={s.logoText}>Reelify</span>
        </div>
        <div style={s.headerRight}>
          <span style={s.badge}>MVP v1.0</span>
        </div>
      </header>

      {/* HOME */}
      {mode === "home" && !result && (
        <section style={s.home}>
          <div style={s.heroEyebrow}>AI-Powered Reel Intelligence</div>
          <h1 style={s.heroTitle}>
            Your Instagram Reels,
            <br />
            <span style={s.accent}>Decoded.</span>
          </h1>
          <p style={s.heroSub}>
            Analyze any reel instantly — or get a full Creator Strategy Report
            <br />
            from your best and worst performers.
          </p>
          <div style={s.modeCards}>
            <ModeCard
              icon="🎯"
              title="Quick Analyze"
              desc="Paste one reel URL and get instant analysis plus a viral playbook — in under 60 seconds."
              cta="Try it free →"
              onClick={() => setMode("single")}
            />
            <ModeCard
              icon="🚀"
              title="Creator Report"
              desc="Analyze your 3 best + 3 worst reels. Get your personalized growth strategy with an action plan."
              cta="Get my report →"
              highlight
              badge="For Creators"
              onClick={() => setMode("creator")}
            />
          </div>
        </section>
      )}

      {/* SINGLE ANALYZE */}
      {mode === "single" && !result && (
        <section style={s.section} className="fade-up">
          <BackButton onClick={() => { setMode("home"); setError(null); }} />
          <div style={s.sectionHeader}>
            <div style={s.sectionIcon}>🎯</div>
            <div>
              <h2 style={s.sectionTitle}>Quick Reel Analysis</h2>
              <p style={s.sectionSub}>Paste any public Instagram reel URL and let Gemini do the work.</p>
            </div>
          </div>

          <div style={s.formCard}>
            <label style={s.fieldLabel}>Creator Name <span style={s.optional}>(for PDF)</span></label>
            <input
              style={s.input}
              placeholder="Your name or handle e.g. @username"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
            />
            <label style={{ ...s.fieldLabel, marginTop: "16px" }}>Reel URL</label>
            <div style={s.inputRow}>
              <input
                style={s.input}
                placeholder="https://www.instagram.com/reel/..."
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyzeSingle()}
              />
              <button style={s.btn} onClick={analyzeSingle} disabled={loading} className="btn-press">
                {loading ? "Analyzing…" : "Analyze →"}
              </button>
            </div>
          </div>

          {error && <ErrorBox message={error} />}
          {loading && (
            <LoadingSteps steps={[
              "Downloading reel from Instagram",
              "Sending to Gemini 2.5 Flash",
              "Generating viral playbook",
            ]} />
          )}
        </section>
      )}

      {/* CREATOR REPORT */}
      {mode === "creator" && !result && (
        <section style={s.section} className="fade-up">
          <BackButton onClick={() => { setMode("home"); setError(null); }} />
          <div style={s.sectionHeader}>
            <div style={s.sectionIcon}>🚀</div>
            <div>
              <h2 style={s.sectionTitle}>Creator Strategy Report</h2>
              <p style={s.sectionSub}>Add your 3 best and 3 worst performing reels with their insights screenshots.</p>
            </div>
          </div>

          <div style={s.formCard}>
            <label style={s.fieldLabel}>Your Name <span style={s.optional}>(appears in the PDF report)</span></label>
            <input
              style={{ ...s.input, maxWidth: "360px" }}
              placeholder="Your name or handle e.g. @username"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
            />
          </div>

          <div style={s.reelGrid}>
            <div>
              <div style={s.reelGroupHeader}>
                <span style={s.reelGroupDot("#4ade80")} />
                <h3 style={s.reelGroupTitle}>Best Performing Reels</h3>
              </div>
              {bestReels.map((reel, i) => (
                <ReelInput
                  key={i}
                  index={i}
                  reel={reel}
                  type="best"
                  onUrlChange={(val) => updateReel(bestReels, setBestReels, i, "url", val)}
                  onFileChange={(file) => updateReel(bestReels, setBestReels, i, "file", file)}
                />
              ))}
            </div>
            <div>
              <div style={s.reelGroupHeader}>
                <span style={s.reelGroupDot("#f87171")} />
                <h3 style={s.reelGroupTitle}>Worst Performing Reels</h3>
              </div>
              {worstReels.map((reel, i) => (
                <ReelInput
                  key={i}
                  index={i}
                  reel={reel}
                  type="worst"
                  onUrlChange={(val) => updateReel(worstReels, setWorstReels, i, "url", val)}
                  onFileChange={(file) => updateReel(worstReels, setWorstReels, i, "file", file)}
                />
              ))}
            </div>
          </div>

          {error && <ErrorBox message={error} />}

          {loading ? (
            <LoadingSteps steps={[
              "Downloading all 6 reels",
              "Parsing insights screenshots",
              "Cross-referencing best vs worst",
              "Generating Creator Strategy Report",
            ]} />
          ) : (
            <button style={{ ...s.btn, ...s.btnLarge }} onClick={analyzeCreator} className="btn-press">
              Generate Creator Report 🚀
            </button>
          )}
        </section>
      )}

      {/* RESULTS */}
      {result && (
        <section style={s.section} className="fade-up">
          <BackButton onClick={() => { setResult(null); setError(null); }} />

          {result.type === "creator" && (
            <>
              <div style={s.reportHeader}>
                <div>
                  <div style={s.reportEyebrow}>Creator Strategy Report</div>
                  <h2 style={s.sectionTitle}>
                    {creatorName ? `${creatorName}'s Growth Playbook` : "Your Growth Playbook"}
                  </h2>
                  <p style={s.sectionSub}>
                    Based on {result.best_reels_count} best + {result.worst_reels_count} worst performing reels
                  </p>
                </div>
                <button
                  style={s.downloadBtn}
                  className="btn-press"
                  onClick={() => downloadPDF(result.report, `reelify_report_${(creatorName || "creator").replace(/\s+/g, "_")}.pdf`)}
                >
                  <span>↓</span> Download PDF
                </button>
              </div>
              <div style={s.resultBox}>
                <MarkdownRenderer text={result.report} />
              </div>
            </>
          )}

          {result.type === "single" && (
            <>
              <div style={s.reportHeader}>
                <div>
                  <div style={s.reportEyebrow}>Quick Analysis</div>
                  <h2 style={s.sectionTitle}>
                    {creatorName ? `${creatorName}'s Reel Decoded` : "Reel Analysis Complete"}
                  </h2>
                </div>
                <button
                  style={s.downloadBtn}
                  className="btn-press"
                  onClick={() => downloadPDF(result.playbook, `reelify_playbook_${(creatorName || "creator").replace(/\s+/g, "_")}.pdf`)}
                >
                  <span>↓</span> Download PDF
                </button>
              </div>

              <div style={s.tabs}>
                {[
                  { id: "playbook", label: "Viral Playbook", icon: "🎯" },
                  { id: "analysis", label: "Reel Analysis", icon: "🔍" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}
                    onClick={() => setActiveTab(tab.id)}
                    className="tab-btn"
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
              <div style={s.resultBox}>
                <MarkdownRenderer text={activeTab === "playbook" ? result.playbook : result.analysis} />
              </div>
            </>
          )}
        </section>
      )}

      <footer style={s.footer}>
        <span>Built for micro creators</span>
        <span style={{ color: "#333" }}>·</span>
        <span>Powered by Gemini 2.5 Flash</span>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

function ModeCard({ icon, title, desc, cta, onClick, highlight, badge }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...s.card,
        ...(highlight ? s.cardHighlight : {}),
        ...(hovered ? (highlight ? s.cardHighlightHover : s.cardHover) : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {badge && <div style={s.cardBadge}>{badge}</div>}
      <div style={s.cardIcon}>{icon}</div>
      <h3 style={s.cardTitle}>{title}</h3>
      <p style={s.cardDesc}>{desc}</p>
      <span style={{ ...s.cardCta, ...(highlight ? {} : { color: "#888" }) }}>{cta}</span>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button style={s.back} onClick={onClick} className="back-btn">
      ← Back
    </button>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={s.errorBox}>
      <span style={{ fontSize: "16px" }}>⚠️</span>
      <p style={s.errorText}>{message}</p>
    </div>
  );
}

function LoadingSteps({ steps }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((a) => (a < steps.length - 1 ? a + 1 : a));
    }, 2800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div style={s.loadingBox} className="fade-up">
      <div style={s.loadingHeader}>
        <div style={s.spinner} />
        <span style={s.loadingTitle}>Working on it…</span>
      </div>
      <div style={s.loadingSteps}>
        {steps.map((step, i) => (
          <div key={i} style={s.loadingStep}>
            <div style={{
              ...s.stepDot,
              background: i < active ? "#4ade80" : i === active ? "#e8ff47" : "#1e1e1e",
              boxShadow: i === active ? "0 0 8px rgba(232,255,71,0.6)" : "none",
            }} />
            <span style={{
              ...s.stepText,
              color: i < active ? "#4ade80" : i === active ? "#f0f0f0" : "#333",
            }}>
              {i < active ? "✓ " : ""}{step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReelInput({ index, reel, type, onUrlChange, onFileChange }) {
  const [dragging, setDragging] = useState(false);
  const accentColor = type === "best" ? "#4ade80" : "#f87171";

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFileChange(file);
  };

  return (
    <div style={s.reelInputCard}>
      <div style={{ ...s.reelIndexDot, background: accentColor }} />
      <div style={{ flex: 1 }}>
        <label style={s.reelLabel}>Reel {index + 1}</label>
        <input
          style={s.input}
          placeholder="https://www.instagram.com/reel/..."
          value={reel.url}
          onChange={(e) => onUrlChange(e.target.value)}
        />
        <label
          style={{
            ...s.fileLabel,
            ...(dragging ? s.fileLabelDrag : {}),
            ...(reel.file ? s.fileLabelDone : {}),
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {reel.file
            ? <><span style={{ color: "#4ade80" }}>✓</span> {reel.file.name}</>
            : <><span style={{ opacity: 0.5 }}>↑</span> Upload Insights Screenshot</>
          }
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onFileChange(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}

function MarkdownRenderer({ text }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", lineHeight: 1.9, color: "#ccc" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <div key={i} style={s.mdH2Wrapper}>
              <h2 style={s.mdH2}>{renderInline(line.replace(/^##\s*/, ""))}</h2>
            </div>
          );
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} style={s.mdH3}>{renderInline(line.replace(/^###\s*/, ""))}</h3>;
        }
        if (line.trim() === "---") {
          return <hr key={i} style={s.mdHr} />;
        }
        if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
          const content = line.trim().replace(/^[*-]\s/, "");
          return (
            <p key={i} style={s.mdBullet}>
              <span style={s.mdBulletDot}>▸</span>
              {renderInline(content)}
            </p>
          );
        }
        if (/^\d+\.\s/.test(line.trim())) {
          const match = line.trim().match(/^(\d+)\.\s(.*)/);
          return (
            <p key={i} style={s.mdNumbered}>
              <span style={s.mdNumber}>{match[1]}.</span>
              {renderInline(match[2])}
            </p>
          );
        }
        if (!line.trim()) return <div key={i} style={{ height: "10px" }} />;
        return <p key={i} style={{ marginBottom: "4px" }}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} style={{ color: "#f0f0f0", fontWeight: "600" }}>{part.slice(2, -2)}</strong>
      : part
  );
}

/* ─── Global CSS ─── */

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.85); } }
  @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(232,255,71,0); } 50% { box-shadow: 0 0 20px 4px rgba(232,255,71,0.15); } }

  .fade-up { animation: fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }

  input::placeholder, textarea::placeholder { color: #333; }
  input:focus, textarea:focus { outline: none; border-color: #e8ff47 !important; box-shadow: 0 0 0 3px rgba(232,255,71,0.08); }

  .btn-press:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .btn-press:active:not(:disabled) { transform: translateY(0px) scale(0.98); }
  .btn-press { transition: transform 0.15s ease, opacity 0.15s ease; }

  .back-btn:hover { color: #aaa !important; }
  .back-btn { transition: color 0.15s ease; }

  .tab-btn { transition: all 0.2s ease; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0f0f0f; }
  ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
`;

/* ─── Styles ─── */

const s = {
  page: {
    minHeight: "100vh",
    background: "#080808",
    color: "#f0f0f0",
    fontFamily: "'Syne', sans-serif",
  },

  /* Header */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 40px",
    borderBottom: "1px solid #141414",
    position: "sticky",
    top: 0,
    background: "rgba(8,8,8,0.92)",
    backdropFilter: "blur(12px)",
    zIndex: 100,
  },
  logo: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
  logoMark: {
    width: "30px",
    height: "30px",
    background: "#e8ff47",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
    color: "#080808",
    letterSpacing: "-0.5px",
  },
  logoText: { fontSize: "18px", fontWeight: "800", color: "#f8f8f8", letterSpacing: "-0.5px" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  badge: {
    fontSize: "10px",
    fontFamily: "'DM Mono', monospace",
    color: "#333",
    border: "1px solid #1e1e1e",
    padding: "4px 10px",
    borderRadius: "20px",
    letterSpacing: "0.5px",
  },

  /* Home */
  home: { maxWidth: "760px", margin: "0 auto", padding: "88px 24px 100px", animation: "fadeUp 0.5s ease both" },
  heroEyebrow: {
    display: "inline-block",
    fontSize: "11px",
    fontFamily: "'DM Mono', monospace",
    color: "#e8ff47",
    border: "1px solid rgba(232,255,71,0.2)",
    background: "rgba(232,255,71,0.05)",
    padding: "5px 12px",
    borderRadius: "20px",
    marginBottom: "24px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: "clamp(38px, 5.5vw, 62px)",
    fontWeight: "800",
    lineHeight: 1.08,
    letterSpacing: "-2px",
    marginBottom: "20px",
    color: "#f8f8f8",
  },
  accent: {
    color: "#e8ff47",
    background: "linear-gradient(135deg, #e8ff47 0%, #b8ff00 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: { fontSize: "16px", color: "#555", marginBottom: "56px", lineHeight: 1.8 },

  /* Mode Cards */
  modeCards: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  card: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "20px",
    padding: "32px",
    cursor: "pointer",
    transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
    position: "relative",
    overflow: "hidden",
  },
  cardHover: {
    transform: "translateY(-4px)",
    borderColor: "#2a2a2a",
    boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
  },
  cardHighlight: { border: "1px solid rgba(232,255,71,0.3)", background: "#0c0d08" },
  cardHighlightHover: {
    transform: "translateY(-4px)",
    borderColor: "#e8ff47",
    boxShadow: "0 24px 48px rgba(232,255,71,0.08)",
  },
  cardBadge: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "#e8ff47",
    color: "#080808",
    fontSize: "10px",
    fontWeight: "700",
    padding: "3px 9px",
    borderRadius: "20px",
    letterSpacing: "0.3px",
  },
  cardIcon: { fontSize: "28px", marginBottom: "20px" },
  cardTitle: { fontSize: "20px", fontWeight: "700", marginBottom: "10px", color: "#f8f8f8" },
  cardDesc: { fontSize: "14px", color: "#555", lineHeight: 1.7, marginBottom: "24px" },
  cardCta: { fontSize: "13px", fontWeight: "700", color: "#e8ff47" },

  /* Section */
  section: { maxWidth: "880px", margin: "0 auto", padding: "40px 24px 100px" },
  sectionHeader: { display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "32px" },
  sectionIcon: {
    fontSize: "24px",
    width: "48px",
    height: "48px",
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  sectionTitle: { fontSize: "28px", fontWeight: "800", marginBottom: "6px", letterSpacing: "-0.5px" },
  sectionSub: { fontSize: "14px", color: "#555", lineHeight: 1.7 },
  back: {
    background: "none",
    border: "none",
    color: "#444",
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "28px",
    fontFamily: "'DM Mono', monospace",
    padding: 0,
    display: "block",
  },

  /* Form */
  formCard: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
  },
  fieldLabel: {
    display: "block",
    fontSize: "11px",
    fontFamily: "'DM Mono', monospace",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "8px",
  },
  optional: { textTransform: "none", color: "#333", letterSpacing: "0" },
  inputRow: { display: "flex", gap: "10px" },
  input: {
    flex: 1,
    padding: "11px 15px",
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "10px",
    color: "#f0f0f0",
    fontSize: "13px",
    fontFamily: "'DM Mono', monospace",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    width: "100%",
    display: "block",
    marginBottom: "0",
  },
  btn: {
    padding: "11px 22px",
    background: "#e8ff47",
    color: "#080808",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Syne', sans-serif",
    whiteSpace: "nowrap",
    letterSpacing: "-0.2px",
  },
  btnLarge: {
    width: "100%",
    padding: "16px",
    fontSize: "15px",
    marginTop: "28px",
    borderRadius: "14px",
    letterSpacing: "-0.3px",
  },

  /* Error */
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "rgba(248,113,113,0.06)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: "12px",
    padding: "16px 20px",
    marginTop: "16px",
  },
  errorText: { color: "#f87171", fontSize: "13px", fontFamily: "'DM Mono', monospace", lineHeight: 1.6 },

  /* Loading */
  loadingBox: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "16px",
    padding: "24px 28px",
    marginTop: "20px",
  },
  loadingHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #1e1e1e",
    borderTop: "2px solid #e8ff47",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },
  loadingTitle: { fontSize: "13px", fontWeight: "600", color: "#aaa", fontFamily: "'DM Mono', monospace" },
  loadingSteps: { display: "flex", flexDirection: "column", gap: "12px" },
  loadingStep: { display: "flex", alignItems: "center", gap: "12px" },
  stepDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
    transition: "background 0.4s ease, box-shadow 0.4s ease",
  },
  stepText: { fontSize: "12px", fontFamily: "'DM Mono', monospace", transition: "color 0.4s ease" },

  /* Reel Inputs */
  reelGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "8px" },
  reelGroupHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" },
  reelGroupDot: (color) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
    boxShadow: `0 0 6px ${color}`,
  }),
  reelGroupTitle: { fontSize: "13px", fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" },
  reelInputCard: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "16px",
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "12px",
    padding: "16px",
  },
  reelIndexDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: "14px",
  },
  reelLabel: {
    display: "block",
    fontSize: "10px",
    fontFamily: "'DM Mono', monospace",
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "8px",
  },
  fileLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "8px",
    padding: "9px 13px",
    background: "#111",
    border: "1px dashed #222",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#555",
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
    transition: "border-color 0.2s, background 0.2s",
  },
  fileLabelDrag: { borderColor: "#e8ff47", background: "rgba(232,255,71,0.04)" },
  fileLabelDone: { borderColor: "#4ade80", borderStyle: "solid", color: "#888" },

  /* Results */
  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "24px",
    gap: "16px",
    flexWrap: "wrap",
  },
  reportEyebrow: {
    fontSize: "11px",
    fontFamily: "'DM Mono', monospace",
    color: "#e8ff47",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "6px",
  },
  downloadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "11px 20px",
    background: "#0d0d0d",
    color: "#f0f0f0",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Syne', sans-serif",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  tabs: { display: "flex", gap: "6px", marginBottom: "16px" },
  tab: {
    padding: "10px 18px",
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "10px",
    color: "#555",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Syne', sans-serif",
  },
  tabActive: { background: "#e8ff47", color: "#080808", borderColor: "#e8ff47" },
  resultBox: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "16px",
    padding: "32px",
    maxHeight: "680px",
    overflowY: "auto",
  },

  /* Markdown */
  mdH2Wrapper: {
    marginTop: "28px",
    marginBottom: "12px",
    paddingBottom: "10px",
    borderBottom: "1px solid #1a1a1a",
  },
  mdH2: {
    fontSize: "15px",
    fontFamily: "'Syne', sans-serif",
    fontWeight: "800",
    color: "#e8ff47",
    letterSpacing: "-0.2px",
  },
  mdH3: {
    fontSize: "13px",
    fontFamily: "'Syne', sans-serif",
    fontWeight: "700",
    color: "#d0d0d0",
    marginTop: "18px",
    marginBottom: "8px",
    letterSpacing: "-0.1px",
  },
  mdHr: { border: "none", borderTop: "1px solid #1a1a1a", margin: "20px 0" },
  mdBullet: {
    display: "flex",
    gap: "10px",
    paddingLeft: "4px",
    marginBottom: "6px",
    color: "#aaa",
    alignItems: "baseline",
  },
  mdBulletDot: { color: "#e8ff47", fontSize: "9px", flexShrink: 0, marginTop: "2px" },
  mdNumbered: {
    display: "flex",
    gap: "12px",
    paddingLeft: "4px",
    marginBottom: "6px",
    color: "#aaa",
  },
  mdNumber: {
    color: "#e8ff47",
    fontWeight: "700",
    flexShrink: 0,
    minWidth: "20px",
  },

  /* Footer */
  footer: {
    textAlign: "center",
    padding: "28px",
    color: "#222",
    fontSize: "11px",
    fontFamily: "'DM Mono', monospace",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    letterSpacing: "0.3px",
  },
};
