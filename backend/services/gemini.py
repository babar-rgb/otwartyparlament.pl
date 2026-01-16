
import os
import google.generativeai as genai
import json
import logging
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("services.gemini")

# Configure API Key securely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found. Expert mode will be disabled.")

class GeminiService:
    def __init__(self):
        # Models configuration (January 2026 specs)
        self.model_flash = 'gemini-2.0-flash-lite'   # Standard (Newest Lite model)
        self.model_pro = 'gemini-2.0-flash-lite'     # Forcing Lite for cost/speed
        self.model_lite = 'gemini-2.0-flash-lite'    # Forcing Lite

    def _get_model(self, model_name: str):
        return genai.GenerativeModel(model_name)

    def analyze_expert(self, title: str, description: str, bill_text: Optional[str] = None, doc_type: str = "vote") -> Dict[str, Any]:
        """
        Expert analysis for Votes, Bills, or Interpellations.
        doc_type: 'vote', 'bill', 'interpellation'
        """
        complexity = self._assess_complexity(title, description, bill_text)
        
        if complexity == "HIGH":
            model_name = self.model_pro
            logger.info(f"🧠 Using EXPERT model ({model_name}) due to high complexity.")
        elif complexity == "LOW":
            model_name = self.model_lite
            logger.info(f"⚡ Using LITE model ({model_name}) for simple task.")
        else:
            model_name = self.model_flash
            logger.info(f"🚀 Using FLASH model ({model_name}) for standard task.")

        prompt = self._build_prompt(title, description, bill_text, complexity, doc_type)
        
        try:
            model = self._get_model(model_name)
            # Response validation ensuring JSON
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            # Log Usage Stats
            if response.usage_metadata:
                u = response.usage_metadata
                logger.info(f"💰 [GEMINI USAGE] Model: {model_name} | Input: {u.prompt_token_count} tokens | Output: {u.candidates_token_count} tokens")
            
            return json.loads(response.text)
            
        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            return None

    # Alias for backward compatibility (temporarily)
    def analyze_vote_expert(self, title: str, description: str, bill_text: Optional[str] = None) -> Dict[str, Any]:
        return self.analyze_expert(title, description, bill_text, doc_type="vote")

    def _assess_complexity(self, title: str, description: str, bill_text: Optional[str]) -> str:
        """
        Heuristic to decide complexity.
        """
        text_len = len(description or "") + len(bill_text or "")
        
        # Keywords triggering Pro model
        critical_keywords = ["podat", "ustrój", "konstytuc", "budżet", "trybunał"]
        is_critical = any(k in title.lower() for k in critical_keywords)
        
        if is_critical or text_len > 50000: # Very long or critical -> PRO
            return "HIGH"
        elif text_len < 1000: # Very short -> LITE
            return "LOW"
        else:
            return "MEDIUM" # Standard -> FLASH

    def _build_prompt(self, title, description, bill_text, complexity, doc_type="vote"):
        
        context_word = "głosowania" if doc_type == "vote" else "dokumentu"
        if doc_type == "bill": context_word = "projektu ustawy/druku"
        if doc_type == "interpellation": context_word = "interpelacji poselskiej"
        if doc_type == "process_context": context_word = "etapu legislacyjnego"

        base_prompt = f"""
        Jesteś bezstronnym analitykiem sejmowym OtwartyParlament.pl.
        Twoim zadaniem jest dostarczenie surowej, obiektywnej analizy prawnej i ekonomicznej tego {{context_word}}.
        
        WAŻNE: CAŁA ODPOWIEDŹ MUSI BYĆ W JĘZYKU POLSKIM (POLISH).
        
        ZASADY:
        1. Zachowaj absolutną neutralność polityczną.
        2. STYL: Ekspercki, pogłębiony, "śledczy".
        3. KLUCZOWE: Odwołuj się bezpośrednio do numerów druków i treści dokumentów.
        4. Wykaż relację między dokumentem a stanem prawnym (co się zmienia?).
        5. Cytuj konkretne kwoty i nazwy programów, jeśli występują w tekście.
        
        JAKOŚĆ I POKRYCIE:
        - UNIKAJ POWTÓRZEŃ.
        - UNIKAJ BANALNYCH WNIOSKÓW.
        - ZALETY I WADY (BARDZO WAŻNE): 
            * W "Zaletach" wymień KONKRETNE grupy/programy (np. "Wsparcie dla Szpitala w Bydgoszczy", "100 mln na Aktywnych Seniorów").
            * W "Wadach" wymień KONKRETNE instytucje/ryzyka (np. "Cięcia w budżecie IPN", "Ryzyko inflacyjne").
            * ZAKAZ używania ogólników.
        
        DANE WEJŚCIOWE:
        TYTUŁ: {{title}}
        OPIS: {{description}}
        TREŚĆ: {{bill_text[:100000] if bill_text else "BRAK - Analizuj tylko na podstawie tytułu i opisu."}}
        
        Zwróć JSON (Wartosci w JSON muszą być po POLSKU):
        {{{{
            "summary": "Analiza merytoryczna (MINIMUM 10 zdań). Użyj myślników (-) do wylistowania kluczowych punktów. STRUKTURA: 1. Kontekst. 2. LISTA ZMIAN (-). 3. Skutki.",
            "category": "Jedna z: Gospodarka, Zdrowie, Obronność, Edukacja, Ustrój, Inne",
            "importance_score": 1-10 (10=Kluczowa Refoma, 1=Korekta techniczna),
            "pros": ["Zaleta 1", "Zaleta 2"],
            "cons": ["Wada 1", "Wada 2"],
            "personas": {{{{
                "Przedsiębiorca": "Wpływ.",
                "Pracownik": "Wpływ.",
                "Rolnik": "Wpływ.",
                "Emeryt": "Wpływ.",
                "Student": "Wpływ.",
                "Rodzic": "Wpływ."
            }}}}
        }}}}
        """

        if doc_type == "process_context":
            base_prompt = f"""
            Jesteś ekspertem legislacyjnym Kancelarii Sejmu.
            Twoim zadaniem jest wyjaśnienie obecnego ETAPU PROCESU LEGISLACYJNEGO.
            
            KONTEKST (Oś Czasu):
            {{bill_text}}

            OBECNY ETAP: {{title}} ({{description}})

            KLUCZOWE WYMOGI (TON: PROFESJONALNY, NEUTRALNY, PRAWNICZY):
            1. Wyjaśnij, co proceduralnie oznacza ten etap (np. "Jest to głosowanie nad uchwałą Senatu").
            2. Wyjaśnij wymogi większości (zwykła, bezwzględna, 3/5) jeśli dotyczy.
            3. Wyjaśnij skutki prawne (np. "Odrzucenie weta oznacza wejście ustawy w życie").
            4. ŻADNYCH OCEN i EMOCJI. ("Ważny moment", "Dramatyczne głosowanie" -> ZAKAZANE).
            
            Zwróć JSON:
            {{{{
                "procedural_context": "Zwięzłe wyjaśnienie proceduralne (max 3 zdania). Skup się na mechanice procesu.",
                "legal_consequence": "Co się stanie po głosowaniu ZA, a co po PRZECIW."
            }}}}
            """
            return base_prompt.format(title=title, description=description, bill_text=bill_text)
         
        
        if doc_type == "vote":
            base_prompt += "\\nJEŚLI GŁOSOWANIE JEST TECHNICZNE (przerwa, odroczenie): Zwróć summary='Głosowanie techniczne.' i puste listy pros/cons."
            
        if complexity == "HIGH":
            base_prompt += "\\nUWAGA: To jest kluczowy dokument. Dokładnie przeanalizuj wpływ finansowy."
            
        return base_prompt.format(context_word=context_word, title=title, description=description, bill_text=bill_text)

gemini_service = GeminiService()
