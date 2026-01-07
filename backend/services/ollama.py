import requests
import json
import os

class OllamaService:
    def __init__(self, base_url="http://localhost:11434", model="qwen2.5:7b"):
        self.base_url = base_url
        self.model = model

    def analyze_legislative_text(self, title, text):
        """
        Sends legislative text to Ollama for structured analysis.
        """
        if not text:
            return None

        prompt = f"""
        Jesteś głównym procesorem ETL dla portalu otwartyparlament.pl. 
        Twoim zadaniem jest analiza polskiego projektu ustawy lub uzasadnienia.
        
        TYTUŁ: {title}
        TEKST: {text[:4000]} # Limit to 4k chars for local performance
        
        Zwróć wynik WYŁĄCZNIE w formacie JSON o następującej strukturze:
        {{
            "summary": "Krótkie streszczenie (TL;DR) dla obywatela (2-3 zdania).",
            "pros": ["zaleta 1", "zaleta 2"],
            "cons": ["wada 1", "wada 2"],
            "impact": "Kogo to dotyczy najbardziej?",
            "importance": 7
        }}
        
        Zasady:
        1. Używaj trybu przypuszczającego dla projektów ("Projekt zakłada...").
        2. Bądź merytoryczny i neutralny.
        3. Importance: 1-10 (10 to kluczowe zmiany ustrojowe/budżetowe).
        """

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=120 # Local AI can be slow
            )
            response.raise_for_status()
            
            result_raw = response.json().get("response", "")
            return json.loads(result_raw)
            
        except Exception as e:
            print(f"Error communicating with Ollama: {e}")
            return None

    def analyze_vote(self, title, text):
        """
        Sends vote text to Ollama for structured analysis.
        """
        if not text:
            return None

        prompt = f"""
        Jesteś głównym procesorem ETL dla portalu otwartyparlament.pl. 
        Twoim zadaniem jest analiza polskiego głosowania sejmowego.
        
        TYTUŁ/TEMAT: {title}
        OPIS/KONTEKST: {text[:4000]}
        
        Zwróć wynik WYŁĄCZNIE w formacie JSON o następującej strukturze:
        {{
            "summary": "Krótkie wyjaśnienie o co chodziło w tym głosowaniu (2-3 zdania).",
            "category": "JEDNA z kategorii: Gospodarka, Zdrowie, Obronność, Edukacja, Infrastruktura, Rolnictwo, Ustrój, Społeczeństwo, Proceduralne, Inne",
            "pros": ["argument za / skutek pozytywny 1", "argument za / skutek pozytywny 2"],
            "cons": ["argument przeciw / ryzyko 1", "argument przeciw / ryzyko 2"]
        }}
        
        Zasady:
        1. Bądź merytoryczny i neutralny.
        2. Kategoria "Proceduralne" jest dla głosowań technicznych (przerwy, odroczenia, zmiany w komisjach).
        3. Wyjaśnij prostym językiem znaczenie tego głosowania dla obywatela.
        """

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=120
            )
            response.raise_for_status()
            
            result_raw = response.json().get("response", "")
            return json.loads(result_raw)
            
        except Exception as e:
            print(f"Error communicating with Ollama: {e}")
            return None

ollama_service = OllamaService()
