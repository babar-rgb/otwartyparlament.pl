import requests
import os
import json
from supabase import create_client, Client

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip()
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

EU_API_URL = "https://data.europarl.europa.eu/api/v2/meps/show-current?format=application%2Fld%2Bjson&offset=0&limit=1000"

# Manual Mapping based on User Input
NATIONAL_PARTY_MAPPING = {
    # Koalicja Obywatelska (KO)
    "Magdalena ADAMOWICZ": "Koalicja Obywatelska",
    "Bartosz ARŁUKOWICZ": "Koalicja Obywatelska",
    "Krzysztof BREJZA": "Koalicja Obywatelska",
    "Borys BUDKA": "Koalicja Obywatelska",
    "Andrzej BUŁA": "Koalicja Obywatelska",
    "Kamila GASIUK-PIHOWICZ": "Koalicja Obywatelska",
    "Andrzej HALICKI": "Koalicja Obywatelska",
    "Dariusz JOŃSKI": "Koalicja Obywatelska",
    "Marcin KIERWIŃSKI": "Koalicja Obywatelska",
    "Łukasz KOHUT": "Koalicja Obywatelska",
    "Ewa KOPACZ": "Koalicja Obywatelska",
    "Janusz LEWANDOWSKI": "Koalicja Obywatelska",
    "Elżbieta ŁUKACIJEWSKA": "Koalicja Obywatelska",
    "Jagna MARCZUŁAJTIS-WALCZAK": "Koalicja Obywatelska",
    "Mirosława NYKIEL": "Koalicja Obywatelska",
    "Jacek PROTAS": "Koalicja Obywatelska",
    "Bartłomiej SIENKIEWICZ": "Koalicja Obywatelska",
    "Michał SZCZERBA": "Koalicja Obywatelska",
    "Michał WAWRYKIEWICZ": "Koalicja Obywatelska",
    "Marta WCISŁO": "Koalicja Obywatelska",
    "Bogdan ZDROJEWSKI": "Koalicja Obywatelska",
    "Bogdan Andrzej ZDROJEWSKI": "Koalicja Obywatelska",
    "Elżbieta Katarzyna ŁUKACIJEWSKA": "Koalicja Obywatelska",
    "Hanna GRONKIEWICZ-WALTZ": "Koalicja Obywatelska",
    
    # Prawo i Sprawiedliwość (PiS)
    "Adam BIELAN": "Prawo i Sprawiedliwość",
    "Tobiasz BOCHEŃSKI": "Prawo i Sprawiedliwość",
    "Joachim BRUDZIŃSKI": "Prawo i Sprawiedliwość",
    "Joachim Stanisław BRUDZIŃSKI": "Prawo i Sprawiedliwość",
    "Waldemar BUDA": "Prawo i Sprawiedliwość",
    "Michał DWORCZYK": "Prawo i Sprawiedliwość",
    "Małgorzata GOSIEWSKA": "Prawo i Sprawiedliwość",
    "Patryk JAKI": "Prawo i Sprawiedliwość",
    "Mariusz KAMIŃSKI": "Prawo i Sprawiedliwość",
    "Marlena MALĄG": "Prawo i Sprawiedliwość",
    "Arkadiusz MULARCZYK": "Prawo i Sprawiedliwość",
    "Piotr MÜLLER": "Prawo i Sprawiedliwość",
    "Daniel OBAJTEK": "Prawo i Sprawiedliwość",
    "Jacek OZDOBA": "Prawo i Sprawiedliwość",
    "Bogdan RZOŃCA": "Prawo i Sprawiedliwość",
    "Beata SZYDŁO": "Prawo i Sprawiedliwość",
    "Dominik TARCZYŃSKI": "Prawo i Sprawiedliwość",
    "Maciej WĄSIK": "Prawo i Sprawiedliwość",
    "Jadwiga WIŚNIEWSKA": "Prawo i Sprawiedliwość",
    "Anna ZALEWSKA": "Prawo i Sprawiedliwość",
    "Kosma ZŁOTOWSKI": "Prawo i Sprawiedliwość",
    
    # Konfederacja
    "Grzegorz BRAUN": "Konfederacja",
    "Anna BRYŁKA": "Konfederacja",
    "Tomasz BUCZEK": "Konfederacja",
    "Marcin SYPNIEWSKI": "Konfederacja",
    "Stanisław TYSZKA": "Konfederacja",
    "Ewa ZAJĄCZKOWSKA-HERNIK": "Konfederacja",
    
    # Trzecia Droga (PSL / Polska 2050)
    "Krzysztof HETMAN": "Trzecia Droga (PSL)",
    "Adam JARUBAS": "Trzecia Droga (PSL)",
    "Michał KOBOSKO": "Trzecia Droga (Polska 2050)",
    
    # Lewica
    "Robert BIEDROŃ": "Lewica",
    "Joanna SCHEURING-WIELGUS": "Lewica",
    "Krzysztof ŚMISZEK": "Lewica"
}

def fetch_and_process_meps():
    print("Fetching MEPs from Europarl API...")
    
    try:
        response = requests.get(EU_API_URL)
        response.raise_for_status()
        data = response.json()
        
        # The data is in data['data']
        meps_list = data.get('data', [])
        print(f"Total MEPs fetched: {len(meps_list)}")
        
        polish_meps = []
        
        for mep in meps_list:
            # 1. Filter for Poland (PL)
            country_code = mep.get('api:country-of-representation')
            
            if country_code == 'PL':
                # 2. Extract Basic Data
                api_id = mep.get('identifier')
                full_name = mep.get('label') # e.g. "Robert BIEDROŃ"
                eu_group = mep.get('api:political-group')
                
                # 3. Map National Party
                # Try exact match first
                national_party = NATIONAL_PARTY_MAPPING.get(full_name)
                
                # If not found, try case-insensitive or partial match logic if needed
                if not national_party:
                    # Name from API is usually "Firstname LASTNAME"
                    # Mapping keys are also "Firstname LASTNAME". 
                    # If slight mismatch (case), let's try to normalize.
                    
                    found = False
                    for key, val in NATIONAL_PARTY_MAPPING.items():
                        if key.lower() == full_name.lower():
                            national_party = val
                            found = True
                            break
                            
                    if not found:
                        national_party = "Brak danych"
                        print(f"Warning: No party mapping for {full_name}")

                # Photo
                photo_url = f"https://www.europarl.europa.eu/mepphoto/{api_id}.jpg"
                
                polish_meps.append({
                    "api_id": int(api_id),
                    "full_name": full_name,
                    "country": "Poland",
                    "eu_group": eu_group,
                    "national_party": national_party,
                    "photo_url": photo_url,
                    "active": True
                })

        print(f"Found {len(polish_meps)} Polish MEPs.")
        
        # 3. Upsert to DB
        count = 0
        for mep in polish_meps:
            try:
                # Convert api_id to int
                mep['api_id'] = int(mep['api_id'])
                supabase.table('euro_meps').upsert(mep, on_conflict='api_id').execute()
                count += 1
            except Exception as e:
                print(f"Error saving {mep['full_name']}: {e}")
                
        print(f"Successfully saved {count} MEPs.")

    except Exception as e:
        print(f"Error fetching data: {e}")

if __name__ == "__main__":
    fetch_and_process_meps()
