import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
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
from dotenv import load_dotenv
import os
import shutil
import uuid

load_dotenv()

# Initialize Sentry FIRST (before FastAPI app creation)
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[
        FastApiIntegration(),
        StarletteIntegration(),
    ],
    traces_sample_rate=1.0,  # Use 0.1 in production
    environment=os.getenv("ENVIRONMENT", "development"),
    debug=os.getenv("DEBUG", "False") == "True",
)

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
    allow_headers=["Content-Type", "X-API-Key", "Authorization"],
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
    if not expected:
        raise HTTPException(status_code=500, detail="Server misconfiguration")
    if not x_api_key or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


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
    except ValueError as e:
        sentry_sdk.capture_exception(e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"[ERROR] /analyze: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


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
                sentry_sdk.capture_message(
                    f"File upload exceeded limit: {f.filename}",
                    level="warning"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"File {f.filename} is too large. Max size is 50MB."
                )
            await f.seek(0)

        best_url_list = [u.strip() for u in best_urls.split(",")]
        worst_url_list = [u.strip() for u in worst_urls.split(",")]

        best_reels = []
        for i, url in enumerate(best_url_list):
            try:
                print(f"Processing best reel {i+1}: {url}")
                video_path = download_reel(url)
                analysis = analyze_reel(video_path)

                insight_file = best_insights[i]
                safe_name = f"best_{i}_{uuid.uuid4().hex}.jpg"
                insight_path = os.path.join("uploads", safe_name)
                with open(insight_path, "wb") as f:
                    shutil.copyfileobj(insight_file.file, f)
                metrics = parse_insights_screenshot(insight_path)

                best_reels.append({
                    "url": url,
                    "analysis": analysis["raw_analysis"],
                    "metrics": metrics["raw_metrics"]
                })
            except Exception as e:
                sentry_sdk.capture_exception(e)
                raise

        worst_reels = []
        for i, url in enumerate(worst_url_list):
            try:
                print(f"Processing worst reel {i+1}: {url}")
                video_path = download_reel(url)
                analysis = analyze_reel(video_path)

                insight_file = worst_insights[i]
                safe_name = f"worst_{i}_{uuid.uuid4().hex}.jpg"
                insight_path = os.path.join("uploads", safe_name)
                with open(insight_path, "wb") as f:
                    shutil.copyfileobj(insight_file.file, f)
                metrics = parse_insights_screenshot(insight_path)

                worst_reels.append({
                    "url": url,
                    "analysis": analysis["raw_analysis"],
                    "metrics": metrics["raw_metrics"]
                })
            except Exception as e:
                sentry_sdk.capture_exception(e)
                raise

        report = generate_creator_report(best_reels, worst_reels)

        return {
            "success": True,
            "report": report["report"],
            "best_reels_count": len(best_reels),
            "worst_reels_count": len(worst_reels)
        }

    except ValueError as e:
        sentry_sdk.capture_exception(e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"[ERROR] /creator-report: {e}")
        raise HTTPException(status_code=500, detail="Report generation failed. Please try again.")


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
        sentry_sdk.capture_exception(e)
        print(f"[ERROR] /generate-pdf: {e}")
        raise HTTPException(status_code=500, detail="PDF generation failed. Please try again.")