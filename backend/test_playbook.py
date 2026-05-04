from analyzer import analyze_reel
from playbook import generate_playbook

# Step 1: Analyze the reel
print("=== STEP 1: Analyzing Reel ===")
analysis = analyze_reel("downloads/DX3w7RqOsWE.mp4")

# Step 2: Generate Playbook
print("\n=== STEP 2: Generating Playbook ===")
playbook = generate_playbook(analysis["raw_analysis"])

print("\n=== VIRAL PLAYBOOK ===")
print(playbook["playbook"])