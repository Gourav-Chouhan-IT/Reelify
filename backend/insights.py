from google import genai
import os
import time
import sentry_sdk
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def parse_insights_screenshot(image_path: str) -> dict:
    """
    Takes an Instagram insights screenshot and extracts performance metrics.
    """
    print(f"Parsing insights screenshot: {image_path}")

    with open(image_path, "rb") as f:
        image_data = f.read()

    # Detect image type
    ext = image_path.lower().split(".")[-1]
    mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
    mime_type = mime_map.get(ext, "image/jpeg")
    
    prompt_text = """
Extract all performance metrics from this Instagram insights screenshot.
Return the data in this exact format:

VIEWS: [number or N/A]
REACH: [number or N/A]
LIKES: [number or N/A]
COMMENTS: [number or N/A]
SHARES: [number or N/A]
SAVES: [number or N/A]
FOLLOWS: [number or N/A]
WATCH_TIME: [number or N/A]
PROFILE_VISITS: [number or N/A]
IMPRESSIONS: [number or N/A]

Only return the metrics in the format above. If a metric is not visible, write N/A.
"""

    contents = [
        {
            "parts": [
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": __import__("base64").b64encode(image_data).decode()
                    }
                },
                {"text": prompt_text}
            ]
        }
    ]

    # FIX: 3-Attempt Retry Logic for Gemini Vision
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents
            )
            break
        except Exception as e:
            if "503" in str(e) and attempt < 2:
                print(f"Gemini overloaded, retrying in 10s... (attempt {attempt + 1})")
                time.sleep(10)
            else:
                sentry_sdk.capture_exception(e)
                raise e

    raw = response.text.strip()

    # Parse into dict
    metrics = {}
    for line in raw.split("\n"):
        if ":" in line:
            key, _, value = line.partition(":")
            metrics[key.strip()] = value.strip()

    return {
        "raw_metrics": raw,
        "metrics": metrics,
        "image_path": image_path
    }