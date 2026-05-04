from analyzer import analyze_reel

# use the path that was printed when you ran test_download.py
path = "downloads/DX3w7RqOsWE.mp4"  
result = analyze_reel(path)
print(result["raw_analysis"])