import os
import json

folder = "national-pokemon"
files = [f for f in os.listdir(folder) if f.endswith(".png")]
with open(os.path.join(folder, "index.json"), "w") as f:
    json.dump(files, f, indent=2)

print("✅ index.json generated")