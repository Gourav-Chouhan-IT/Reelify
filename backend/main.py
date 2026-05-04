from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from downloader import download_reel
from analyzer import analyze_reel
from playbook import generate_playbook, generate_creator_report
from insights import parse_insights_screenshot
from pdf_generator import generate_report_pdf
from typing import List
import os
import shutil

app = FastAPI(title="Reelify API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReelRequest(BaseModel):
    url: str


class ReelResponse(BaseModel):
    success: bool
    video_path: str
    analysis: str
    playbook: str


@app.get("/health")
def health_check():
    return {"status": "Reelify API is running!"}


@app.post("/analyze", response_model=ReelResponse)
async def analyze(request: ReelRequest):
    try:
        video_path = download_reel(request.url)
        analysis_result = analyze_reel(video_path)
        playbook_result = generate_playbook(analysis_result["raw_analysis"])

        return ReelResponse(
            success=True,
            video_path=video_path,
            analysis=analysis_result["raw_analysis"],
            playbook=playbook_result["playbook"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/creator-report")
async def creator_report(
    best_urls: str = Form(...),
    worst_urls: str = Form(...),
    best_insights: List[UploadFile] = File(...),
    worst_insights: List[UploadFile] = File(...),
):
    try:
        os.makedirs("uploads", exist_ok=True)

        best_url_list = [u.strip() for u in best_urls.split(",")]
        worst_url_list = [u.strip() for u in worst_urls.split(",")]

        # Process best reels
        best_reels = []
        for i, url in enumerate(best_url_list):
            print(f"Processing best reel {i+1}: {url}")
            video_path = download_reel(url)
            analysis = analyze_reel(video_path)

            insight_file = best_insights[i]
            insight_path = f"uploads/best_{i}_{insight_file.filename}"
            with open(insight_path, "wb") as f:
                shutil.copyfileobj(insight_file.file, f)
            metrics = parse_insights_screenshot(insight_path)

            best_reels.append({
                "url": url,
                "analysis": analysis["raw_analysis"],
                "metrics": metrics["raw_metrics"]
            })

        # Process worst reels
        worst_reels = []
        for i, url in enumerate(worst_url_list):
            print(f"Processing worst reel {i+1}: {url}")
            video_path = download_reel(url)
            analysis = analyze_reel(video_path)

            insight_file = worst_insights[i]
            insight_path = f"uploads/worst_{i}_{insight_file.filename}"
            with open(insight_path, "wb") as f:
                shutil.copyfileobj(insight_file.file, f)
            metrics = parse_insights_screenshot(insight_path)

            worst_reels.append({
                "url": url,
                "analysis": analysis["raw_analysis"],
                "metrics": metrics["raw_metrics"]
            })

        # Generate creator report
        report = generate_creator_report(best_reels, worst_reels)

        return {
            "success": True,
            "report": report["report"],
            "best_reels_count": len(best_reels),
            "worst_reels_count": len(worst_reels)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-pdf")
async def generate_pdf(
    report: str = Form(...),
    creator_name: str = Form(...)
):
    try:
        pdf_path = generate_report_pdf(report, creator_name)
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=f"{creator_name}_reelify_report.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))