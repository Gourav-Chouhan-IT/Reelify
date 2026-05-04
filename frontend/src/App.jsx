import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const initialReels = () => Array(3).fill({ url: "", file: null });

export default function App() {
  const [mode, setMode] = useState("home"); // home | single | creator
  const [singleUrl, setSingleUrl] = useState("");
  const [bestReels, setBestReels] = useState(initialReels());
  const [worstReels, setWorstReels] = useState(initialReels());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("report");
  const [error, setError] = useState(null);

  const updateReel = (list, setList, index, field, value) => {
    const updated = list.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    setList(updated);
  };

  const downloadPDF = async () => {
    const formData = new FormData();
    formData.append("report", result.report);
    formData.append("creator_name", "Creator");

    const res = await fetch(`${API_URL}/generate-pdf`, {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reelify_report.pdf";
    a.click();
  };

  const analyzeSingle = async () => {
    if (!singleUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder, textarea::placeholder { color: #444; }
        input:focus, textarea:focus { outline: none; border-color: #e8ff47 !important; }
        button:hover:not(:disabled) { opacity: 0.88; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <header style={s.header}>
        <div style={s.logo} onClick={() => { setMode("home"); setResult(null); setError(null); }}>
          <span style={s.logoAccent}>⚡</span>
          <span style={s.logoText}>Reelify</span>
        </div>
        <span style={s.badge}>MVP v1.0</span>
      </header>

      {/* HOME */}
      {mode === "home" && !result && (
        <section style={s.home}>
          <h1 style={s.heroTitle}>
            Your Instagram Reels,<br />
            <span style={s.accent}>Decoded.</span>
          </h1>
          <p style={s.heroSub}>
            Analyze any reel instantly — or get a full Creator Strategy Report from your best and worst performers.
          </p>
          <div style={s.modeCards}>
            <div style={s.card} onClick={() => setMode("single")}>
              <div style={s.cardIcon}>🎯</div>
              <h3 style={s.cardTitle}>Quick Analyze</h3>
              <p style={s.cardDesc}>Paste one reel URL and get instant analysis + viral playbook.</p>
              <span style={s.cardCta}>Try it →</span>
            </div>
            <div style={{ ...s.card, ...s.cardHighlight }} onClick={() => setMode("creator")}>
              <div style={s.cardBadge}>For Creators</div>
              <div style={s.cardIcon}>🚀</div>
              <h3 style={s.cardTitle}>Creator Report</h3>
              <p style={s.cardDesc}>Analyze your 3 best + 3 worst reels. Get your personalized growth strategy.</p>
              <span style={s.cardCta}>Get Report →</span>
            </div>
          </div>
        </section>
      )}

      {/* SINGLE ANALYZE */}
      {mode === "single" && !result && (
        <section style={s.section}>
          <button style={s.back} onClick={() => { setMode("home"); setError(null); }}>← Back</button>
          <h2 style={s.sectionTitle}>Quick Reel Analysis</h2>
          <p style={s.sectionSub}>Paste any public Instagram reel URL below.</p>
          <div style={s.inputRow}>
            <input
              style={s.input}
              placeholder="https://www.instagram.com/reel/..."
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeSingle()}
            />
            <button style={s.btn} onClick={analyzeSingle} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze →"}
            </button>
          </div>
          {error && <p style={s.error}>⚠️ {error}</p>}
          {loading && <LoadingBar text="Downloading → Analyzing with Gemini → Generating Playbook..." />}
        </section>
      )}

      {/* CREATOR REPORT */}
      {mode === "creator" && !result && (
        <section style={s.section}>
          <button style={s.back} onClick={() => { setMode("home"); setError(null); }}>← Back</button>
          <h2 style={s.sectionTitle}>Creator Strategy Report</h2>
          <p style={s.sectionSub}>Add your 3 best and 3 worst performing reels with their insights screenshots.</p>

          <div style={s.reelGrid}>
            {/* Best Reels */}
            <div>
              <h3 style={s.reelGroupTitle}>🟢 Best Performing Reels</h3>
              {bestReels.map((reel, i) => (
                <ReelInput
                  key={i}
                  index={i}
                  reel={reel}
                  onUrlChange={(val) => updateReel(bestReels, setBestReels, i, "url", val)}
                  onFileChange={(file) => updateReel(bestReels, setBestReels, i, "file", file)}
                />
              ))}
            </div>

            {/* Worst Reels */}
            <div>
              <h3 style={s.reelGroupTitle}>🔴 Worst Performing Reels</h3>
              {worstReels.map((reel, i) => (
                <ReelInput
                  key={i}
                  index={i}
                  reel={reel}
                  onUrlChange={(val) => updateReel(worstReels, setWorstReels, i, "url", val)}
                  onFileChange={(file) => updateReel(worstReels, setWorstReels, i, "file", file)}
                />
              ))}
            </div>
          </div>

          {error && <p style={s.error}>⚠️ {error}</p>}
          {loading && <LoadingBar text="Downloading & analyzing 6 reels → Parsing insights → Generating Creator Report..." />}

          {!loading && (
            <button style={{ ...s.btn, ...s.btnLarge }} onClick={analyzeCreator}>
              Generate Creator Report 🚀
            </button>
          )}
        </section>
      )}

      {/* RESULTS */}
      {result && (
        <section style={{ ...s.section, animation: "fadeIn 0.4s ease" }}>
          <button style={s.back} onClick={() => { setResult(null); setError(null); }}>← Back</button>

          {result.type === "creator" && (
            <>
              <h2 style={s.sectionTitle}>Your Creator Strategy Report</h2>
              <p style={s.sectionSub}>
                Based on {result.best_reels_count} best + {result.worst_reels_count} worst performing reels.
              </p>
              <button style={{ ...s.btn, marginBottom: "16px" }} onClick={downloadPDF}>
                📄 Download PDF Report
              </button>
              <div style={s.resultBox}>
                <MarkdownRenderer text={result.report} />
              </div>
            </>
          )}

          {result.type === "single" && (
            <>
              <h2 style={s.sectionTitle}>Reel Analysis Complete</h2>
              <button style={{ ...s.btn, marginBottom: "16px" }} onClick={() => {
                const formData = new FormData();
                formData.append("report", result.playbook);
                formData.append("creator_name", "Creator");
                fetch(`${API_URL}/generate-pdf`, { method: "POST", body: formData })
                  .then(res => res.blob())
                  .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "reelify_playbook.pdf";
                    a.click();
                  });
              }}>
                📄 Download Playbook PDF
              </button>
              <div style={s.tabs}>
                {["playbook", "analysis"].map((tab) => (
                  <button
                    key={tab}
                    style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "playbook" ? "🎯 Viral Playbook" : "🔍 Reel Analysis"}
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

      <footer style={s.footer}>Built for micro creators · Powered by Gemini AI</footer>
    </div>
  );
}

function MarkdownRenderer({ text }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", lineHeight: 1.9, color: "#ccc" }}>
      {lines.map((line, i) => {
        // H2
        if (line.startsWith("## ")) {
          return <h2 key={i} style={{ fontSize: "16px", fontFamily: "'Syne', sans-serif", fontWeight: "800", color: "#e8ff47", marginTop: "24px", marginBottom: "8px" }}>{line.replace(/^##\s*/, "")}</h2>;
        }
        // H3
        if (line.startsWith("### ")) {
          return <h3 key={i} style={{ fontSize: "14px", fontFamily: "'Syne', sans-serif", fontWeight: "700", color: "#f0f0f0", marginTop: "16px", marginBottom: "6px" }}>{line.replace(/^###\s*/, "")}</h3>;
        }
        // Horizontal rule
        if (line.trim() === "---") {
          return <hr key={i} style={{ border: "none", borderTop: "1px solid #222", margin: "16px 0" }} />;
        }
        // Bullet points
        if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
          const content = line.trim().replace(/^\*\s|-\s/, "").replace(/\*\*(.*?)\*\*/g, "$1");
          return <p key={i} style={{ paddingLeft: "16px", marginBottom: "4px", color: "#bbb" }}>• {content}</p>;
        }
        // Numbered list
        if (/^\d+\.\s/.test(line.trim())) {
          const content = line.trim().replace(/\*\*(.*?)\*\*/g, "$1");
          return <p key={i} style={{ paddingLeft: "16px", marginBottom: "4px", color: "#bbb" }}>{content}</p>;
        }
        // Empty line
        if (!line.trim()) {
          return <div key={i} style={{ height: "8px" }} />;
        }
        // Regular text - strip bold markers
        const content = line.replace(/\*\*(.*?)\*\*/g, "$1");
        return <p key={i} style={{ marginBottom: "4px" }}>{content}</p>;
      })}
    </div>
  );
}

function ReelInput({ index, reel, onUrlChange, onFileChange }) {
  return (
    <div style={s.reelInput}>
      <label style={s.reelLabel}>Reel {index + 1}</label>
      <input
        style={s.input}
        placeholder="https://www.instagram.com/reel/..."
        value={reel.url}
        onChange={(e) => onUrlChange(e.target.value)}
      />
      <label style={s.fileLabel}>
        {reel.file ? `✅ ${reel.file.name}` : "📸 Upload Insights Screenshot"}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => onFileChange(e.target.files[0])}
        />
      </label>
    </div>
  );
}

function LoadingBar({ text }) {
  return (
    <div style={s.loadingBox}>
      <div style={s.spinner} />
      <p style={s.loadingText}>{text}</p>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", fontFamily: "'Syne', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1a1a1a" },
  logo: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  logoAccent: { fontSize: "22px" },
  logoText: { fontSize: "20px", fontWeight: "800", color: "#e8ff47", letterSpacing: "-0.5px" },
  badge: { fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#444", border: "1px solid #222", padding: "4px 10px", borderRadius: "20px" },
  home: { maxWidth: "800px", margin: "0 auto", padding: "80px 24px" },
  heroTitle: { fontSize: "clamp(36px, 5vw, 58px)", fontWeight: "800", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "16px" },
  accent: { color: "#e8ff47" },
  heroSub: { fontSize: "16px", color: "#777", marginBottom: "48px", lineHeight: 1.7 },
  modeCards: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  card: { background: "#111", border: "1px solid #222", borderRadius: "16px", padding: "32px", cursor: "pointer", transition: "border-color 0.2s", position: "relative" },
  cardHighlight: { border: "1px solid #e8ff47" },
  cardBadge: { position: "absolute", top: "16px", right: "16px", background: "#e8ff47", color: "#0a0a0a", fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px" },
  cardIcon: { fontSize: "32px", marginBottom: "16px" },
  cardTitle: { fontSize: "20px", fontWeight: "700", marginBottom: "8px" },
  cardDesc: { fontSize: "14px", color: "#777", lineHeight: 1.6, marginBottom: "20px" },
  cardCta: { fontSize: "13px", color: "#e8ff47", fontWeight: "700" },
  section: { maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" },
  sectionTitle: { fontSize: "28px", fontWeight: "800", marginBottom: "8px", letterSpacing: "-0.5px" },
  sectionSub: { fontSize: "14px", color: "#777", marginBottom: "32px" },
  back: { background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer", marginBottom: "24px", fontFamily: "'Syne', sans-serif", padding: 0 },
  inputRow: { display: "flex", gap: "12px", marginBottom: "16px" },
  input: { flex: 1, padding: "12px 16px", background: "#111", border: "1px solid #222", borderRadius: "10px", color: "#f0f0f0", fontSize: "13px", fontFamily: "'DM Mono', monospace", transition: "border-color 0.2s", width: "100%" },
  btn: { padding: "12px 22px", background: "#e8ff47", color: "#0a0a0a", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap" },
  btnLarge: { width: "100%", padding: "16px", fontSize: "15px", marginTop: "24px" },
  error: { color: "#ff6b6b", fontSize: "13px", fontFamily: "'DM Mono', monospace", marginTop: "12px" },
  loadingBox: { display: "flex", alignItems: "center", gap: "14px", background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "20px", marginTop: "16px" },
  spinner: { width: "18px", height: "18px", border: "2px solid #222", borderTop: "2px solid #e8ff47", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 },
  loadingText: { fontSize: "12px", color: "#666", fontFamily: "'DM Mono', monospace" },
  reelGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "8px" },
  reelGroupTitle: { fontSize: "14px", fontWeight: "700", marginBottom: "16px", color: "#aaa" },
  reelInput: { marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" },
  reelLabel: { fontSize: "12px", color: "#555", fontFamily: "'DM Mono', monospace" },
  fileLabel: { padding: "10px 14px", background: "#111", border: "1px dashed #333", borderRadius: "8px", fontSize: "12px", color: "#777", cursor: "pointer", fontFamily: "'DM Mono', monospace" },
  tabs: { display: "flex", gap: "8px", marginBottom: "16px" },
  tab: { padding: "10px 18px", background: "#111", border: "1px solid #222", borderRadius: "8px", color: "#777", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "'Syne', sans-serif" },
  tabActive: { background: "#e8ff47", color: "#0a0a0a", borderColor: "#e8ff47" },
  resultBox: { background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "28px", maxHeight: "650px", overflowY: "auto" },
  resultText: { fontSize: "13px", lineHeight: 1.9, color: "#ccc", fontFamily: "'DM Mono', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  footer: { textAlign: "center", padding: "24px", color: "#2a2a2a", fontSize: "12px", fontFamily: "'DM Mono', monospace" },
};