import psycopg2
from psycopg2.extras import execute_values
import re
import json

# DB Config
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

# --- PRO ARGUMENTS DICTIONARY (ULTRA EXPANDED) ---
KEYWORD_ARGUMENTS = {
    # == USTROJOWE I PRAWNE ==
    "trybunał konstytucyjn": {
        "pros": ["Przywrócenie praworządności", "Uporządkowanie statusu sędziów", "Wykonanie wyroków europejskich (TSUE/ETPC)"],
        "cons": ["Zarzuty o upolitycznienie zmian", "Ryzyko chaosu prawnego", "Spór kompetencyjny z Prezydentem"]
    },
    "krs": {
        "pros": ["Odpolitycznienie wyboru sędziów", "Przywrócenie zgodności z Konstytucją", "Odblokowanie środków z KPO"],
        "cons": ["Kwestionowanie statusu powołanych sędziów", "Długotrwały proces weryfikacji", "Ryzyko paraliżu sądownictwa"]
    },
    "sąd najwyższ": {
        "pros": ["Naprawa wymiaru sprawiedliwości", "Zapewnienie niezależności sądów"],
        "cons": ["Możliwość podważania prawomocnych wyroków", "Konflikt z obecnymi sędziami"]
    },
    "sąd powszechn": {
        "pros": ["Przyspieszenie postępowań", "Cyfryzacja akt sądowych", "Ułatwienie dostępu dla obywatela"],
        "cons": ["Kolejne zmiany organizacyjne", "Braki kadrowe w sekretariatach", "Zamiast reformy - karuzela stanowisk"]
    },
    "komornik": {
        "pros": ["Skuteczniejsza egzekucja długów", "Cyfryzacja licytacji", "Nadzór nad działalnością kancelarii"],
        "cons": ["Zagrożenie dla praw dłużnika", "Wzrost kosztów egzekucyjnych", "Nadmierna biurokracja"]
    },
    "notari": {
        "pros": ["Bezpieczeństwo obrotu prawnego", "Odciążenie sądów w sprawach spadkowych", "Cyfryzacja aktów"],
        "cons": ["Wysokie taksy notarialne", "Monopolizacja usług", "Utrudniony dostęp w mniejszych miejscowościach"]
    },
    "prokuratur": {
        "pros": ["Rozdzielenie funkcji Min. Sprawiedliwości i Prokuratora Gen.", "Niezależność śledczych", "Walka z przestępczością gospodarczą"],
        "cons": ["Ryzyko paraliżu decyzyjnego", "Konflikty wewnątrz środowiska", "Długotrwałość śledztw"]
    },
    "służb więzien": {
        "pros": ["Poprawa warunków pracy funkcjonariuszy", "Modernizacja zakładów karnych", "Programy resocjalizacyjne"],
        "cons": ["Przepełnienie więzień", "Niskie uposażenia", "Brak systemowego wsparcia psychologicznego"]
    },
    "kodeks wyborcz": {
        "pros": ["Zwiększenie frekwencji wyborczej", "Ułatwienie głosowania dla niepełnosprawnych", "Transparentność finansowania kampanii"],
        "cons": ["Złożoność nowych procedur dla komisji", "Ryzyko błędów przy liczeniu głosów", "Zarzuty o manipulację okręgami (gerrymandering)"]
    },
    "komisj śledcz": {
        "pros": ["Zbadanie głośnych afer", "Jawność życia publicznego", "Rozliczenie polityków"],
        "cons": ["Polityczny spektakl medialny", "Zastępowanie prokuratury", "Wykorzystywanie do walki partyjnej"]
    },
    "referendum": {
        "pros": ["Bezpośrednia demokracja", "Silny mandat społeczny", "Włączenie obywateli w proces decyzyjny"],
        "cons": ["Wysokie koszty", "Ryzyko populistycznych pytań", "Polaryzacja społeczna"]
    },

    # == GOSPODARKA I FINANSE ==
    "budżet": {
        "pros": ["Zapewnienie ciągłości finansowania państwa", "Środki na programy społeczne", "Inwestycje strategiczne"],
        "cons": ["Wysoki deficyt", "Kreatywna księgowość (fundusze celowe)", "Wzrost długu publicznego"]
    },
    "vat": {
        "pros": ["Uszczelnienie systemu podatkowego", "Walka z mafiami VAT-owskimi", "Dostosowanie do UE"],
        "cons": ["Komplikacja przepisów", "Uciążliwe raportowanie dla firm", "Ryzyko pomyłek przy stawkach"]
    },
    "cit": {
        "pros": ["Opodatkowanie wielkich korporacji", "Ulgi na innowacje (IP Box)", "Estoński CIT"],
        "cons": ["Skomplikowanie rozliczeń", "Niestabilność prawa", "Ryzyko ucieczki firm do rajów podatkowych"]
    },
    "podatek dochodow": {
        "pros": ["Kwota wolna od podatku", "Obniżenie klina dla najmniej zarabiających", "Progresja podatkowa"],
        "cons": ["Strata dochodów przez samorządy", "Bałagan w przepisach (Polski Ład)", "Ukryte podwyżki"]
    },
    "akcyz": {
        "pros": ["Wpływy do budżetu", "Polityka zdrowotna (alkohol/papierosy)", "Walka z nałogami"],
        "cons": ["Rozwój szarej strefy", "Wzrost cen dla konsumentów", "Uderzenie w branże (np. piwa rzemieślnicze)"]
    },
    "zamówienia publiczn": {
        "pros": ["Przejrzystość przetargów", "Walka z korupcją", "Wsparcie dla MŚP w przetargach"],
        "cons": ["Wydłużenie procedur", "Kryterium najniższej ceny", "Paraliż decyzyjny urzędników"]
    },
    "strefa ekonomiczn": {
        "pros": ["Przyciąganie inwestorów", "Nowe miejsca pracy", "Rozwój regionów"],
        "cons": ["Zwolnienia podatkowe kosztem budżetu", "Faworyzowanie dużych koncernów", "Nierówna konkurencja"]
    },
    "giełd": {
        "pros": ["Rozwój rynku kapitałowego", "Ochrona inwestorów", "Transparentność spółek"],
        "cons": ["Nadregulacja rynku", "Odpływ spółek z parkietu", "Wzrost kosztów debiutów"]
    },
    "ubezpiecz": {
        "pros": ["Ochrona konsumentów", "Stabilność rynku finansowego", "Nowe produkty emerytalne"],
        "cons": ["Wzrost składek OC/AC", "Klauzule abuzywne", "Biurokracja w likwidacji szkód"]
    },
    "upadłość": {
        "pros": ["Druga szansa dla dłużników", "Oddłużenie konsumentów", "Uporządkowanie relacji wierzyciel-dłużnik"],
        "cons": ["Straty dla wierzycieli", "Ryzyko nadużyć", "Zator w sądach upadłościowych"]
    },

    # == ZDROWIE ==
    "zdrow": {
        "pros": ["Zwiększenie nakładów na NFZ", "Poprawa dostępności leczenia", "Cyfryzacja (e-recepty)"],
        "cons": ["Niewystarczające kadry medyczne", "Kolejki do specjalistów", "Zadłużenie szpitali"]
    },
    "leki": {
        "pros": ["Rozszerzenie listy refundacyjnej", "Dostęp do nowoczesnych terapii", "Darmowe leki dla seniorów/dzieci"],
        "cons": ["Braki leków w aptekach", "Eksport równoległy", "Wysokie koszty dla budżetu"]
    },
    "psychiatr": {
        "pros": ["Reforma psychiatrii dziecięcej", "Centra zdrowia psychicznego", "Odestygmatyzowanie chorób"],
        "cons": ["Dramatyczny brak lekarzy", "Przepełnione oddziały", "Wieloletnie zaniedbania"]
    },
    "transplant": {
        "pros": ["Ratowanie życia", "Promocja donacji narządów", "Koordynacja poltransplantu"],
        "cons": ["Niska świadomość społeczna", "Braki sprzętowe", "Koszty procedur"]
    },
    "ratownictwo": {
        "pros": ["Nowoczesne karetki", "Lepsze zarobki ratowników", "Lotnicze Pogotowie Ratunkowe"],
        "cons": ["Przeciążenie systemu", "Agresja wobec ratowników", "Brak lekarzy w zespołach"]
    },
    "szczepien": {
        "pros": ["Ochrona przed chorobami zakaźnymi", "Odporność populacyjna", "Bezpłatny dostęp do szczepionek HPV"],
        "cons": ["Ruchy antyszczepionkowe", "Niepożądane odczyny poszczepienne", "Koszty zakupu preparatów"]
    },

    # == EDUKACJA I NAUKA ==
    "nauczyciel": {
        "pros": ["Podwyżki wynagrodzeń", "Podniesienie prestiżu zawodu", "Zatrzymanie odpływu kadr"],
        "cons": ["Wzrost kosztów dla samorządów", "Brak powiązania płacy z efektami", "Roszczenia innych grup zawodowych"]
    },
    "szkoł": {
        "pros": ["Unowocześnienie podstawy programowej", "Ograniczenie prac domowych", "Wsparcie psychologiczne"],
        "cons": ["Obniżanie wymagań", "Ideologizacja nauczania", "Chaos organizacyjny"]
    },
    "uczelni": {
        "pros": ["Zwiększenie autonomii uniwersytetów", "Wsparcie badań naukowych", "Współpraca z biznesem"],
        "cons": ["Grantoza i biurokracja", "Niskie stypendia doktoranckie", "Punktowa ewaluacja czasopism"]
    },
    "przedszkol": {
        "pros": ["Dostęp do opieki dla każdego dziecka", "Aktywizacja zawodowa rodziców", "Wyrównywanie szans edukacyjnych"],
        "cons": ["Brak miejsc w dużych miastach", "Koszty dla gmin", "Przepełnione grupy"]
    },
    "pan": {
        "pros": ["Wsparcie elity naukowej", "Niezależność badań", "Instytuty badawcze"],
        "cons": ["Skostniała struktura", "Niskie wynagrodzenia naukowców", "Brak komercjalizacji wyników"]
    },

    # == INFRASTRUKTURA I TRANSPORT ==
    "autostrad": {
        "pros": ["Budowa sieci szybkich dróg", "Poprawa bezpieczeństwa", "Rozwój gospodarczy regionów"],
        "cons": ["Wysokie opłaty za przejazd", "Hałas dla mieszkańców", "Betonoza"]
    },
    "kolej": {
        "pros": ["Transport ekologiczny", "Walka z wykluczeniem komunikacyjnym", "Nowy tabor (Pendolino/Intercity)"],
        "cons": ["Opóźnienia inwestycji PKP PLK", "Czasowe zamknięcia linii", "Drożejące bilety"]
    },
    "cpk": {
        "pros": ["Strategiczny hub transportowy", "Rozwój cargo", "Impuls rozwojowy dla Polski"],
        "cons": ["Gigantyczne koszty", "Wywłaszczenia ludzi", "Ryzyko przeskalowania"]
    },
    "port": {
        "pros": ["Rozwój handlu morskiego", "Terminali kontenerowych", "Terminali zbożowych"],
        "cons": ["Zagrożenie dla środowiska", "Hałas w miastach portowych", "Konieczność budowy infrastruktury dostępowej"]
    },
    "poczt": {
        "pros": ["Utrzymanie usług w całym kraju", "Operator narodowy", "Bezpieczeństwo korespondencji"],
        "cons": ["Nierentowność placówek", "Niskie płace listonoszy", "Konkurencja z paczkomatami"]
    },
    "kierowc": {
        "pros": ["Poprawa bezpieczeństwa na drogach", "Zaostrzenie kar dla piratów", "Konfiskata aut pijakom"],
        "cons": ["Wzrost kosztów mandatów/OC", "Niejasne przepisy pierwszeństwa", "Opór społeczny"]
    },

    # == ROLNICTWO I ŚRODOWISKO ==
    "rolnic": {
        "pros": ["Bezpieczeństwo żywnościowe", "Dopłaty bezpośrednie", "Wsparcie w sytuacjach kryzysowych"],
        "cons": ["Uzależnienie od dotacji", "Wpływ na środowisko", "Problemy ze zbytem (Ukraina)"]
    },
    "wsi": {
        "pros": ["Zrównoważony rozwój obszarów wiejskich", "Wsparcie Kół Gospodyń Wiejskich", "Infrastruktura (kanalizacja)"],
        "cons": ["Wyludnianie się wsi", "Brak komunikacji publicznej", "Dostęp do lekarza"]
    },
    "lasy": {
        "pros": ["Gospodarka drewnem", "Turystyka leśna", "Miejsca pracy na terenach wiejskich"],
        "cons": ["Nadmierna wycinka", "Eksport drewna do Chin", "Konflikt z ochroną przyrody"]
    },
    "zwierząt": {
        "pros": ["Walka z chorobami (ASF/Ptasia Grypa)", "Dobrostan zwierząt hodowlanych", "Bioasekuracja"],
        "cons": ["Likwidacja małych gospodarstw", "Koszty dostosowania do wymogów", "Utylizacja"]
    },
    "odpad": {
        "pros": ["Recykling i GOZ", "System kaucyjny", "Czyste środowisko"],
        "cons": ["Wzrost opłat za śmieci", "Dzikie wysypiska", "Pożary składowisk"]
    },
    "wod": {
        "pros": ["Retencja wody", "Ochrona przed suszą i powodzią", "Żegluga śródlądowa"],
        "cons": ["Betonowanie rzek", "Niszczenie ekosystemów", "Koszty utrzymania wałów"]
    },
    "węgiel": {
        "pros": ["Bezpieczeństwo energetyczne", "Tanie paliwo dla gospodarstw", "Miejsca pracy"],
        "cons": ["Smog i zanieczyszczenie", "Kary za emisję CO2", "Nieopłacalność wydobycia"]
    },

    # == ENERGETYKA ==
    "prąd": {
        "pros": ["Tarcze osłonowe dla odbiorców", "Rozbudowa sieci przesyłowych", "Liczniki inteligentne"],
        "cons": ["Wzrost cen energii", "Konieczność modernizacji sieci", "Opłaty mocowe"]
    },
    "klimat": {
        "pros": ["Walka z globalnym ociepleniem", "Transformacja energetyczna", "Czyste powietrze"],
        "cons": ["Koszty ETS", "Utrata konkurencyjności przemysłu", "Ubóstwo energetyczne"]
    },
    "gaz": {
        "pros": ["Dywersyfikacja dostaw (Baltic Pipe)", "Paliwo przejściowe", "Magazyny gazu"],
        "cons": ["Zależność od cen giełdowych", "Koszty infrastruktury", "Geopolityka"]
    },
    "atom": {
        "pros": ["Stabilna, czysta energia", "Niezależność energetyczna", "Nowoczesne technologie"],
        "cons": ["Ogromne koszty budowy", "Długi czas realizacji", "Problem z odpadami"]
    },

    # == SPOŁECZNE I RODZINA ==
    "rodzin": {
        "pros": ["Wsparcie demografii", "Redukcja ubóstwa dzieci", "Programy 800+"],
        "cons": ["Wysokie koszty transferów", "Brak efektu demograficznego", "Dezaktywizacja zawodowa kobiet"]
    },
    "senior": {
        "pros": ["Leki 75+", "13. i 14. emerytura", "Aktywizacja seniorów"],
        "cons": ["Obciążenie systemu emerytalnego", "Rozwiązania doraźne a nie systemowe", "Inflacja"]
    },
    "niepełnosprawn": {
        "pros": ["Świadczenie wspierające", "Asystent osobisty", "Dostępność architektoniczna"],
        "cons": ["System orzecznictwa do zmiany", "Wciąż niskie wsparcie finansowe", "Biurokracja"]
    },
    "przemoc": {
        "pros": ["Natychmiastowa izolacja sprawcy", "Ochrona ofiar (Niebieska Karta)", "Wsparcie psychologiczne"],
        "cons": ["Ryzyko fałszywych oskarżeń", "Problemy z egzekucją prawa", "Brak mieszkań chronionych"]
    },
    "mieszk": {
        "pros": ["Wsparcie w zakupie (Kredyt 0%)", "Budownictwo społeczne (SIM)", "Ochrona lokatorów"],
        "cons": ["Wzrost cen mieszkań", "Brak mieszkań komunalnych", "Trudności z eksmisją"]
    },

    # == OBRONNOŚĆ I SŁUŻBY ==
    "wojsk": {
        "pros": ["Modernizacja techniczna", "Zwiększenie liczebności armii", "WOT"],
        "cons": ["Rekordowe wydatki zbrojeniowe", "Problemy z rekrutacją", "Brak infrastruktury dla sprzętu"]
    },
    "policj": {
        "pros": ["Bezpieczeństwo wewnętrzne", "Modernizacja komend", "Nowy sprzęt"],
        "cons": ["Braki kadrowe (wakaty)", "Upolitycznienie", "Niskie zaufanie społeczne"]
    },
    "granic": {
        "pros": ["Ochrona granicy wschodniej", "Zapora elektroniczna", "Walka z przemytem"],
        "cons": ["Kryzys humanitarny", "Push-backi", "Koszty utrzymania straży"]
    },
    "weteran": {
        "pros": ["Opieka nad weteranami misji", "Dodatki do emerytur", "Szacunek dla munduru"],
        "cons": ["Problemy z dostępem do leczenia", "PTSD", "Biurokracja"]
    },

    # == CYFRYZACJA I ADMIN ==
    "cyfrow": {
        "pros": ["mObywatel - dokumenty w telefonie", "e-Urząd", "Cyberbezpieczeństwo"],
        "cons": ["Wykluczenie cyfrowe starszych", "Awarie systemów", "Ryzyko wycieku danych"]
    },
    "cudzoziem": {
        "pros": ["Uzupełnianie luk na rynku pracy", "Integracja społeczna", "Wsparcie dla uchodźców"],
        "cons": ["Dumping płacowy", "Problemy kulturowe", "Zagrożenie bezpieczeństwa"]
    },
    "samorząd": {
        "pros": ["Decentralizacja", "Inwestycje blisko ludzi", "Wspólnoty lokalne"],
        "cons": ["Utrata dochodów z PIT", "Zależność od dotacji centralnych", "Zadłużenie gmin"]
    },
    "paszport": {
        "pros": ["Nowoczesne dokumenty biometryczne", "Ułatwienia w wyrabianiu", "Bezpieczeństwo tożsamości"],
        "cons": ["Kolejki w urzędach", "Koszt wymiany", "Problemy techniczne rejestrów"]
    },

    # == ŚWIATOPOGLĄD ==
    "aborcj": {
        "pros": ["Prawo do decydowania", "Bezpieczeństwo zdrowotne kobiet", "Standardy europejskie"],
        "cons": ["Ochrona życia poczętego", "Wartości chrześcijańskie", "Konstytucja"]
    },
    "in vitro": {
        "pros": ["Leczenie niepłodności", "Szczęście rodzin", "Refundacja z budżetu"],
        "cons": ["Dylematy etyczne", "Sprzeciw Kościoła", "Koszty"]
    },
    "związki": {
        "pros": ["Równość wobec prawa", "Dziecziczenie i informacja medyczna", "Prawa człowieka"],
        "cons": ["Definicja małżeństwa w konstytucji", "Ochrona tradycyjnej rodziny", "Polaryzacja"]
    },
    "kościół": {
        "pros": ["Fundusz Kościelny", "Działalność charytatywna", "Tradycja narodowa"],
        "cons": ["Rozdział państwa od kościoła", "Finansowanie religii w szkołach", "Skandale pedofilskie"]
    },

    # == KULTURA I MEDIA ==
    "kultur": {
        "pros": ["Wsparcie artystów", "Ochrona dziedzictwa narodowego", "Promocja Polski za granicą"],
        "cons": ["Cenzura i naciski polityczne", "Niskie zarobki w kulturze", "Granty dla swoich"]
    },
    "medi": {
        "pros": ["Pluralizm medialny", "Misja publiczna", "Rzetelna informacja"],
        "cons": ["Propaganda w TVP", "Miliardy na media rządowe", "Podziały społeczne"]
    },
    "zabytk": {
        "pros": ["Odbudowa zabytków (Pałac Saski)", "Renowacja kościołów", "Turystyka historyczna"],
        "cons": ["Gigantyczne koszty odbudowy", "Zaniedbanie zabytków techniki", "Polityka historyczna"]
    },

    # == PROCEDURALNE (GENERIC) ==
    "wotum nieufności": {
        "pros": ["Weryfikacja działań rządu/ministra", "Realizacja konstytucyjnej funkcji kontrolnej", "Publiczna debata o błędach władzy"],
        "cons": ["Destabilizacja prac ministerstwa", "Polityczny spektakl zamiast merytoryki", "Brak szans na powodzenie (matematyka sejmowa)"]
    },
    "odrzucenie": {
        "pros": ["Zatrzymanie szkodliwej legislacji", "Skierowanie projektu do kosza", "Oszczędność czasu Sejmu"],
        "cons": ["Zablokowanie prac nad ważnym tematem", "Brak debaty merytorycznej w komisjach", "Odrzucenie w pierwszym czytaniu"]
    },
    "referendum": {
        "pros": ["Oddanie głosu obywatelom", "Bezpośrednia demokracja", "Silny mandat społeczny dla decyzji"],
        "cons": ["Wysokie koszty przeprowadzenia", "Ryzyko pytań z tezą (manipulacja)", "Zbytnia polaryzacja społeczeństwa"]
    },
    "skład": {
        "pros": ["Uzupełnienie wakatów w komisjach", "Zapewnienie parytetów politycznych", "Sprawniejsza praca organów Sejmu"],
        "cons": ["Spory o podział miejsc", "Bojkotowanie kandydatur opozycji", "Przewlekłość procedur"]
    }
}

