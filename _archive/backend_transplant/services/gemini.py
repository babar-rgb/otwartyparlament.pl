
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
        
        Args:
            original_title (str): The official, bureaucratic title from Sejm API.
            description (str, optional): Additional description.
            bill_content (str, optional): Full text of the bill (truncated automatically).
            
        Returns:
            str: A short, punchy title (e.g. "Wakacje Kredytowe") or original if AI fails.
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
                "1. Napisz BARDZO KRÓTKI tytuł (maksymalnie 8 słów).\n"
                "2. BEZWZGLĘDNIE I KATEGORYCZNIE POMIŃ: numery punktów (np. 'Pkt. 21', 'Punkt 5'), numery druków (np. 'druk nr...'), techniczne nagłówki (np. 'Sprawozdanie Komisji', 'Piersze czytanie', 'Uchwała Senatu').\n"
                "3. Pomiń słowa 'głosowanie nad...', 'ustawa o zmianie ustawy...', 'rządowy projekt...', 'o zmianie ustawy...'.\n"
                "4. Napisz SEDNO zmiany. Co to zmienia w życiu ludzi? Używaj języka potocznego, ale godnego. Np. 'Podwyżka 800+', 'Wakacje kredytowe', 'Nowe zasady wycinki drzew', 'Kryptoaktywa: nowe regulacje'.\n"
                "5. Jeśli to techniczna/proceduralna zmiana, napisz to wprost, np. 'Zmiany w procedurze sądowej', 'Nowy sędzia Trybunału Konstytucyjnego'.\n"
                "6. NIE używaj cudzysłowów ani kropek na końcu.\n\n"
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

    def summarize_interpellation(self, title: str, content: str) -> str:
        """
        Generates a short, 3-4 sentence summary of a parliamentary interpellation.
        """
        if not self.model:
            return ""

        try:
            base_prompt = (
                "Jesteś niezależnym asystentem analitycznym. Twoim zadaniem jest przekształcić "
                "długą i urzędową treść interpelacji poselskiej na przystępne, zwięzłe podsumowanie dla obywateli.\n"
            )

            # Limit content size to avoid sending too much text
            truncated_content = content[:30000] if content else ""
            
            context_part = f"Tytuł interpelacji: {title}\n\nTreść interpelacji:\n---\n{truncated_content}\n---\n\n"
            
            instruction_part = (
                "Instrukcja:\n"
                "1. Napisz BARDZO KRÓTKIE podsumowanie, składające się z maksymalnie 3-4 zwięzłych zdań.\n"
                "2. Opisz w nim krótko: Czego dotyczy problem? O co konkretnie pyta lub wnosi poseł?\n"
                "3. Używaj języka neutralnego i zrozumiałego (bez żargonu urzędowego, unikaj np. 'oraz zważywszy na fakt').\n"
                "4. Podsumowanie zwróć jako czysty tekst. Nie używaj znaczników Markdown ani pogrubień.\n"
                "5. Uderzaj od razu w sedno sprawy (np. 'Posłowie zwracają uwagę na problem...', 'Interpelacja dotyczy...', itp.).\n\n"
                "Wynik (tylko tekst podsumowania):"
            )

            full_prompt = base_prompt + context_part + instruction_part
            
            model = self._get_model(self.model_flash)
            response = model.generate_content(full_prompt)
            
            if response.text:
                 return response.text.strip()
            return ""
            
        except Exception as e:
            logger.error(f"Error summarizing interpellation with Gemini: {e}")
            return ""

    def analyze_expert(self, title: str, description: str, bill_text: Optional[str] = None, doc_type: str = "vote") -> Dict[str, Any]:
        """
        Performs a deep expert analysis of a legislative document.
        
        Selects the appropriate model (Flash/Pro) based on complexity.
        Generates a JSON report containing summaries, pros/cons, and impact analysis.
        
        Args:
            title (str): Document title.
            description (str): Document description.
            bill_text (str, optional): Full text content.
            doc_type (str): Type of document ('vote', 'bill', 'interpellation').
            
        Returns:
            dict: Structured analysis (JSON) or None on failure.
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
    def generate_text(self, prompt: str, model_name: Optional[str] = None) -> str:
        """Generic method to generate plain text from a custom prompt."""
        if not self.model: return ""
        try:
            model = self._get_model(model_name or self.model_flash)
            response = model.generate_content(prompt)
            return response.text.strip() if response.text else ""
        except Exception as e:
            logger.error(f"Gemini Text Generation Error: {e}")
            return ""

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

        base_prompt = """
        Jesteś bezstronnym, ale dociekliwym analitykiem sejmowym OtwartyParlament.pl.
        Twoim zadaniem jest dostarczenie fascynującej, opartej na faktach analizy tego {context_word}.
        
        WAŻNE: CAŁA ODPOWIEDŹ MUSI BYĆ W JĘZYKU POLSKIM (POLISH).
        
        ZASADY STYLU (KRYTYCZNE):
        1. STYL "IMPACT-FIRST": Zacznij od razu od konkretu. Co to zmienia? Ile to kosztuje? Kto zyska, a kto straci?
        2. ZERO BIUROKRACJI: Zakaz używania nudnych fraz typu "Głosowanie dotyczy...", "Projekt ma na celu...". Pisz jak dziennikarz analityczny.
        3. STYL "ŚLEDCZY": Szukaj kruczków, konkretnych kwot, dat wejścia w życie i powiązań z innymi ustawami.
        4. PROCEDURY: Jeśli dokument jest techniczny/proceduralny (np. odroczenie obrad), wyjaśnij to KRÓTKO I CIEKAWIE. 
           ZAKAZ pisania "nie mam danych" – wyjaśnij CO TO ZA PROCEDURA i jakie ma znaczenie dla tempa prac.
        
        JAKOŚĆ I POKRYCIE:
        - UNIKAJ POWTÓRZEŃ I BANALNYCH WNIOSKÓW.
        - ZALETY I WADY: muszą być KONKRETNE (np. "Wsparcie dla 1200 szpitali", a nie "Poprawa ochrony zdrowia").
        
        DANE WEJŚCIOWE:
        TYTUŁ: {title}
        OPIS: {description}
        TREŚĆ: {bill_text}
        
        Zwróć JSON:
        {
            "summary_citizen": "Podsumowanie dla obywatela (5-7 zdań). ZALECENIA: Zacznij od 'Ta ustawa zmienia X...' lub 'Koszt tej zmiany to Y...'. Pisz jak do kogoś, kto ma tylko 30 sekund. ZERO wstępów o tym, że odbyło się głosowanie.",
            "summary_expert": "Pogłębiona analiza 'Śledcza'. STRUKTURA: 1. Cel i ukryte intencje. 2. Wykaz kwot, terminów i twardych danych. 3. Potencjalne pułapki prawne. 4. Skutki dla stabilności państwa.",
            "street_title": "Tytuł 'uliczny' (max 7 słów). Samo sedno, np. 'Wyższe kary za piractwo drogowe'.",
            "category": "Gospodarka, Zdrowie, Obronność, Edukacja, Ustrój, Inne",
            "importance_score": 1-10,
            "pros": ["Konkretna korzyść + dla kogo"],
            "cons": ["Konkretne ryzyko lub koszt"],
            "personas": {
                "Przedsiębiorca": "Krótki, twardy wpływ.",
                "Pracownik": "Krótki, twardy wpływ.",
                "Rolnik": "Krótki, twardy wpływ.",
                "Emeryt": "Krótki, twardy wpływ.",
                "Student": "Krótki, twardy wpływ.",
                "Rodzic": "Krótki, twardy wpływ."
            },
            "meta_description": "SEO (max 155 znaków).",
            "keywords": ["tag1", "tag2"],
            "tags": ["Tag1", "Tag2"],
            "procedural_context": "Jeśli to głosowanie techniczne, wyjaśnij prostym językiem jego znaczenie (1-2 zdania). W przeciwnym razie zostaw puste."
        }
        """

        if doc_type == "process_context":
            base_prompt = """
            Jesteś ekspertem legislacyjnym Kancelarii Sejmu.
            Twoim zadaniem jest wyjaśnienie obecnego ETAPU PROCESU LEGISLACYJNEGO.
            
            KONTEKST (Oś Czasu):
            {bill_text}

            OBECNY ETAP: {title} ({description})

            KLUCZOWE WYMOGI (TON: PROFESJONALNY, NEUTRALNY, PRAWNICZY):
            1. Wyjaśnij, co proceduralnie oznacza ten etap (np. "Jest to głosowanie nad uchwałą Senatu").
            2. Wyjaśnij wymogi większości (zwykła, bezwzględna, 3/5) jeśli dotyczy.
            3. Wyjaśnij skutki prawne (np. "Odrzucenie weta oznacza wejście ustawy w życie").
            4. ŻADNYCH OCEN i EMOCJI. ("Ważny moment", "Dramatyczne głosowanie" -> ZAKAZANE).
            
            Zwróć JSON:
            {
                "procedural_context": "Zwięzłe wyjaśnienie proceduralne (max 3 zdania). Skup się na mechanice procesu.",
                "legal_consequence": "Co się stanie po głosowaniu ZA, a co po PRZECIW."
            }
            """
         
        if doc_type == "vote":
            base_prompt += "\nJEŚLI GŁOSOWANIE JEST TECHNICZNE (przerwa, odroczenie): Zwróć summary='Głosowanie techniczne.' i puste listy pros/cons."
            
        if complexity == "HIGH":
             base_prompt += "\nUWAGA: To jest kluczowy dokument. Dokładnie przeanalizuj wpływ finansowy."
        
        # Prepare content safely
        bill_text_safe = str(bill_text or "")[:100000] if bill_text else "BRAK - Analizuj tylko na podstawie tytułu i opisu."
            
        final_prompt = base_prompt.replace("{context_word}", str(context_word))
        final_prompt = final_prompt.replace("{title}", str(title))
        final_prompt = final_prompt.replace("{description}", str(description or ""))
        final_prompt = final_prompt.replace("{bill_text}", bill_text_safe)
        
        return final_prompt

    def generate_summary(self, bill_content: str, title: str = "") -> Dict[str, str]:
        """
        Generates a dual-layer summary (Simple + Expert) for a bill.
        
        Args:
            bill_content (str): Text content of the bill.
            title (str): Title of the bill.
            
        Returns:
            dict: {"simple": "...", "expert": "..."}
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
        Extracts key arguments For and Against from the bill text.
        
        Args:
            bill_content (str): Text content.
            
        Returns:
            dict: {"pros": [...], "cons": [...], "confidence_score": int}
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
        Generates SEO-friendly metadata for a page.
        
        Translates bureaucratic language into "Language of the Street" (search terms).
        
        Args:
            title (str): Original title.
            description (str): Original description.
            
        Returns:
            dict: {"street_title": "...", "meta_description": "...", "keywords": [...]}
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
