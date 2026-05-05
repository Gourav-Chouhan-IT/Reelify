# 🎬 Reelify

An AI-powered content strategy tool for Instagram micro-creators (10k–100k followers) that analyzes reels and generates personalized Viral Playbooks and Creator Strategy Reports.

> **Status:** MVP v1.0 — Live & Deployed  
> **Live App:** [reelify-six.vercel.app](https://reelify-six.vercel.app)

---

## 🚀 What it does

**Single Reel Analysis → Viral Playbook**
Paste any Instagram reel URL. Reelify downloads it, runs it through Gemini 2.5 Flash video analysis, and generates a personalized playbook explaining why it works (or doesn't) — hooks, pacing, audio, CTA, and improvement suggestions.

**Creator Report (Full Growth Strategy)**
Upload 6 reels (3 best + 3 worst) and your insights screenshots. Reelify generates a full creator strategy report with a prioritized action plan for your next 5 reels — based on what's actually working in your content.

**PDF Export**
Every report exports as a branded, downloadable PDF.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite |
| Backend | Python, FastAPI |
| AI | Gemini 2.5 Flash (video analysis + report generation) |
| Video Download | yt-dlp |
| PDF Generation | ReportLab |
| Security | slowapi rate limiting, x-api-key header auth |
| Deployment | Vercel (frontend), Render (backend) |

---

## 📁 Project Structure

```
Reelify/
├── frontend/               # React + Vite app
│   └── src/
└── backend/
    ├── main.py             # FastAPI app + endpoints
    ├── analyzer.py         # Gemini 2.5 Flash video analysis
    ├── downloader.py       # yt-dlp reel downloading
    ├── playbook.py         # Report generation logic
    ├── insights.py         # Insights screenshot parsing
    └── pdf_generator.py    # ReportLab PDF generation
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/health` | Health check |
| POST | `/analyze` | Single reel analysis → Viral Playbook |
| POST | `/creator-report` | 6 reels + insights → full growth strategy |
| POST | `/generate-pdf` | Export report as branded PDF |

---

## ⚙️ Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Set your environment variables:
```
GEMINI_API_KEY=your_key_here
API_KEY=your_x_api_key_here
```

---

## 🎯 Who it's for

Instagram micro-creators (10k–100k followers) who want data-driven content strategy without hiring a social media manager.

**Problem it solves:** Most creators post by instinct. Reelify turns your own reel data into a concrete growth strategy — showing exactly what's working, what isn't, and what to do next.

---

## 🗺️ Roadmap

- [x] Single reel analysis + Viral Playbook
- [x] Creator Report (6 reels + insights screenshots)
- [x] Branded PDF export
- [x] Rate limiting + API key auth
- [x] Deployed on Vercel + Render
- [ ] WebSocket progress updates
- [ ] PostgreSQL persistent storage
- [ ] Billing integration
- [ ] Multi-platform support (YouTube Shorts, TikTok)

---

## 👤 Author

**Gourav Chouhan**  
B.Tech Information Technology, VIT Bhopal  
[GitHub](https://github.com/Gourav-Chouhan-IT) · [LinkedIn](https://www.linkedin.com/in/gourav-chouhan-071036374) · [Live App](https://reelify-six.vercel.app)

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
