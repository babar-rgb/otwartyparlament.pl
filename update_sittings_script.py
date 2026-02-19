
import sys
import os

# Add the project root to the python path
sys.path.append(os.getcwd())

from backend.core.db import db
from backend.core.config import config
from datetime import datetime

# Data to update
# Format: { sitting_number: "Content" }
updates = {
    44: """(5–7 listopada 2025 r.) 44. posiedzenie Sejmu. Trzydniowe obrady zdominowane przez kwestie ustrojowe i podatkowe. Zrealizowano na nim kluczowe punkty porządku dziennego:

* Immunitet byłego ministra – Sejm po burzliwej debacie głosował nad wnioskiem Prokuratury Krajowej o wyrażenie zgody na pociągnięcie do odpowiedzialności karnej, zatrzymanie i tymczasowe aresztowanie Zbigniewa Ziobry.
* Realizacja budżetu na 2026 rok – rozpatrzono sprawozdanie z rządowego projektu ustawy okołobudżetowej na kolejny rok.
* Nowelizacje podatkowe – procedowano istotne zmiany m.in. w PIT, CIT i VAT, które mają bezpośredni wpływ na finanse samorządów oraz podatników.""",

    45: """(18–21 listopada 2025 r.) 45. posiedzenie Sejmu. Napięty tydzień obrad, podczas którego poruszono kwestie bezpieczeństwa i zmian instytucjonalnych:

* Likwidacja CBA – odbyło się pierwsze czytanie budzącego ogromne emocje rządowego projektu ustawy o koordynacji działań antykorupcyjnych, który zakłada całkowitą likwidację Centralnego Biura Antykorupcyjnego.
* Program SAFE i spór z prezydentem – gorąca debata wokół unijnego programu bezpieczeństwa (i pożyczek na przemysł zbrojeniowy). Dyskusja przerodziła się w otwarty spór kompetencyjny między rządem i marszałkiem Czarzastym a prezydentem Karolem Nawrockim.
* Jawność umów publicznych – procedowano nowelizację Kodeksu karnego mającą na celu ucięcie ukrywania wydatków ze skarbu państwa.""",

    46: """(3–5 grudnia 2025 r.) 46. posiedzenie Sejmu. Wyjątkowo gorące i nietypowe obrady, zwieńczone trybem niejawnym:

* Bezpieczeństwo państwa (obrady utajnione) – po niespodziewanym wystąpieniu premiera Donalda Tuska, Sejm przeszedł w tryb tajny, by wysłuchać pilnej informacji o zagrożeniach (wątki „rosyjskiego śladu” i „kryptoafery”).
* Weto do ustawy kryptowalutowej – Sejm podjął próbę odrzucenia weta prezydenta Nawrockiego do ustawy o rynku kryptowalut. Zabrakło wymaganej większości (243 głosy „za” przy progu 261), w związku z czym weto głowy państwa zostało utrzymane w mocy.
* Zakaz hodowli na futra – w tym samym czasie przypieczętowano finalnie, że wyczekiwana przez lata ustawa zakazująca hodowli zwierząt futerkowych uzyskała podpis prezydenta.""",

    47: """(5 grudnia 2025 r.) 47. posiedzenie Sejmu. Bardzo krótkie, w całości techniczne, lecz niezwykle naładowane emocjami obrady:

* Awantury na mównicy i oświadczenia – posiedzenie zwołane natychmiast po zamknięciu obrad 46., służące oświadczeniom poselskim. Zostało zapamiętane głównie z ostrego starcia posłów Lewicy (m.in. A. Zandberga) z wicemarszałkiem W. Czarzastym, któremu zarzucono uciszanie opozycji i „wejście w pisowskie buty”.""",

    48: """(17–19 grudnia 2025 r.) 48. posiedzenie Sejmu. Ostatnie obrady przed przerwą świąteczną, skupione na trudnych kwestiach społecznych i prawnych:

* „Ustawa łańcuchowa” – Sejm zajął się prezydenckim wetem do ustawy zakazującej trzymania psów na łańcuchach oraz debatował nad spornym, alternatywnym projektem głowy państwa, co wzbudziło ogromny opór organizacji prozwierzęcych.
* Prawo o obywatelstwie – odbyło się pierwsze czytanie poselskiego projektu zmieniającego zasady i kryteria przyznawania obywatelstwa polskiego."""
}

term = 10

try:
    print(f"Updating summaries for Term {term}...")
    for sitting_number, summary_md in updates.items():
        # Check if exists first
        exists = db.fetch_one(
            "SELECT id FROM sitting_summaries WHERE term = %s AND sitting_number = %s",
            (term, sitting_number)
        )
        
        if exists:
            print(f"Updating Sitting {sitting_number}...")
            db.execute(
                """
                UPDATE sitting_summaries 
                SET summary_md = %s, updated_at = NOW() 
                WHERE term = %s AND sitting_number = %s
                """,
                (summary_md, term, sitting_number)
            )
        else:
            print(f"Creating Sitting {sitting_number} (Did not exist)...")
            db.execute(
                """
                INSERT INTO sitting_summaries (term, sitting_number, summary_md, updated_at)
                VALUES (%s, %s, %s, NOW())
                """,
                (term, sitting_number, summary_md)
            )
    
    print("✅ Updates completed successfully.")

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()
