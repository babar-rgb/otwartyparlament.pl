
import sys
import os
import re

# Ensure we can import core modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.db import db

RAW_DATA = """
## 🟠 KOALICJA OBYWATELSKA (17 posłów)

| Poseł | Facebook | X/Twitter |
|-------|----------|-----------|
| Karolina Pawliczak | ✅ https://www.facebook.com/karolinapawliczakpl | ✅ https://x.com/KarolinaPawli15 |
| Katarzyna Królak | ✅ https://www.facebook.com/KrolakKatarzyna | ✅ https://x.com/krolaczka |
| Kazimierz Plocke | ✗ BRAK | ✗ BRAK |
| Lucjan Pietrzczyk | ✅ https://www.facebook.com/lucjan.pietrzczyk | ✅ https://x.com/lpietrzczyk |
| Marek Rząsa | ✅ https://www.facebook.com/p/Marek-Rząsa-100058257840773 | ✅ https://x.com/MarekRzasa1 |
| Mariusz Popielarz | ✅ https://www.facebook.com/p/Mariusz-Popielarz-Poseł-na-Sejm-RP | ✅ https://x.com/Popielarz_Mar |
| Paweł Masełko | ✅ https://www.facebook.com/Pawel.Maselko.Posel | ✅ https://x.com/PawMaselko |
| Piotr Adamowicz | ✅ https://www.facebook.com/AdamowiczPiotr | ✅ https://x.com/piotr_adamowicz |
| Przemysław Witek | ✅ https://www.facebook.com/wybory.przemyslaw.witek | ✗ Brak publicznego |
| Rafał Siemaszko | ✅ https://www.facebook.com/rafal.siemaszko11 | ✗ Brak publicznego |
| Robert Jagła | ✅ https://www.facebook.com/Robert.Jagla.Poslem | ✗ Brak publicznego |
| Robert Wardzała | ✅ https://www.facebook.com/Robert.Wardzala.Tarnow | ✅ https://x.com/RobertWardzala |
| Stanisław Gorczyca | ✅ https://www.facebook.com/gorczyca2023 | ✗ Brak publicznego |
| Stanisław Lamczyk | ✅ https://www.facebook.com/p/Stanisław-Lamczyk-100068979737029 | ✅ https://x.com/S_Lamczyk |
| Sylwia Bielawska | ✅ https://www.facebook.com/sbielawska | ✅ https://x.com/bielawska_s |
| Włodzisław Giziński | ✅ https://www.facebook.com/wlodzislawgizinski | ✗ Brak publicznego |
| Zofia Czernow | ✅ https://www.facebook.com/z.czernow | ✅ https://x.com/ZofiaCzernow |

## 🔵 PRAWO I SPRAWIEDLIWOŚĆ (34 posłów)

| Poseł | Facebook | X/Twitter |
|-------|----------|-----------|
| Agnieszka Górska | ✅ https://www.facebook.com/agnieszka.gorska.7146 | ✅ https://x.com/GorskaAGAa |
| Agnieszka Ścigaj | ✅ https://www.facebook.com/Agnieszka.Scigaj.K15 | ✅ https://x.com/AgaScigaj |
| Agnieszka Soin | ✅ https://www.facebook.com/SoinAgnieszka | ✅ https://x.com/SoinAgnieszka |
| Aleksander Mrówczyński | ✅ https://www.facebook.com/MrowczynskiAleksander | ✅ https://x.com/Aj5721Aj |
| Anna Cicholska | ✅ https://www.facebook.com/AnnaEwaCicholska | ✗ Brak publicznego |
| Anna Paluch | ✅ https://www.facebook.com/p/Anna-Paluch-100057792292516 | ✅ https://x.com/AnnaPaluchSejm |
| Arkadiusz Czartoryski | ✅ https://www.facebook.com/arkadiuszczartoryski1 | ✅ https://x.com/acz_czartoryski |
| Artur Chojecki | ✅ https://www.facebook.com/arturhenrykchojecki | ✗ Brak publicznego |
| Artur Szałabawka | ✅ https://www.facebook.com/arturszalabawka | ✅ https://x.com/arturszalabawka |
| Bartłomiej Dorywalski | ✗ BRAK | ✗ BRAK |
| Bogumiła Olbryś | ✅ https://www.facebook.com/bogusiaolbrys.bogusiaolbrys | ✗ Brak publicznego |
| Bożena Borys-Szopa | ✅ https://www.facebook.com/borysszopabozena | ✅ https://x.com/BorysSzopa |
| Dorota Arciszewska-Mielewczyk | ✅ https://www.facebook.com/arciszewskamielewczyk | ✗ Brak publicznego |
| Elżbieta Duda | ✅ https://www.facebook.com/ElzbietaDudaPIS | ✗ Brak publicznego |
| Filip Kaczyński | ✅ https://www.facebook.com/filipkaczynskiposel | ✅ https://x.com/FilipKaczynski |
| Grzegorz Macko | ✅ https://www.facebook.com/MackoGrzegorz | ✗ Brak publicznego |
| Jacek Osuch | ✅ https://www.facebook.com/osuch.jacek | ✗ Brak publicznego |
| Kazimierz Choma | ✅ https://www.facebook.com/choma.kazimierz | ✗ Brak publicznego |
| Kazimierz Gołojuch | ✅ https://www.facebook.com/golojuch.info | ✗ Brak publicznego |
| Krzysztof Czarnecki | ✅ https://www.facebook.com/KrzysztofCzarnecki.liderPiS | ✅ https://x.com/K_Czarnecki_PL |
| Leonard Krasulski | ✗ BRAK | ✗ BRAK |
| Lidia Czechak | ✅ https://www.facebook.com/lidia.czechak | ✅ https://x.com/CzechakLidia |
| Magdalena Filipek-Sobczak | ✅ https://www.facebook.com/magdalenafilipeksobczak | ✗ Brak publicznego |
| Marcin Grabowski | ✗ BRAK | ✗ BRAK |
| Marcin Horała | ✅ https://www.facebook.com/MarcinHorala | ✅ https://x.com/mhorala |
| Mariusz Krystian | ✅ https://www.facebook.com/mariusz.krystian.3 | ✗ Brak publicznego |
| Michał Cieślak | ✅ https://www.facebook.com/MichalCieslakMC | ✅ https://x.com/Cieslak_Mich |
| Mirosława Stachowiak-Różecka | ✅ https://www.facebook.com/rozecka | ✗ Brak publicznego |
| Olga Semeniuk-Patkowska | ✅ https://www.facebook.com/p/Olga-Semeniuk-Patkowska-100090169121816 | ✗ Brak publicznego |
| Szymon Pogoda | ✅ https://www.facebook.com/SzymonPogodaPosel | ✗ Brak publicznego |
| Władysław Dajczak | ✗ BRAK | ✗ BRAK |
| Władysław Kurowski | ✅ https://www.facebook.com/PoselKurowski | ✗ Brak publicznego |
| Wojciech Szarama | ✅ https://www.facebook.com/p/Wojciech-Szarama-Poseł-na-Sejm-RP-100058281240035 | ✗ Brak publicznego |
| Zbigniew Chmielowiec | ✅ https://www.facebook.com/zbigniew.chmielowiec.1 | ✗ Brak publicznego |

## 🔴 LEWICA (1 poseł)

| Poseł | Facebook | X/Twitter |
|-------|----------|-----------|
| Anna Żukowska | ✅ https://www.facebook.com/AMZukowska | ✅ https://x.com/AMZukowska |

## ⚪ INNE (3 posłowie)

| Poseł | Frakcja | Facebook | X/Twitter |
|-------|---------|----------|-----------|
| Bronisław Foltyn | Konfederacja | ✗ Brak | ✅ https://x.com/bronislawfoltyn |
| Krzysztof Tuduj | Konfederacja | ✅ https://www.facebook.com/krzysztoftuduj | ✗ Brak publicznego |
| Tomasz Zimoch | Niezalezny | ✗ Brak | ✅ https://x.com/tzimoch |
"""