DEFAULT_PROS = ["Realizacja celów statutowych wnioskodawcy", "Dostosowanie przepisów do zmiennej rzeczywistości", "Uporządkowanie legislacji"]
DEFAULT_CONS = ["Ryzyko inflacji prawa", "Wątpliwości legislacyjne Biura Analiz Sejmowych", "Krótki czas na konsultacje społeczne"]

def create_rich_summary(title, category, verdict):
    """
    Creates a Context-Aware, "human-like" summary based on title patterns.
    """
    title_lower = title.lower()
    
    # -- HEURISTIC 1: Detect Vote Type --
    vote_type = "Inne"
    if "uchwale senatu" in title_lower:
        vote_type = "Senat"
    elif "trzecie czytanie" in title_lower or "głosowanie nad całością" in title_lower:
        vote_type = "Final"
    elif "wotum nieufności" in title_lower:
        vote_type = "Wotum"
    elif "pierwsze czytanie" in title_lower:
        vote_type = "FirstReading"
    elif "odrzucenie" in title_lower:
        vote_type = "Rejection"
    elif "powołanie" in title_lower or "wybór" in title_lower or "odwołanie" in title_lower:
        vote_type = "Personal"
    elif "sprawozdanie komisji" in title_lower:
        vote_type = "Report"

    # -- HEURISTIC 2: Detect Action --
    action_desc = "rozstrzygnął wniosek"
    if verdict == "PRZYJĘTO":
        if vote_type == "Senat": action_desc = "przyjął uchwałę Senatu (lub odrzucił poprawki zgodnie z wnioskiem komisji)"
        elif vote_type == "Final": action_desc = "uchwalił ustawę, kończąc proces legislacyjny w Sejmie"
        elif vote_type == "Wotum": action_desc = "udzielił wotum nieufności (rząd/minister odwołany)"
        elif vote_type == "Rejection": action_desc = "odrzucił projekt w całości (koniec prac legislacyjnych)"
        elif vote_type == "Personal": action_desc = "powołał/wybrał kandydata na stanowisko"
        else: action_desc = "przyjął wniosek/projekt"
    elif verdict == "ODRZUCONO":
        if vote_type == "Senat": action_desc = "odrzucił stanowisko Senatu"
        elif vote_type == "Final": action_desc = "nie uchwalił ustawy (projekt upada)"
        elif vote_type == "Wotum": action_desc = "obronił rząd/ministra (wotum nieufności odrzucone)"
        elif vote_type == "Rejection": action_desc = "nie zgodził się na odrzucenie projektu (prace trwają dalej)"
        elif vote_type == "Personal": action_desc = "odrzucił kandydaturę"
        else: action_desc = "odrzucił wniosek/projekt"

    # -- HEURISTIC 3: Extract Core Subject --
    # Try to clean the title to get the "meat"
    subject = title
    # Remove prefix "Pkt X. Sprawozdanie Komisji o..."
    subject = re.sub(r'^Pkt \d+\.?\s*(porz\. dzien\.)?\s*', '', subject, flags=re.IGNORECASE)
    subject = re.sub(r'^Sprawozdanie Komisji o\s+', '', subject, flags=re.IGNORECASE)
    subject = re.sub(r'^rządowym projekcie ustawy', 'rządowym projekcie', subject, flags=re.IGNORECASE)
    subject = re.sub(r'^poselskim projekcie ustawy', 'poselskim projekcie', subject, flags=re.IGNORECASE)
    
    # Cap length
    if len(subject) > 200:
        subject = subject[:197] + "..."

    summary = f"Sejm {action_desc}. Przedmiotem głosowania było: {subject}."
    
    # Add context for specific types
    if vote_type == "Senat":
        summary += " Głosowanie dotyczyło poprawek lub stanowiska wniesionego przez izbę wyższą."
    if vote_type == "Final":
        summary += " Ustawa trafi teraz do Senatu lub do podpisu Prezydenta."

    return summary

