from backend.services.gemini import GeminiService
import json

def test_narrator():
    gemini = GeminiService()
    
    # Mock Scenario: Vote on Senate Veto
    title = "Głosowanie nad uchwałą Senatu w sprawie ustawy budżetowej"
    description = "Głosowanie nr 54. Rozstrzygnięcie w sprawie odrzucenia uchwały Senatu."
    
    # Mock History (passed as bill_text)
    history = """
    1. 20.09.2025 - Wpłynięcie projektu (Druk 1749)
    2. 15.11.2025 - I Czytanie
    3. 10.12.2025 - II Czytanie (Przyjęto poprawki)
    4. 12.12.2025 - III Czytanie (Ustawa uchwalona)
    5. 15.01.2026 - Uchwała Senatu (Odrzucenie ustawy w całości)
    """
    
    print("🧠 Testing AI Narrator with 'Senate Veto' scenario...")
    
    result = gemini.analyze_expert(
        title=title,
        description=description,
        bill_text=history,
        doc_type="process_context"
    )
    
    if result:
        print("\n✅ Valid Response:\n")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # Validation
        if "procedural_context" not in result:
             print("❌ key 'procedural_context' missing!")
        if "legal_consequence" not in result:
            print("❌ key 'legal_consequence' missing!")
    else:
        print("❌ AI returned None (Check logs)")

if __name__ == "__main__":
    test_narrator()
