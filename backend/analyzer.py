from google import genai
import os
from dotenv import load_dotenv
import time

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

PROMPT = """
Analyze this Instagram Reel carefully and return a structured analysis.

First, identify the REEL TYPE:
- TALKING HEAD (person speaking to camera)
- VOICEOVER (narration over visuals)
- TEXT ONLY (on-screen text, no speech)
- TRANSITION/OUTFIT (visual style, no speech)
- GRWM/LIFESTYLE (get ready with me, day in life)
- DANCE/TREND (music + movement)
- TUTORIAL (step by step demonstration)
- MIXED (combination of above)

Then based on the reel type, analyze:

1. HOOK STYLE: What happens in the first 3 seconds to grab attention?
   (for visual reels: what visual element hooks the viewer?)
   (for talking reels: what is said or shown?)

2. CONTENT STRUCTURE: How is the reel structured from start to finish?

3. TRANSCRIPT/TEXT:
   - If speech exists: provide full transcript
   - If text on screen exists: provide all on-screen text
   - If no speech or text: write "VISUAL ONLY" and describe what happens

4. TONE: (educational/entertaining/motivational/aspirational/aesthetic/humorous)

5. VIRAL ELEMENTS: What makes this reel potentially viral?
   (music choice, visual appeal, relatability, trend usage, transformation etc.)

6. NICHE: What niche/topic does this reel belong to?

7. VISUAL STYLE: Describe the editing style, transitions, pacing, and aesthetics.
"""


def analyze_reel(video_path: str) -> dict:
    """
    Uploads a reel to Gemini and returns structured analysis.

    Args:
        video_path: Local path to the downloaded reel video file

    Returns:
        dict with raw_analysis (str) and video_path (str)
    """
    model_name = "gemini-2.5-flash"

    print(f"Uploading video: {video_path}")
    video_file = client.files.upload(file=video_path)
    print("Upload done. Waiting for file to be ready...")

    # Wait until file is ACTIVE
    while video_file.state.name == "PROCESSING":
        print("Processing...")
        time.sleep(3)
        video_file = client.files.get(name=video_file.name)

    if video_file.state.name == "FAILED":
        raise ValueError("File processing failed!")

    print("File ready! Analyzing...")

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[video_file, PROMPT]
            )
            break
        except Exception as e:
            if "503" in str(e) and attempt < 2:
                print(f"Gemini overloaded, retrying in 10s... (attempt {attempt + 1})")
                time.sleep(10)
            else:
                raise e

    return {
        "raw_analysis": response.text,
        "video_path": video_path
    }