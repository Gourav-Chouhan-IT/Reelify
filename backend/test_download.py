from downloader import download_reel

url = "https://www.instagram.com/reel/DX3w7RqOsWE/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ=="  # paste any public reel URL here
path = download_reel(url)
print(f"Downloaded to: {path}")