import sys
import os
from dotenv import load_dotenv

# Load env before importing services that rely on os.getenv
load_dotenv()

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from services.gemini import GeminiService
import json

# Re-init service to pick up key
gemini_service = GeminiService()

def test_seo_prompt():
    print("🧪 Testing SEO Prompt (Language of the Street)...")
    
    # Sample Case: "Ustawa o pomocy obywatelom Ukrainy"
    # This is a classic example of bureaucratic title vs street intent.
    
    title = "Rządowy projekt ustawy o zmianie ustawy o pomocy obywatelom Ukrainy w związku z konfliktem zbrojnym na terytorium tego państwa oraz niektórych innych ustaw"
    description = "Projekt zakłada przedłużenie okresu legalnego pobytu obywateli Ukrainy do 30 września 2025 r. oraz powiązanie świadczenia 800+ z obowiązkiem szkolnym."
    content = "Art 1. W ustawie z dnia 12 marca 2022 r. wprowadza się zmiany... Art 2. Świadczenie wychowawcze przysługuje pod warunkiem realizacji obowiązku nauki..."
    
    print(f"\n📥 INPUT:")
    print(f"Title: {title}")
    print(f"Description: {description}")
    
    print("\n🔄 Generating Metadata...")
    result = gemini_service.generate_seo_metadata(title, description, content)
    
    print("\n📤 OUTPUT:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Check criteria
    if "uchodź" in str(result) or "Ukra" in str(result):
         print("\n✅ Semantic Relevance: PASS")
    else:
         print("\n❌ Semantic Relevance: FAIL")

if __name__ == "__main__":
    test_seo_prompt()
