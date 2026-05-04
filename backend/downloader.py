import yt_dlp
import os

DOWNLOAD_DIR = "downloads"

def validate_instagram_url(url: str) -> bool:
    """Validates that the URL is a legitimate Instagram reel URL."""
    import re
    pattern = r'^https?://(www\.)?instagram\.com/(reel|p)/[A-Za-z0-9_-]+/?'
    return bool(re.match(pattern, url))

def download_reel(url: str) -> str:
    if not validate_instagram_url(url):
        raise ValueError("Invalid Instagram URL")

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    options = {
    'outtmpl': f'{DOWNLOAD_DIR}/%(id)s.%(ext)s',
    'format': 'mp4/bestvideo+bestaudio/best',
    'quiet': True,
    'cookiefile': 'cookies.txt',
    }

    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(url, download=True)
        file_path = ydl.prepare_filename(info)
        return file_path