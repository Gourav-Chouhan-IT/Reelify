import { useState } from 'react';
import { API_URL, API_KEY, initialReels } from './constants';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SingleAnalyzePage from './pages/SingleAnalyzePage';
import CreatorReportPage from './pages/CreatorReportPage';
import ResultsPage from './pages/ResultsPage';
import './styles/globals.css';
import './styles/forms.css';

export default function App() {
  const [mode, setMode] = useState('home');
  const [singleUrl, setSingleUrl] = useState('');
  const [bestReels, setBestReels] = useState(initialReels);
  const [worstReels, setWorstReels] = useState(initialReels);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('report');
  const [error, setError] = useState(null);
  const [creatorName, setCreatorName] = useState('');

  const updateReel = (list, setList, index, field, value) => {
    setList(list.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const downloadPDF = async (reportText, filename) => {
    const formData = new FormData();
    formData.append('report', reportText);
    formData.append('creator_name', creatorName.trim() || 'Creator');
    const res = await fetch(`${API_URL}/generate-pdf`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: formData,
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ url: singleUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setResult({ type: 'single', ...data });
      setActiveTab('playbook');
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
      setError('Please add at least 1 best and 1 worst reel URL.');
      return;
    }
    if (bestFiles.length !== bestUrls.length || worstFiles.length !== worstUrls.length) {
      setError('Please upload an insights screenshot for every reel URL you added.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('best_urls', bestUrls.join(','));
      formData.append('worst_urls', worstUrls.join(','));
      bestFiles.forEach((f) => formData.append('best_insights', f));
      worstFiles.forEach((f) => formData.append('worst_insights', f));
      const res = await fetch(`${API_URL}/creator-report`, {
        method: 'POST',
        headers: { 'x-api-key': API_KEY },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setResult({ type: 'creator', ...data });
      setActiveTab('report');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => { setMode('home'); setResult(null); setError(null); };

  return (
    <div className="r-page">
      <div className="r-orb r-orb1" />
      <div className="r-orb r-orb2" />

      <Header onLogoClick={goHome} />

      {mode === 'home' && !result && (
        <HomePage onModeSelect={setMode} />
      )}

      {mode === 'single' && !result && (
        <SingleAnalyzePage
          creatorName={creatorName}
          setCreatorName={setCreatorName}
          singleUrl={singleUrl}
          setSingleUrl={setSingleUrl}
          loading={loading}
          error={error}
          onAnalyze={analyzeSingle}
          onBack={() => { setMode('home'); setError(null); }}
        />
      )}

      {mode === 'creator' && !result && (
        <CreatorReportPage
          creatorName={creatorName}
          setCreatorName={setCreatorName}
          bestReels={bestReels}
          setBestReels={setBestReels}
          worstReels={worstReels}
          setWorstReels={setWorstReels}
          loading={loading}
          error={error}
          onAnalyze={analyzeCreator}
          onBack={() => { setMode('home'); setError(null); }}
          updateReel={updateReel}
        />
      )}

      {result && (
        <ResultsPage
          result={result}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          creatorName={creatorName}
          onDownloadPDF={downloadPDF}
          onBack={() => { setResult(null); setError(null); }}
        />
      )}

      <footer className="r-footer">
        <span>Reelify</span>
        <span className="r-footer-dot">·</span>
        <span>Built for micro creators</span>
        <span className="r-footer-dot">·</span>
        <span>Powered by Gemini 2.5 Flash</span>
      </footer>
    </div>
  );
}
