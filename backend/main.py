from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from downloader import download_reel
from analyzer import analyze_reel
from playbook import generate_playbook, generate_creator_report
from insights import parse_insights_screenshot
from pdf_generator import generate_report_pdf
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import List
import os
import shutil

app = FastAPI(title="Reelify API", version="1.0.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class ReelRequest(BaseModel):
    url: str


class ReelResponse(BaseModel):
    success: bool
    video_path: str
    analysis: str
    playbook: str


async def verify_api_key(x_api_key: str = Header(None)):
    expected = os.getenv("API_SECRET_KEY")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health_check():
    return {"status": "Reelify API is running!"}


@app.post("/analyze", response_model=ReelResponse)
@limiter.limit("5/minute")
async def analyze(request: Request, body: ReelRequest, _=Depends(verify_api_key)):
    try:
        video_path = download_reel(body.url)
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
@limiter.limit("2/minute")
async def creator_report(
    request: Request,
    best_urls: str = Form(...),
    worst_urls: str = Form(...),
    best_insights: List[UploadFile] = File(...),
    worst_insights: List[UploadFile] = File(...),
    _=Depends(verify_api_key)
):
    try:
        os.makedirs("uploads", exist_ok=True)

        MAX_SIZE = 50 * 1024 * 1024  # 50MB
        for f in best_insights + worst_insights:
            contents = await f.read()
            if len(contents) > MAX_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {f.filename} is too large. Max size is 50MB."
                )
            await f.seek(0)

        best_url_list = [u.strip() for u in best_urls.split(",")]
        worst_url_list = [u.strip() for u in worst_urls.split(",")]

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
@limiter.limit("10/minute")
async def generate_pdf(
    request: Request,
    report: str = Form(...),
    creator_name: str = Form(...),
    _=Depends(verify_api_key)
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