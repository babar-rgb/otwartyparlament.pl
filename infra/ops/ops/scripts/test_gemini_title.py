import os
import json
from dotenv import load_dotenv
load_dotenv("/Users/kajtek/sejm/git/parlament/.env")

from backend.services.gemini import GeminiService

def test():
    gemini = GeminiService()
    title = "Sprawozdanie Komisji o rządowym projekcie ustawy budżetowej na rok 2025"
    desc = "Głosowanie nad projektem budżetu."
    
    print("🤖 Calling Gemini...")
    result = gemini.analyze_vote_expert(title, desc)
    
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test()
