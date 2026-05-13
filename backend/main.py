import re
import os
import shutil
import uuid
import sentry_sdk
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, Depends, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Custom Module Imports
from downloader import download_reel
from analyzer import analyze_reel
from playbook import generate_playbook, generate_creator_report
from insights import parse_insights_screenshot
from pdf_generator import generate_report_pdf

load_dotenv()

# Initialize Sentry
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration(), StarletteIntegration()],
    # FIX: Reduced from 1.0 to 0.1 to protect free tier quota
    traces_sample_rate=0.1, 
    environment=os.getenv("ENVIRONMENT", "development"),
    debug=os.getenv("DEBUG", "False") == "True",
)

app = FastAPI(title="Reelify API", version="1.0.0")

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "X-API-Key", "Authorization"],
)

# --- Models ---

class ReelRequest(BaseModel):
    url: str

class ReelResponse(BaseModel):
    success: bool
    video_url: str  
    analysis: str
    playbook: str

# --- Dependencies & Helpers ---

async def verify_api_key(x_api_key: str = Header(None)):
    expected = os.getenv("API_SECRET_KEY")
    if not expected:
        raise HTTPException(status_code=500, detail="Server misconfiguration")
    if not x_api_key or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

# NEW: Background cleanup helper function
def cleanup_file(file_path: str):
    """Silently deletes a file to free up server disk space."""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            print(f"[CLEANUP] Deleted {file_path}")
    except Exception as e:
        print(f"[WARNING] Failed to clean up {file_path}: {e}")

# --- Security Middleware ---

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {"status": "Reelify API is running!"}

@app.post("/analyze", response_model=ReelResponse)
@limiter.limit("5/minute")
async def analyze(request: Request, body: ReelRequest, background_tasks: BackgroundTasks, _=Depends(verify_api_key)):
    try:
        internal_video_path = download_reel(body.url)
        analysis_result = analyze_reel(internal_video_path)
        playbook_result = generate_playbook(analysis_result["raw_analysis"])

        filename = os.path.basename(internal_video_path)
        base_url = str(request.base_url).rstrip("/")
        public_video_url = f"{base_url}/api/v1/files/download/{filename}"

        # FIX: Schedule the video deletion for right after the user gets their response
        background_tasks.add_task(cleanup_file, internal_video_path)

        return ReelResponse(
            success=True,
            video_url=public_video_url,
            analysis=analysis_result["raw_analysis"],
            playbook=playbook_result["playbook"]
        )
    except Exception as e:
        sentry_sdk.capture_exception(e)
        raise HTTPException(status_code=500, detail="Analysis failed.")

@app.post("/generate-pdf")
@limiter.limit("10/minute")
async def generate_pdf(
    request: Request,
    background_tasks: BackgroundTasks,
    report: str = Form(...),
    creator_name: str = Form(...),
    _=Depends(verify_api_key)
):
    try:
        pdf_path = generate_report_pdf(report, creator_name)
        safe_filename = os.path.basename(pdf_path)
        
        # FIX: Schedule PDF deletion. FastAPI will wait to delete it until AFTER the file is sent!
        background_tasks.add_task(cleanup_file, pdf_path)
        
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=safe_filename,
            background=background_tasks
        )
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"[ERROR] /generate-pdf: {e}")
        raise HTTPException(status_code=500, detail="PDF generation failed.")

# --- File Serving Endpoint ---

@app.get("/api/v1/files/download/{filename}")
@limiter.limit("10/minute")
async def secure_download(request: Request, filename: str):
    safe_filename = os.path.basename(filename)
    
    file_path = os.path.join("outputs", safe_filename)
    if not os.path.exists(file_path):
        file_path = os.path.join("uploads", safe_filename)
        
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
        
    return FileResponse(path=file_path, filename=safe_filename)

# --- Creator Report ---   
@app.post("/creator-report")
@limiter.limit("2/minute")
async def creator_report(
    request: Request,
    background_tasks: BackgroundTasks,
    best_urls: str = Form(...),
    worst_urls: str = Form(...),
    best_insights: List[UploadFile] = File(...),
    worst_insights: List[UploadFile] = File(...),
    _=Depends(verify_api_key)
):
    try:
        os.makedirs("uploads", exist_ok=True)

        best_url_list = [u.strip() for u in best_urls.split(",")]
        worst_url_list = [u.strip() for u in worst_urls.split(",")]

        if len(best_url_list) != len(best_insights) or len(worst_url_list) != len(worst_insights):
            raise HTTPException(status_code=400, detail="Input Mismatch: URLs and insights must match exactly.")

        MAX_SIZE = 50 * 1024 * 1024  
        for f in best_insights + worst_insights:
            contents = await f.read()
            if len(contents) > MAX_SIZE:
                raise HTTPException(status_code=400, detail=f"File {f.filename} is too large. Max size is 50MB.")
            await f.seek(0)

        best_reels = []
        failed_best = [] 
        
        for i, (url, insight_file) in enumerate(zip(best_url_list, best_insights)):
            try:
                internal_video_path = download_reel(url)
                analysis = analyze_reel(internal_video_path)

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
                
                # FIX: Clean up heavy files for each best reel
                background_tasks.add_task(cleanup_file, internal_video_path)
                background_tasks.add_task(cleanup_file, insight_path)
                
            except Exception as e:
                sentry_sdk.capture_exception(e)
                failed_best.append(url) 

        worst_reels = []
        failed_worst = []
        
        for i, (url, insight_file) in enumerate(zip(worst_url_list, worst_insights)):
            try:
                internal_video_path = download_reel(url)
                analysis = analyze_reel(internal_video_path)

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
                
                # FIX: Clean up heavy files for each worst reel
                background_tasks.add_task(cleanup_file, internal_video_path)
                background_tasks.add_task(cleanup_file, insight_path)
                
            except Exception as e:
                sentry_sdk.capture_exception(e)
                failed_worst.append(url)

        report = generate_creator_report(best_reels, worst_reels)

        return {
            "success": True,
            "report": report["report"],
            "best_reels_count": len(best_reels),
            "worst_reels_count": len(worst_reels),
            "failed_urls": failed_best + failed_worst 
        }

    except HTTPException:
        raise
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"[ERROR] /creator-report: {e}")
        raise HTTPException(status_code=500, detail="Report generation failed. Please try again.")