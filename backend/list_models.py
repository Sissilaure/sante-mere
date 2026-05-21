import json
import os
import urllib.request
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise RuntimeError("OPENROUTER_API_KEY manquante")

print("Clé utilisée :", api_key[:10], "...")

request = urllib.request.Request(
    "https://api.openrouter.ai/v1/models",
    headers={
        "Authorization": f"Bearer {api_key}",
    },
)
with urllib.request.urlopen(request, timeout=30) as response:
    body = response.read().decode("utf-8")
    data = json.loads(body)

print("\nListe des modèles disponibles :")
for model in data.get("data", []):
    print(f"- {model.get('id', model)}")