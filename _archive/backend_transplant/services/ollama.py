import requests
import json

class OllamaService:
    def __init__(self, base_url="http://localhost:11434", model="qwen2.5:7b"):
        self.base_url = base_url
        self.model = model

    def generate(self, prompt):
        """
        Generic generation method.
        """
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=120
            )
            response.raise_for_status()
            return response.json().get("response", "")
        except Exception as e:
            print(f"Error communicating with Ollama: {e}")
            return None

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
            "category": "JEDNA z kategorii: Gospodarka, Zdrowie, Obronność, Edukacja, Infrastruktura, Rolnictwo, Ustrój, Społeczeństwo, Proceduralne, Inne",
            "pros": ["zaleta 1", "zaleta 2"],
            "cons": ["wada 1", "wada 2"],
            "impact": "Kogo to dotyczy najbardziej?",
            "importance": 7
        }}
        
        Zasady:
        1. ODPOWIADAJ WYŁĄCZNIE W JĘZYKU POLSKIM. Nie używaj chińskiego, angielskiego ani żadnego innego języka.
        2. Używaj trybu przypuszczającego dla projektów ("Projekt zakłada...").
        3. Bądź ekstremalnie merytoryczny i cyniczny w analizie kosztów.
        4. JEŚLI USTAW ZWIĘKSZA PODATKI/OPŁATY (np. ZUS, składki):
           - Napisz to WPROST w polu "cons" i "impact".
           - NIE PISZ o "szansach na rozwój" czy "lepszej przyszłości" jeśli rosną koszty.
           - Skup się na portfelu obywatela.
        5. Importance: 1-10 (10 to kluczowe zmiany ustrojowe/budżetowe).
        6. NIE HALUCYNUJ. Opieraj się tylko na dostarczonym tekście. Nie wymyślaj zalet na siłę.
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
        1. ODPOWIADAJ WYŁĄCZNIE W JĘZYKU POLSKIM. Zero chińskich znaków.
        2. Bądź chłodny i analityczny. Unikaj nowomowy politycznej.
        3. Jeśli głosowanie dotyczyło nałożenia nowych obowiązków lub podatków, napisz to wprost w "summary" i "cons".
        4. Kategoria "Proceduralne" jest dla głosowań technicznych (przerwy, odroczenia, zmiany w komisjach).
        5. Wyjaśnij prostym językiem znaczenie tego głosowania dla obywatela, bez owijania w bawełnę.
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

    def generate_mp_bio(self, mp_data, stats_summary):
        """
        Generates a neutral, factual biography for an MP based on structured data.
        Target length: 150-200 words.
        """
        if not mp_data:
            return None
        
        # Prepare structured data for prompt
        parts = [str(mp_data.get('first_name') or ''), str(mp_data.get('last_name') or '')]
        name = " ".join([p for p in parts if p]).strip()
        club = mp_data.get('club')
        
        prompt = f"""
        Jesteś obiektywnym biograferem parlamentarnym. Twoim zadaniem jest napisanie krótkiej, neutralnej notki biograficznej ("życiorysu") dla posła na Sejm RP.
        
        DANE OSOBOWE:
        - Imię i nazwisko: {name}
        - Klub/Ugrupowanie: {club}
        - Data urodzenia: {mp_data.get('birth_date')}
        - Miejsce urodzenia: {mp_data.get('birth_location')}
        - Wykształcenie: {mp_data.get('education_level')} (szczegóły: {mp_data.get('education_history')})
        - Zawód: {mp_data.get('profession')}
        
        DANE O AKTYWNOŚCI (X Kadencja):
        {stats_summary}
        
        WYTYCZNE (BARDZO WAŻNE):
        1. JĘZYK: Polski. Pisz poprawną polszczyzną (uwaga na odmianę nazw miejscowości, np. "w Złocieńcu", a nie "w Złocieniec").
        2. KLUBU/PARTIE: NIGDY nie rozwijaj skrótów samodzielnie, jeśli nie jesteś pewien. Używaj pełnych nazw tylko z tej listy:
           - KO -> Koalicja Obywatelska
           - PiS -> Prawo i Sprawiedliwość
           - TD -> Trzecia Droga
           - PL2050 -> Polska 2050
           - PSL -> Polskie Stronnictwo Ludowe
           - Konfederacja -> Konfederacja Wolność i Niepodległość
           - Lewica -> Nowa Lewica
           Jeśli skrót jest inny, zostaw go tak jak jest.
           NIE WYMYŚLAJ nazw typu "Klub Osobistych Inwestorów"!
        3. Styl: Encyklopedyczny, zwięzły. Bez "posessenionach" (to nie jest polskie słowo). Używaj "posiedzeniach".
        4. Struktura:
           - Akapit 1: Urodzenie (data i miejsce w Miejscowniku!), wykształcenie, polityczne zakorzenienie.
           - Akapit 2: Aktywność w X kadencji (komisje, interpelacje).
           - Akapit 3: Statystyki w formie opisowej.
        5. NIE HALUCYNUJ. Jeśli czegoś nie wiesz, napisz "Brak szczegółowych danych o...".
        6. Pisz w trzeciej osobie.
        """

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"  # Still using JSON wrapper to get clean text inside a field if needed, or just text
                },
                timeout=180 # Longer timeout for creative generation
            )
            response.raise_for_status()
            
            # For this task, we might want raw text, but if we enforce JSON in previous methods, 
            # we should stick to structured output OR just ask for the string 'biography'.
            # Let's try to get a JSON with a single field 'biography' to ensure clean start/end.
            
            # Updating prompt to request JSON explicitly to match class pattern, 
            # though the report implied text. JSON is safer for extraction.
            # Let's wrap the previous prompt guideline to ask for JSON.
            
            prompt += """
            
            Zwróć wynik w formacie JSON:
            {
                "biography": "Treść biogramu..."
            }
            """
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=180
            )
            response.raise_for_status()
            result = response.json().get("response", "")
            parsed = json.loads(result)
            return parsed.get("biography", "")
            
        except Exception as e:
            print(f"Error generating bio for {name}: {e}")
            return None

ollama_service = OllamaService()