def clean_url(text):
    if "BRAK" in text or "Brak" in text:
        return None
    # Extract URL from "✅ https://..."
    match = re.search(r'https?://[^\s|]+', text)
    if match:
        return match.group(0).strip()
    return None

def parse_data(raw):
    mps = {}
    lines = raw.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line.startswith('|') or '---' in line or 'Poseł' in line:
            continue
            
        parts = [p.strip() for p in line.split('|')]
        if len(parts) < 4:
            continue
            
        # Format: | Name | Facebook | Twitter | (sometimes Frakcja in between)
        name = parts[1]
        
        # Handle INNE table which has extra column
        if len(parts) == 6: # | | Name | Frakcja | FB | TW | | 
            fb_raw = parts[4]
            tw_raw = parts[5]
        else: # | | Name | FB | TW | |
            fb_raw = parts[2]
            tw_raw = parts[3]
            
        fb = clean_url(fb_raw)
        tw = clean_url(tw_raw)
        
        if fb or tw:
            mps[name] = {'facebook': fb, 'twitter': tw}
            
    return mps

def update_mps():
    data = parse_data(RAW_DATA)
    print(f"Parsed {len(data)} MPs to update.")
    
    with db.get_cursor(commit=True) as cur:
        updated_count = 0
        for name, links in data.items():
            updates = []
            if links['facebook']:
                updates.append(f'"facebook": "{links["facebook"]}"')
            if links['twitter']:
                updates.append(f'"twitter": "{links["twitter"]}"')
                
            if not updates:
                continue
                
            json_fragment = '{' + ', '.join(updates) + '}'
            
            # Special handling for names with typos if any, but first try direct match
            # print(f"Updating {name} with {json_fragment}...")
            
            cur.execute(
                "UPDATE mps SET contact_info = contact_info || %s::jsonb WHERE name = %s",
                (json_fragment, name)
            )
            updated_count += 1
            
        print(f"Updated {updated_count} MPs successfully.")

if __name__ == "__main__":
    update_mps()
