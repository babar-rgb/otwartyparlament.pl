
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
        self.model_flash = 'gemini-2.0-flash-exp' # Fast, Cheap ($0.10/1M)
        self.model_pro = 'gemini-1.5-pro'     # Expert, Expensive ($1.20/1M)
        self.model_lite = 'gemini-1.5-flash-8b' # Ultra-cheap ($0.03/1M)

    def _get_model(self, model_name: str):
        return genai.GenerativeModel(model_name)

    def analyze_vote_expert(self, title: str, description: str, bill_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Expert analysis using Intelligent Router.
        Decides which model to use based on input complexity.
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

        prompt = self._build_prompt(title, description, bill_text, complexity)
        
        try:
            model = self._get_model(model_name)
            # Response validation ensuring JSON
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
            
        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            return None

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

    def _build_prompt(self, title, description, bill_text, complexity):
        base_prompt = f"""
        Jesteś ekspertem legislacyjnym OtwartyParlament.pl.
        Przeanalizuj to głosowanie i/lub ustawę.
        
        TYTUŁ: {title}
        OPIS: {description}
        TREŚĆ USTAWY: {bill_text[:100000] if bill_text else "BRAK"}
        
        Zwróć JSON:
        {{
            "summary": "Merytoryczne streszczenie (TL;DR).",
            "category": "Jedna z: Gospodarka, Zdrowie, Obronność, Edukacja, Ustrój, Inne",
            "importance_score": 1-10 (gdzie 10 to zmiana ustrojowa/podatkowa, 1 to techniczna),
            "justification": "Dlaczego taka ocena wagi?",
            "impact": "Kto zyska, kto straci (konkretne grupy społeczne)."
        }}
        """
        
        if complexity == "HIGH":
            base_prompt += "\nUWAGA: To jest kluczowe głosowanie. Skup się na ukrytych ryzykach prawnych i kruczkach."
            
        return base_prompt

gemini_service = GeminiService()
