
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
        # Models configuration (Verified Jan 2026)
        self.model_flash = 'gemini-2.0-flash'        
        self.model_pro = 'gemini-2.0-flash'          # 2.0 Flash is very capable
        self.model_lite = 'gemini-2.0-flash-lite'
        
        # Re-configure to be safe
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_flash)
        else:
            self.model = None

    def _get_model(self, model_name: str):
        if not self.api_key: return None
        return genai.GenerativeModel(model_name)

    def generate_simple_title(self, original_title: str, description: str = "", bill_content: str = "") -> str:
        """
        Generates a simplified, human-readable title for a vote using Gemini.
        """
        if not self.model:
            return original_title

        try:
            # Construct the prompt
            base_prompt = (
                "Jesteś analitykiem prawnym i redaktorem w serwisie 'Otwarty Parlament'. "
                "Twoim zadaniem jest przetłumaczenie biurokratycznego tytułu głosowania na ZROZUMIAŁY JĘZYK DLA ZWYKŁEGO OBYWATELA.\n\n"
            )

            context_part = ""
            if bill_content:
                # Truncate content if too long (Gemini Free tier limits, though 1.5 is generous)
                # Let's keep it safe at ~20k chars for now ensures speed and relevance
                truncated_content = bill_content[:20000]
                context_part = f"Oto PEŁNA TREŚĆ USTAWY (fragment):\n---\n{truncated_content}\n---\n\n"
            elif description:
                context_part = f"Oto opis głosowania:\n---\n{description}\n---\n\n"

            instruction_part = (
                f"Oryginalny tytuł biurokratyczny: '{original_title}'\n\n"
                "Instrukcja:\n"
                "1. Napisz KRÓTKI tytuł (maksymalnie 10 słów).\n"
                "2. BEZWZGLĘDNIE POMIŃ numery punktów (np. 'Pkt. 21', 'Punkt 5') oraz techniczne nagłówki (np. 'Sprawozdanie Komisji', 'Piersze czytanie').\n"
                "3. Pomiń słowa 'głosowanie nad...', 'ustawa o zmianie ustawy...', 'rządowy projekt...'.\n"
                "4. Napisz SEDNO zmiany. Co to zmienia w życiu ludzi? Np. 'Podwyżka 800+', 'Wakacje kredytowe', 'Nowe zasady wycinki drzew'.\n"
                "5. Jeśli to techniczna/proceduralna zmiana, napisz to wprost, np. 'Zmiany w procedurze sądowej'.\n"
                "6. NIE używaj cudzysłowów w wyniku.\n\n"
                "Wynik (tylko tytuł):"
            )

            full_prompt = base_prompt + context_part + instruction_part
            
            model = self._get_model(self.model_flash)
            response = model.generate_content(full_prompt)
            
            if response.text:
                 return response.text.strip().replace('"', '').replace("'", "")
            return original_title
            
        except Exception as e:
            logger.error(f"Error generating title with Gemini: {e}")
            return original_title

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

    def _is_valuable_vote(self, title: str) -> bool:
        """
        Filters out procedural/technical votes to save costs.
        """
        technical_keywords = [
            "przerwy w obradach",
            "odroczenia obrad",
            "uzupełnienia porządku",
            "przyjęcie porządku",
            "wniosek formalny",
            "zamknięcie posiedzenia",
            "wybór sekretarzy",
            "zmiana w składzie komisji",
            "ślubowanie poselskie"
        ]
        title_lower = title.lower()
        if any(k in title_lower for k in technical_keywords):
            logger.info(f"🚫 Vote '{title}' skipped (Technical/Procedural).")
            return False
        return True

    def _smart_chunk_text(self, text: str, max_chars: int = 50000) -> str:
        """
        Intelligently truncates text, prioritizing:
        1. Title/Header (First 2000 chars)
        2. Justification (Uzasadnienie) - if found
        3. OSR (Ocena Skutków Regulacji)
        4. Actual Articles
        """
        if not text: return ""
        if len(text) < max_chars: return text
        
        # Priority 1: Head
        head = text[:2000]
        
        # Priority 2: Justification
        justification = ""
        if "uzasadnienie" in text.lower():
            start = text.lower().find("uzasadnienie")
            justification = text[start:start+15000] # Take 15k chars of justification
            
        # Priority 3: Middle/End
        remaining_budget = max_chars - len(head) - len(justification)
        body = text[2000:2000+remaining_budget]
        
        return f"{head}\n\n[...]\n\n{justification}\n\n[...]\n\n{body}"

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
        TREŚĆ: {{bill_text}}
        
        Zwróć JSON (Wartości w JSON muszą być po POLSKU):
        {{{{
            "summary_citizen": "Podsumowanie dla obywatela (MINIMUM 6-8 DŁUGICH, TREŚCIWYCH ZDAŃ). Opisz dokładnie mechanizm zmiany i jej wpływ na życie. Unikaj ogólników.",
            "summary_expert": "Głęboka analiza ekspercka (MINIMUM 25-30 ROZBUDOWANYCH ZDAŃ). Styl analityczny, bogaty w terminologię prawniczą. STRUKTURA: 1. Geneza i kontekst prawny. 2. SZCZEGÓŁOWA LISTA ZMIAN (-). 3. ANALIZA BUDŻETOWA I GOSPODARCZA. 4. SKUTKI DŁUGOFALOWE. MUSI BYĆ BARDZO OBSZERNE.",
            "street_title": "Krótki, chwytliwy tytuł (max 10 słów, bez numerów druków). Np. 'Wakacje Kredytowe 2024'.",
            "category": "Jedna z: Gospodarka, Zdrowie, Obronność, Edukacja, Ustrój, Inne",
            "importance_score": 1-10,
            "pros": ["Argument ZA 1 (konkretny)", "Argument ZA 2 (konkretny)"],
            "cons": ["Argument PRZECIW 1 (konkretny)", "Argument PRZECIW 2 (konkretny)"],
            "personas": {{{{
                "Przedsiębiorca": "Wpływ szczegółowy.",
                "Pracownik": "Wpływ szczegółowy.",
                "Rolnik": "Wpływ szczegółowy.",
                "Emeryt": "Wpływ szczegółowy.",
                "Student": "Wpływ szczegółowy.",
                "Rodzic": "Wpływ szczegółowy."
            }}}},
            "meta_description": "Opis SEO (max 160 znaków) dla Google.",
            "keywords": ["słowo kluczowe 1", "słowo kluczowe 2"],
            "tags": ["Tag 1", "Tag 2", "Tag 3"]
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
            
        if self._assess_complexity(title, description, bill_text) == "HIGH":
             base_prompt += "\\nUWAGA: To jest kluczowy dokument. Dokładnie przeanalizuj wpływ finansowy."
        
        # Prepare content safely
        bill_text_safe = bill_text[:100000] if bill_text else "BRAK - Analizuj tylko na podstawie tytułu i opisu."
            
        return base_prompt.format(context_word=context_word, title=title, description=description, bill_text=bill_text_safe)

    def generate_summary(self, bill_content: str, title: str = "") -> Dict[str, str]:
        """
        Generates dual-layer summary (Simple + Expert).
        """
        if not self.model: return {"simple": "Brak.", "expert": "Brak."}
        try:
            prompt = (
                "Jesteś ekspertem legislacyjnym. Przeanalizuj ustawę i stwórz DWA podsumowania.\n\n"
                "1. PODSUMOWANIE PROSTE (Dla obywatela):\n"
                "- 2-3 zdania prostym językiem.\n"
                "- Bez cytatów, bez technicznego żargonu.\n"
                "- Skup się na tym: 'Co to dla mnie zmienia?'\n\n"
                "2. PODSUMOWANIE EKSPERCKIE (Dla profesjonalisty):\n"
                "- Styl punktowy (myślniki).\n"
                "- Konkretne odnośniki do artykułów (np. 'zgodnie z art. 15').\n"
                "- Kontekst prawny i polityczny.\n\n"
                f"Tytuł: {title}\n"
                f"Treść ustawy (fragment):\n{bill_content[:30000]}\n\n"
                "Zwróć wynik wyłącznie jako JSON (pola 'simple' i 'expert' muszą być zwykłymi tekstami/stringami):\n"
                "{\n"
                "  \"simple\": \"podsumowanie dla obywatela...\",\n"
                "  \"expert\": \"szczegółowa analiza z myślnikami (-)...\"\n"
                "}"
            )
            model = self._get_model(self.model_flash)
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini Dual Summary Error: {e}")
            return {"simple": "Błąd.", "expert": "Błąd."}

    def generate_pros_cons(self, bill_content: str) -> Dict[str, Any]:
        """
        Expert Pros & Cons with 'Confidence Score' and 'Source Citation'.
        """
        if not self.model: return {"pros": [], "cons": []}
        try:
            prompt = (
                "Jesteś bezstronnym analitykiem. Przeanalizuj treść ustawy i podaj 3 argumenty ZA oraz 3 argumenty PRZECIW.\n"
                "Dla każdego argumentu podaj KRÓTKIE uzasadnienie oparte na konkretnym zapisie ustawy.\n"
                "Dodatkowo oceń swój stopień pewności co do tej analizy (confidence_score 0-100) na podstawie "
                "jasności zapisów prawnych.\n\n"
                "Zwróć wynik wyłącznie jako JSON:\n"
                "{\n"
                "  \"pros\": [\"Argument ZA: Opis (na podst. art. X)\"],\n"
                "  \"cons\": [\"Argument PRZECIW: Opis (ryzyko Y)\"],\n"
                "  \"confidence_score\": 95,\n"
                "  \"expert_comment\": \"Krótki komentarz o stopniu skomplikowania aktu.\"\n"
                "}\n\n"
                f"Treść ustawy:\n{bill_content[:30000]}"
            )
            model = self._get_model(self.model_flash)
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini Pros/Cons Error: {e}")
            return {"pros": [], "cons": []}

    def generate_seo_metadata(self, title: str, description: str, bill_content: str = "") -> Dict[str, Any]:
        """
        Generates SEO metadata (Street Title, Meta Description, Keywords) for Programmatic SEO.
        "Language of the Street" Prompt.
        """
        if not self.model: return {"street_title": title, "meta_description": "", "keywords": []}
        
        try:
            prompt = (
                "Jesteś ekspertem SEO i redaktorem serwisu 'Otwarty Parlament'. "
                "Twoim zadaniem jest przetłumaczenie języka urzędniczego na 'Język Ulicy' (to, co ludzie wpisują w Google).\n\n"
                
                "DANE WEJŚCIOWE:\n"
                f"Tytuł oryginalny: {title}\n"
                f"Opis: {description}\n"
                f"Treść (fragment): {bill_content[:15000]}\n\n"
                
                "ZASADY (Semantic Bridge):\n"
                "1. STREET TITLE: Zapomnij o 'ustawie o zmianie ustawy'. Napisz to tak, jak nagłówek w Fakcie lub na Onecie, ale BEZ clickbaitu (tylko prawda). Np. 'Wakacje Kredytowe 2024 - Zasady'.\n"
                "2. META DESCRIPTION: 150-160 znaków. Musi odpowiadać na pytanie 'Co to zmienia dla mnie?'. Zachęć do kliknięcia.\n"
                "3. KEYWORDS: 5-8 fraz, które ludzie wpisują w Google szukając tego tematu (synonimy potoczne).\n\n"
                
                "Zwróć JSON:\n"
                "{\n"
                "  \"street_title\": \"Human-Readable Title (krótki, mocny)\",\n"
                "  \"meta_description\": \"SEO Meta Description (<160 chars)\",\n"
                "  \"keywords\": [\"fraza 1\", \"fraza 2\", \"..\"],\n"
                "  \"topic_category\": \"Ogólna kategoria (np. Zdrowie, Finanse)\"\n"
                "}"
            )
            
            model = self._get_model(self.model_flash)
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
            
        except Exception as e:
            logger.error(f"Generate SEO Metadata Error: {e}")
            return {"street_title": title, "meta_description": "", "keywords": []}

    def generate_mp_bio(self, mp_data: Dict[str, Any], stats_summary: str = "") -> str:
        """
        Generates a neutral, factual biography for an MP.
        """
        if not self.model: return ""
        
        name = f"{mp_data.get('first_name', '')} {mp_data.get('last_name', '')}"
        club = mp_data.get('club', '')
        
        prompt = f"""
        Jesteś obiektywnym biograferem parlamentarnym. Twoim zadaniem jest napisanie krótkiej, neutralnej notki biograficznej ("życiorysu") dla posła na Sejm RP.
        
        DANE OSOBOWE:
        - Imię i nazwisko: {name}
        - Klub/Ugrupowanie: {club}
        - Data urodzenia: {mp_data.get('birth_date')}
        - Miejsce urodzenia: {mp_data.get('birth_location')}
        - Wykształcenie: {mp_data.get('education_level')} (szczegóły: {mp_data.get('education_history')})
        - Zawód: {mp_data.get('profession')}
        
        DANE O AKTYWNOŚCI:
        {stats_summary}
        
        WYTYCZNE (TON: ENCYKLOPEDYCZNY, NEUTRALNY):
        1. JĘZYK: Polski. Pisz poprawną polszczyzną.
        2. KLUBU/PARTIE: Używaj pełnych nazw (Koalicja Obywatelska, Prawo i Sprawiedliwość, Trzecia Droga, Polska 2050, Polskie Stronnictwo Ludowe, Konfederacja, Nowa Lewica).
        3. Struktura:
           - Akapit 1: Urodzenie, wykształcenie, polityczne zakorzenienie.
           - Akapit 2: Główne pola aktywności i statystyki.
        4. NIE HALUCYNUJ. Jeśli czegoś nie wiesz, napisz "Brak szczegółowych danych".
        
        Zwróć wynik jako JSON:
        {{
            "biography": "Treść biogramu..."
        }}
        """
        
        try:
            model = self._get_model(self.model_flash)
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text).get("biography", "")
        except Exception as e:
            logger.error(f"Generate MP Bio Error: {e}")
            return ""

    def compare_titles(self, title1: str, title2: str) -> bool:
        """
        Determines if two titles refer to the same legislative project/act/process.
        Handles variations like "Zmiana ustawy..." vs "Nowelizacja ustawy...".
        """
        if not self.model: return False
        
        for attempt in range(3):
            try:
                prompt = (
                    "Jesteś ekspertem legislacyjnym. Twoim zadaniem jest ocena, czy dwa tytuły głosowań dotyczą TEGO SAMEGO procesu legislacyjnego (tzn. tej samej nowelizacji/ustawy).\n\n"
                    f"Tytuł 1: {title1}\n"
                    f"Tytuł 2: {title2}\n\n"
                    "ZASADY:\n"
                    "1. Ignoruj różnice proceduralne (np. 'Wniosek o odrzucenie' vs 'Całość projektu').\n"
                    "2. Ignoruj synonimy (np. 'Zmiana' = 'Nowelizacja').\n"
                    "3. Ignoruj drobne różnice w formacie.\n"
                    "4. Jeśli dotyczą RÓŻNYCH ustaw (np. 'Ustawa o podatku VAT' vs 'Ustawa o podatku PIT'), zwróć FAŁSZ.\n\n"
                    "Zwróć TYLKO słowo 'TAK' lub 'NIE'."
                )
                
                model = self._get_model(self.model_flash)
                response = model.generate_content(prompt)
                text = response.text.strip().upper()
                
                # Success - return result
                return "TAK" in text
            
            except Exception as e:
                if "429" in str(e):
                    wait_time = (attempt + 1) * 2 # 2s, 4s, 6s
                    logger.warning(f"Gemini Rate Limit (429). Retrying in {wait_time}s...")
                    import time
                    time.sleep(wait_time)
                else:
                    logger.error(f"Gemini Compare Titles Error: {e}")
                    return False
        
        return False

gemini_service = GeminiService()
