from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def generate_playbook(raw_analysis: str) -> dict:
    """Single reel playbook — used for quick analysis."""

    prompt = f"""
Based on the following reel analysis, generate a personalized Viral Playbook.

REEL ANALYSIS:
{raw_analysis}

Generate a structured Viral Playbook with:
1. HOOK FORMULA: 3 ready-to-use hook templates
2. CONTENT STRUCTURE TEMPLATE: Exact structure for maximum retention
3. BEST POSTING STRATEGY: What to post more of
4. VIRAL TRIGGERS TO USE: 5 specific viral triggers
5. WHAT TO AVOID: 3 things to stop doing
6. NEXT 3 REEL IDEAS: Specific ideas based on their niche
"""

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt]
            )
            break
        except Exception as e:
            if "503" in str(e) and attempt < 2:
                import time
                print(f"Gemini overloaded, retrying in 10s... (attempt {attempt + 1})")
                time.sleep(10)
            else:
                raise e

    return {"playbook": response.text}


def generate_creator_report(best_reels: list, worst_reels: list) -> dict:
    """
    Cross-references best and worst performing reels to generate
    a full Creator Strategy Report.

    Args:
        best_reels: list of dicts with analysis + metrics for best reels
        worst_reels: list of dicts with analysis + metrics for worst reels

    Returns:
        dict with full creator report
    """
    print("Generating Creator Report...")

    best_formatted = ""
    for i, reel in enumerate(best_reels, 1):
        best_formatted += f"""
--- BEST REEL {i} ---
METRICS: {reel.get('metrics', 'N/A')}
ANALYSIS: {reel.get('analysis', 'N/A')}
"""

    worst_formatted = ""
    for i, reel in enumerate(worst_reels, 1):
        worst_formatted += f"""
--- WORST REEL {i} ---
METRICS: {reel.get('metrics', 'N/A')}
ANALYSIS: {reel.get('analysis', 'N/A')}
"""

    prompt = f"""
You are an expert Instagram growth strategist. Analyze this creator's best and worst performing reels and generate a detailed Creator Strategy Report.

BEST PERFORMING REELS (High Views/Reach/Saves):
{best_formatted}

WORST PERFORMING REELS (Low Views/Reach/Saves):
{worst_formatted}

Generate a comprehensive Creator Strategy Report with these exact sections:

## 1. CREATOR SIGNATURE
What makes this creator's content uniquely theirs? Their voice, style, strengths, and personal brand fingerprint.

## 2. WHAT'S WORKING
Best hook styles, content themes and formats that are performing well. Include specific examples from their best reels and explain WHY they're working.

## 3. WHAT'S NOT WORKING
Common patterns in low performing reels. What specific mistakes keep appearing? What is the audience NOT responding to?

## 4. THE GAP
The specific, concrete difference between their best and worst performers. This should be data-driven and brutally honest.

## 5. ACTION PLAN — NEXT 5 REELS
Concrete, specific reel ideas they can film this week. For each reel include:
- Exact hook (word for word)
- Content structure (what to say/show in each section)
- Why this will perform better based on their data

Be specific, data-driven, and actionable. Refer to their actual content patterns throughout.
"""

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[prompt]
            )
            break
        except Exception as e:
            if "503" in str(e) and attempt < 2:
                import time
                print(f"Gemini overloaded, retrying in 10s... (attempt {attempt + 1})")
                time.sleep(10)
            else:
                raise e

    return {"report": response.text}