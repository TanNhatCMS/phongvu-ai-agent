import urllib.request
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RAG_DIR = os.path.join(SCRIPT_DIR, "..", "..", "..", "rag-data")
URL = "https://help.phongvu.vn/llms-full.txt"

print(f"Downloading {URL}...")
req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=60) as response:
    content = response.read().decode("utf-8")

print(f"Downloaded: {len(content)} bytes")

# Fix relative image URLs
# /files/xxx -> https://help.phongvu.vn/files/xxx
content = content.replace("](/files/", "](https://help.phongvu.vn/files/")
content = content.replace('src="/files/', 'src="https://help.phongvu.vn/files/')

# Count fixed links
fixed_count = content.count("help.phongvu.vn/files/")
print(f"Fixed image/file URLs: {fixed_count}")

# Save
filepath = os.path.join(RAG_DIR, "phongvu-help-full.md")
with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Saved to: {filepath}")