def generate_heuristic_analysis_pro():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("🚀 Starting PRO Heuristic Analysis Engine (Level: 3 - ULTRA)...")
    
    cur.execute("SELECT id, title_clean, verdict, category FROM votes ORDER BY date DESC")
    votes = cur.fetchall()
    
    total = len(votes)
    print(f"📊 Analyzing {total} votes with ULTRA-EXPANDED logic...")
    
    batch_data = []
    
    for idx, row in enumerate(votes):
        vote_id, title, verdict, category = row
        title_lower = title.lower()
        
        # 1. Generate PRO Summary
        summary = create_rich_summary(title, category, verdict)
        
        # 2. Generate Context-Aware Pros/Cons (MULTI-CONTEXT MODE)
        pros = []
        cons = []
        detected_topics = []
        
        # Scan for ALL matching keywords to build richer context (2X Depth)
        for kw, data in KEYWORD_ARGUMENTS.items():
            if kw in title_lower:
                detected_topics.append(kw)
                pros.extend(data["pros"])
                cons.extend(data["cons"])
        
        # If we found specific topics, deduplicate and prioritize
        if detected_topics:
            # Sort topics by length (longest usually most specific) to maybe prioritize their args? 
            # Actually, just mixing them gives the "Rich Context" requested.
            
            # Deduplicate while preserving order
            pros = list(dict.fromkeys(pros))
            cons = list(dict.fromkeys(cons))
            
            # Add context tags to summary
            # clean up tags for display (remove raw stems if possible, but raw keys act as tags here)
            tags = [t.capitalize() for t in detected_topics]
            # Take top 3 unique tags to avoid clutter
            tags_display = list(dict.fromkeys(tags))[:4]
            summary += f" Zidentyfikowane obszary: {', '.join(tags_display)}."
            
        else:
            # Fallback logic
            if "odrzucenie" in title_lower:
                 pros = KEYWORD_ARGUMENTS["odrzucenie"]["pros"]
                 cons = KEYWORD_ARGUMENTS["odrzucenie"]["cons"]
            elif "wybór" in title_lower or "powołanie" in title_lower:
                 pros = ["Uzupełnienie składu organu państwa", "Zapewnienie ciągłości działania instytucji"]
                 cons = ["Zastrzeżenia do kandydatur", "Brak konsensusu politycznego"]
            else:
                 pros = DEFAULT_PROS
                 cons = DEFAULT_CONS

        # JSON formatting
        pros_json = json.dumps(pros, ensure_ascii=False)
        cons_json = json.dumps(cons, ensure_ascii=False)
        
        batch_data.append((vote_id, summary, pros_json, cons_json))
        
        if len(batch_data) >= 500:
            upsert_query = """
            INSERT INTO vote_analyses (vote_id, summary, pros, cons, created_at)
            VALUES %s
            ON CONFLICT (vote_id) DO UPDATE SET
                summary = EXCLUDED.summary,
                pros = EXCLUDED.pros,
                cons = EXCLUDED.cons,
                created_at = NOW();
            """
            execute_values(cur, upsert_query, batch_data, template="(%s, %s, %s::jsonb, %s::jsonb, NOW())")
            conn.commit()
            print(f"  Processed {idx+1}/{total}")
            batch_data = []

    if batch_data:
        upsert_query = """
        INSERT INTO vote_analyses (vote_id, summary, pros, cons, created_at)
        VALUES %s
        ON CONFLICT (vote_id) DO UPDATE SET
            summary = EXCLUDED.summary,
            pros = EXCLUDED.pros,
            cons = EXCLUDED.cons,
            created_at = NOW();
        """
        execute_values(cur, upsert_query, batch_data, template="(%s, %s, %s::jsonb, %s::jsonb, NOW())")
        conn.commit()
    
    print("\n✅ PRO Analysis Complete (ULTRA EDITION)!")
    conn.close()

if __name__ == "__main__":
    generate_heuristic_analysis_pro()
