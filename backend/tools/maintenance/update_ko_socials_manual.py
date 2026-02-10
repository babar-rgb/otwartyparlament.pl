import logging
logging.basicConfig(level=logging.INFO)

import sys
import os
import re

# Ensure we can import core modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.db import db

RAW_DATA = """
### 1. Adrian Witczak
- **Facebook:** https://www.facebook.com/AdrianWitczakTM/
- **Twitter/X:** https://x.com/adrian_witczak

### 2. Alicja Łepkowska-Gołaś
- **Facebook:** https://www.facebook.com/p/Alicja-%C5%81epkowska-Go%C5%82a%C5%9B-Pos%C5%82anka-na-Sejm-RP-100064645455889/
- **Twitter/X:** https://x.com/LepkowskaGolas

### 3. Andrzej Domański
- **Stanowisko:** Minister Finansów
- **Facebook:** https://www.facebook.com/AndrzejDomanskiPolityk/
- **Twitter/X:** https://x.com/Domanski_Andrz

### 4. Anna Sobolak
- **Facebook:** https://www.facebook.com/sobolakannadosejmu/
- **Twitter/X:** https://x.com/anna_sobolak

### 5. Anna Wojciechowska
- **Facebook:** https://www.facebook.com/AnnaWojciechowska.Elk/
- **Twitter/X:** https://x.com/WojciechowskaKO

### 6. Bartosz Arłukowicz
- **Facebook:** https://www.facebook.com/bartosz.arlukowicz/
- **Twitter/X:** https://x.com/Arlukowicz

### 7. Bogdan Zdrojewski
- **Facebook:** https://www.facebook.com/zdrojewski.info/
- **Twitter/X:** https://x.com/BZdrojewski

### 8. Borys Budka
- **Facebook:** https://www.facebook.com/BudkaBorys/
- **Twitter/X:** https://x.com/bbudka

### 9. Dariusz Joński
- **Stanowisko:** Eurodeputowany (MEP)
- **Facebook:** https://www.facebook.com/dariusz.jonski.7/
- **Twitter/X:** https://x.com/Dariusz_Jonski

### 10. Dorota Łoboda
- **Stanowisko:** Rzeczniczka klubu KO
- **Facebook:** https://www.facebook.com/Dor.Loboda/
- **Twitter/X:** https://x.com/DorotaLoboda

### 11. Dorota Niedziela
- **Stanowisko:** Wicemarszałek Sejmu RP
- **Facebook:** https://www.facebook.com/poslankaniedziela/
- **Twitter/X:** https://x.com/DorotaNiedziela

### 12. Elżbieta Gapińska
- **Facebook:** https://www.facebook.com/p/El%C5%BCbieta-Gapi%C5%84ska-Pos%C5%82anka-na-Sejm-RP-100058139018785/
- **Twitter/X:** https://x.com/gapinska_e

### 13. Elżbieta Polak
- **Facebook:** https://www.facebook.com/elzbieta.anna.polak/
- **Twitter/X:** https://x.com/ElzbietaPolak

### 14. Franciszek Sterczewski
- **Facebook:** https://www.facebook.com/FranekSterczewski/
- **Twitter/X:** https://x.com/f_sterczewski

### 15. Gabriela Lenartowicz
- **Facebook:** https://www.facebook.com/poselgabrielalenartowicz/
- **Twitter/X:** https://x.com/GabaLenartowicz

### 16. Grzegorz Napieralski
- **Facebook:** https://www.facebook.com/gnapieralski/
- **Twitter/X:** https://x.com/Napieralski_G

### 17. Grzegorz Schetyna
- **Facebook:** https://www.facebook.com/G.Schetyna/
- **Twitter/X:** https://x.com/G_Schetyna

### 18. Jarosław Wałęsa
- **Facebook:** https://www.facebook.com/Walesa.Jaroslaw/
- **Twitter/X:** https://x.com/WalesaJL

### 19. Iwona Krawczyk
- **Facebook:** https://www.facebook.com/sprawdzonawdzialaniu/
- **Twitter/X:** https://x.com/IkaKrawczyk

### 20. Iwona Śledzińska-Katarasińska
- **Facebook:** https://www.facebook.com/SledzinskaKatarasinska/
- **Twitter/X:** https://x.com/ikatarasinska

### 21. Jakub Rutnicki
- **Stanowisko:** Minister Sportu
- **Facebook:** https://www.facebook.com/PoselJakubRutnicki/
- **Twitter/X:** Aktywny na platformie

### 22. Jan Grabiec
- **Facebook/WWW:** https://jangrabiec.pl/
- **Twitter/X:** Weryfikowany użytkownik

### 23. Joanna Frydrych
- **Facebook:** https://www.facebook.com/PoselNaSejmRP.JoannaFrydrych/
- **Twitter/X:** https://x.com/frydrych_joanna

### 24. Joanna Kluzik-Rostkowska
- **Stanowisko:** Były Minister Edukacji
- **Facebook:** https://www.facebook.com/KluzikRostkowska/
- **Twitter/X:** Aktywna na platformie

### 25. Katarzyna Lubnauer
- **Facebook:** https://www.facebook.com/KLubnauer/
- **Twitter/X:** https://x.com/KLubnauer

### 26. Katarzyna Osos
- **Facebook:** https://www.facebook.com/katarzynaososofficial/
- **Twitter/X:** https://x.com/KatarzynaOsos

### 27. Katarzyna Piekarska
- **Facebook:** https://www.facebook.com/piekarska.ipl/
- **Twitter/X:** https://x.com/MariaKatarzyna

### 28. Krystyna Sibińska
- **Facebook:** https://www.facebook.com/k.sibinska/
- **Twitter/X:** https://x.com/sibinska

### 29. Krystyna Szumilas
- **Facebook:** https://www.facebook.com/krystynaszumilas/
- **Twitter/X:** Aktywna na platformie

### 30. Krzysztof Brejza
- **Stanowisko:** Eurodeputowany (PE)
- **Facebook:** https://www.facebook.com/k.brejza/
- **Twitter/X:** https://x.com/krzysztofbrejza

### 31. Krzysztof Truskolaski
- **Stanowisko:** Poseł, były Wiceminister
- **Facebook:** https://www.facebook.com/ktruskolaski/
- **Twitter/X:** https://x.com/KTruskolaski

### 32. Magdalena Kołodziejczak
- **Facebook:** https://www.facebook.com/magdalenakolodziejczakposlankadosejmurp/
- **Twitter/X:** https://x.com/MKolodziejczak3

### 33. Marcin Kierwiński
- **Facebook:** https://www.facebook.com/marcinkierwinski/
- **Twitter/X:** https://x.com/MKierwinski

### 34. Marek Sowa
- **Facebook:** https://www.facebook.com/mareksowa.fanpage/
- **Twitter/X:** https://x.com/SowaMarek

### 35. Mariusz Witczak
- **Facebook:** https://www.facebook.com/witczakmariusz/
- **Twitter/X:** Aktywny na platformie

### 36. Marta Golbik
- **Stanowisko:** Przewodnicząca Komisji Zdrowia
- **Facebook:** https://www.facebook.com/GolbikMarta/
- **Twitter/X:** Aktywna na platformie

### 37. Małgorzata Gromadzka
- **Stanowisko:** Sekretarz Stanu w MRiRW
- **Facebook:** https://www.facebook.com/malgorzatagromadzkapl/
- **Twitter/X:** Aktywna na platformie

### 38. Małgorzata Kidawa-Błońska
- **Stanowisko:** Marszałek Senatu RP
- **Facebook:** https://www.facebook.com/MKidawaBlonska/
- **Twitter/X:** https://x.com/M_K_Blonska

### 39. Michał Kołodziejczak
- **Stanowisko:** Poseł, były Wiceminister
- **Facebook:** https://www.facebook.com/michal.kolodziejczak.UGiM/
- **Twitter/X:** https://x.com/EKOlodziejczak_

### 40. Michał Szczerba
- **Facebook:** https://www.facebook.com/posel.szczerba/
- **Twitter/X:** https://x.com/MichalSzczerba

### 41. Monika Wielichowska
- **Stanowisko:** Wicemarszałek Sejmu RP
- **Facebook:** https://www.facebook.com/mwielichowska/
- **Twitter/X:** https://x.com/MWielichowska

### 42. Monika Rosa
- **Facebook:** https://www.facebook.com/RosaMonikaAnna/
- **Twitter/X:** https://x.com/moanrosa

### 43. Paweł Kowal
- **Stanowisko:** Szef Komisji Spraw Zagranicznych
- **Facebook:** https://www.facebook.com/pawelkowalpl/
- **Twitter/X:** https://x.com/pawelkowalpl

### 44. Piotr Kandyba
- **Stanowisko:** Poseł
- **Facebook:** https://www.facebook.com/piotrkandyba/
- **Twitter/X:** https://x.com/KandybaPiotr

### 45. Robert Kropiwnicki
- **Stanowisko:** Poseł, były Wiceminister
- **Facebook:** https://www.facebook.com/rkropiwnicki/
- **Twitter/X:** https://x.com/RKropiwnicki

### 46. Henryka Krzywonos-Strycharska
- **Stanowisko:** Bohaterka Sierpnia 1980, Posłanka
- **Facebook:** https://www.facebook.com/henrykakrzywonos/
- **Twitter/X:** ❌ Brak publicznego konta
"""


