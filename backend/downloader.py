import yt_dlp
import os

DOWNLOAD_DIR = "downloads"

def download_reel(url: str) -> str:
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