def parse_data(raw):
    entries = []
    lines = raw.strip().split('\n')
    current_entry = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith('###'):
            # New entry
            if current_entry and 'name' in current_entry:
                entries.append(current_entry)
            
            # Extract name "### 1. Adrian Witczak"
            # Regex to capture name after number
            match = re.search(r'###\s*\d+\.\s*(.+)', line)
            if match:
                name = match.group(1).strip()
                current_entry = {'name': name, 'facebook': None, 'twitter': None}
        
        elif 'Facebook' in line:
            # Extract FB
            url_match = re.search(r'(https?://[^\s]+)', line)
            if url_match:
                current_entry['facebook'] = url_match.group(1).strip()
        
        elif 'Twitter' in line or '/X:' in line:
            # Extract Twitter
            url_match = re.search(r'(https?://[^\s]+)', line)
            if url_match:
                current_entry['twitter'] = url_match.group(1).strip()

    if current_entry and 'name' in current_entry:
        entries.append(current_entry)
        
    return entries


def update_mps():
    data = parse_data(RAW_DATA)
    logging.info(f"Parsed {len(data)} MPs.")
    
    with db.get_cursor(commit=True) as cur:
        updated_count = 0
        for mp in data:
            name = mp['name']
            
            updates = []
            if mp['facebook']:
                updates.append(f'"facebook": "{mp["facebook"]}"')
            if mp['twitter']:
                updates.append(f'"twitter": "{mp["twitter"]}"')
                
            if not updates:
                logging.info(f"Skipping {name} (no valid links)")
                continue
                
            json_fragment = '{' + ', '.join(updates) + '}'
            
            logging.info(f"Updating {name} with {json_fragment}...")
            
            # Update query using jsonb concatenation
            cur.execute(
                "UPDATE mps SET contact_info = contact_info || %s::jsonb WHERE name = %s",
                (json_fragment, name)
            )
            updated_count += 1
            
        logging.info(f"Updated {updated_count} MPs successfully.")

if __name__ == "__main__":
    update_mps()
