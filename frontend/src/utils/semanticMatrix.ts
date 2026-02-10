
export interface SemanticEntry {
    coreTerm: string;
    intent: string[]; // User queries (slang, simplifications)
    legal: string[];  // Formal legislative terms
    related: string[]; // Broad context
}

export const SEMANTIC_MATRIX: SemanticEntry[] = [
    // --- 1. ECONOMY & TAXES (Gospodarka) ---
    {
        coreTerm: "Inflacja",
        intent: ["drożyzna", "ceny w sklepach", "paragony grozy", "siła nabywcza", "koszyk zakupowy"],
        legal: ["wskaźnik cen towarów i usług", "polityka pieniężna", "cel inflacyjny"],
        related: ["NBP", "Rada Polityki Pieniężnej", "stopy procentowe", "Glapiński"]
    },
    {
        coreTerm: "Podatek Dochodowy",
        intent: ["PIT", "podatek od pensji", "kwota wolna", "drugi próg", "złodziejstwo"],
        legal: ["podatek dochodowy od osób fizycznych", "ustawa o PIT", "skala podatkowa"],
        related: ["Nowy Ład", "Polski Ład", "ulga dla klasy średniej", "rozliczenie roczne"]
    },
    {
        coreTerm: "VAT",
        intent: ["podatek od towarów", "paragon", "faktura"],
        legal: ["podatek od towarów i usług", "stawki VAT", "matryca stawek VAT"],
        related: ["Tarcza Antyinflacyjna", "obniżka VAT", "zerowy VAT na żywność"]
    },
    {
        coreTerm: "Polski Ład",
        intent: ["nowy ład", "reforma podatkowa", "bałagan podatkowy"],
        legal: ["ustawa o zmianie ustawy o podatku dochodowym", "reforma systemu podatkowego"],
        related: ["składka zdrowotna", "ulga dla klasy średniej", "Morawiecki"]
    },
    {
        coreTerm: "KPO",
        intent: ["pieniądze z unii", "fundusz odbudowy", "kamienie milowe", "euro"],
        legal: ["Krajowy Plan Odbudowy", "Instrument na rzecz Odbudowy i Zwiększania Odporności"],
        related: ["praworządność", "Sąd Najwyższy", "Trybunał Sprawiedliwości UE", "dotacje"]
    },
    {
        coreTerm: "Budżet Państwa",
        intent: ["dziura budżetowa", "finanse kraju", "zadłużenie", "dług"],
        legal: ["ustawa budżetowa", "deficyt budżetowy", "dług publiczny"],
        related: ["obligacje", "Rada Polityki Pieniężnej", "wydatki socjalne"]
    },
    {
        coreTerm: "Tarcza Antykryzysowa",
        intent: ["pomoc dla firm", "postojowe", "tarcza finansowa", "pfr"],
        legal: ["ustawa o szczególnych rozwiązaniach związanych z zapobieganiem COVID-19", "wsparcie przedsiębiorców"],
        related: ["lockdown", "pandemia", "umorzenie subwencji"]
    },
    {
        coreTerm: "Wakacje Kredytowe",
        intent: ["zawieszenie raty", "przerwa w spłacaniu", "pomoc dla kredytobiorców"],
        legal: ["ustawa o finansowaniu społecznościowym dla przedsięwzięć gospodarczych i pomocy kredytobiorcom"],
        related: ["WIBOR", "banki", "stopy procentowe", "rata"]
    },
    {
        coreTerm: "Bezpieczny Kredyt 2%",
        intent: ["kredyt 2 procent", "mieszkanie dla młodych", "dopłaty do kredytu", "pierwsze mieszkanie"],
        legal: ["ustawa o pomocy państwa w oszczędzaniu na cele mieszkaniowe"],
        related: ["zdolność kredytowa", "deweloperzy", "ceny mieszkań"]
    },

    // --- 2. ENERGY & ENVIRONMENT (Energetyka) ---
    {
        coreTerm: "Węgiel",
        intent: ["brak opału", "tani węgiel", "ekogroszek", "węgiel z kolumbii"],
        legal: ["ustawa o dodatku węglowym", "paliwa stałe", "bezpieczeństwo energetyczne"],
        related: ["Polska Grupa Górnicza", "skład węgla", "dopłaty do ogrzewania"]
    },
    {
        coreTerm: "Prąd",
        intent: ["rachunki za prąd", "ceny energii", "licznik", "zmiana taryfy"],
        legal: ["ustawa o środkach nadzwyczajnych mających na celu ograniczenie wysokości cen energii", "taryfy energetyczne"],
        related: ["zamrożenie cen", "limit 2000 kWh", "Tauron", "PGE"]
    },
    {
        coreTerm: "OZE",
        intent: ["fotowoltaika", "panele słoneczne", "wiatraki", "zielona energia"],
        legal: ["odnawialne źródła energii", "ustawa o inwestycjach w zakresie elektrowni wiatrowych"],
        related: ["Mój Prąd", "prosument", "zasada 10H", "net-billing"]
    },
    {
        coreTerm: "Atom",
        intent: ["elektrownia jądrowa", "reaktor", "energia atomowa"],
        legal: ["program polskiej energetyki jądrowej", "obiekt energetyki jądrowej"],
        related: ["Choczewo", "bezpieczeństwo energetyczne", "Westinghouse"]
    },
    {
        coreTerm: "Ochrona Środowiska",
        intent: ["ekologia", "zatrucie rzeki", "śnięte ryby", "wycinka lasów"],
        legal: ["prawo ochrony środowiska", "ocena oddziaływania na środowisko"],
        related: ["Odra", "Lasy Państwowe", "klimat", "globalne ocieplenie"]
    },
    {
        coreTerm: "Smog",
        intent: ["czyste powietrze", "kopciuchy", "jakość powietrza", "alarm smogowy"],
        legal: ["normy emisji", "wymiana źródeł ciepła"],
        related: ["uchwała antysmogowa", "PM10", "Program Czyste Powietrze"]
    },

    // --- 3. SOCIAL & FAMILY (Rodzina) ---
    {
        coreTerm: "800 Plus",
        intent: ["500 plus", "pieniądze na dziecko", "waloryzacja 500", "socjal"],
        legal: ["świadczenie wychowawcze", "ustawa o pomocy państwa w wychowywaniu dzieci"],
        related: ["dzietność", "demografia", "wsparcie rodzin"]
    },
    {
        coreTerm: "13. Emerytura",
        intent: ["trzynastka", "czternastka", "dodatkowa emerytura", "pieniądze dla seniorów"],
        legal: ["dodatkowe roczne świadczenie pieniężne dla emerytów i rencistów"],
        related: ["waloryzacja rent", "ZUS", "wiek emerytalny", "seniorzy"]
    },
    {
        coreTerm: "Renta Wdowia",
        intent: ["emerytura po mężu", "świadczenie dla wdów", "dziedziczenie emerytury"],
        legal: ["zbieg prawa do świadczeń emerytalno-rentowych"],
        related: ["zabezpieczenie społeczne", "seniorzy", "wdowiec"]
    },
    {
        coreTerm: "Babciowe",
        intent: ["aktywny rodzic", "pieniądze na żłobek", "opiekunka"],
        legal: ["świadczenie aktywny rodzic", "ustawa o opiece nad dziećmi w wieku do lat 3"],
        related: ["żłobki", "aktywizacja zawodowa kobiet", "urlop macierzyński"]
    },
    {
        coreTerm: "Aborcja",
        intent: ["strajk kobiet", "protesty", "wyrok trybunału", "przerywanie ciąży"],
        legal: ["terminacja ciąży", "ochrona życia poczętego", "wyrok TK K 1/20"],
        related: ["klauzula sumienia", "prawa kobiet", "referendum aborcyjne"]
    },
    {
        coreTerm: "In Vitro",
        intent: ["leczenie niepłodności", "dzieci z probówki", "finansowanie in vitro"],
        legal: ["procedura zapłodnienia pozaustrojowego", "medycznie wspomagana prokreacja"],
        related: ["Naprotechnologia", "demografia", "refundacja"]
    },

    // --- 4. JUSTICE & LAW (Prawo) ---
    {
        coreTerm: "Praworządność",
        intent: ["wolne sądy", "konstytucja", "reforma sądownictwa", "konflikt z ue"],
        legal: ["ustrój sądów powszechnych", "niezawisłość sędziowska"],
        related: ["Komisja Europejska", "artykuł 7", "TSUE"]
    },
    {
        coreTerm: "KRS",
        intent: ["krajowa rada sądownictwa", "neo-krs", "nominacje sędziowskie"],
        legal: ["ustawa o Krajowej Radzie Sądownictwa"],
        related: ["sędziowie", "Prezydent", "opiniowanie kandydatów"]
    },
    {
        coreTerm: "Sąd Najwyższy",
        intent: ["izba dyscyplinarna", "wybory", "ważność wyborów"],
        legal: ["ustawa o Sądzie Najwyższym", "Izba Odpowiedzialności Zawodowej"],
        related: ["Małgorzata Manowska", "dyscyplinarki", "immunitet"]
    },
    {
        coreTerm: "Komisja Śledcza",
        intent: ["przesłuchania", "afera", "wyjaśnianie", "świadek", "wezwanie"],
        legal: ["sejmowa komisja śledcza", "uchwała o powołaniu komisji śledczej"],
        related: ["wybory kopertowe", "Pegasus", "afera wizowa"]
    },
    {
        coreTerm: "Pegasus",
        intent: ["inwigilacja", "podsłuchy", "szpiegowanie", "telefon"],
        legal: ["kontrola operacyjna", "techniki operacyjne", "służby specjalne"],
        related: ["CBA", "Brejza", "Wąsik", "wybory 2019"]
    },

    // --- 5. DEFENSE & FOREIGN AFFAIRS (Bezpieczeństwo) ---
    {
        coreTerm: "Obronność",
        intent: ["zbrojenia", "zakupy broni", "himars", "abrams", "f-35"],
        legal: ["ustawa o obronie ojczyzny", "modernizacja techniczna sił zbrojnych"],
        related: ["NATO", "USA", "Błaszczak", "PKB na wojsko"]
    },
    {
        coreTerm: "Granica",
        intent: ["mur na granicy", "białoruś", "imigranci", "straż graniczna", "zapora"],
        legal: ["ochrona granicy państwowej", "ustawa o budowie zabezpieczenia granicy"],
        related: ["uchodźcy", "stan wyjątkowy", "wojna hybrydowa"]
    },
    {
        coreTerm: "Ukraina",
        intent: ["wojna", "pomoc uchodźcom", "zelenski", "putin", "agresja rosji"],
        legal: ["ustawa o pomocy obywatelom Ukrainy w związku z konfliktem zbrojnym", "specustawa ukraińska"],
        related: ["nadanie numeru PESEL", "świadczenia dla uchodźców", "solidarność"]
    },
    {
        coreTerm: "Wiza",
        intent: ["afera wizowa", "konsulaty", "sprzedaż wiz", "imigracja"],
        legal: ["procedura wizowa", "ustawa o cudzoziemcach"],
        related: ["MSZ", "Wawrzyk", "pracownicy z zagranicy"]
    },

    // --- 6. HEALTH (Zdrowie) ---
    {
        coreTerm: "Szczepienia",
        intent: ["szczepionka na covid", "antyszczepionkowcy", "nop", "certyfikat covid"],
        legal: ["Narodowy Program Szczepień", "zwalczanie chorób zakaźnych"],
        related: ["pandemia", "sanepid", "paszport covidowy"]
    },
    {
        coreTerm: "Szpitalnictwo",
        intent: ["kolejki do lekarza", "sor", "oddziały", "brak lekarzy"],
        legal: ["sieć szpitali", "świadczenia opieki zdrowotnej", "finansowanie służby zdrowia"],
        related: ["NFZ", "rezydenci", "wynagrodzenia medyków"]
    },
    {
        coreTerm: "Leki",
        intent: ["darmowe leki dla seniorów", "refundacja", "brak leków w aptekach"],
        legal: ["prawo farmaceutyczne", "ustawa o refundacji leków"],
        related: ["lista leków refundowanych", "75+", "antybiotyki"]
    },

    // --- 7. AGRICULTURE (Rolnictwo) ---
    {
        coreTerm: "Zboże",
        intent: ["zboże z ukrainy", "zboże techniczne", "skup zbóż", "blokady rolnicze"],
        legal: ["rynek rolny", "ochrona rynku zbóż", "cła"],
        related: ["Telus", "magazyny", "protesty rolników"]
    },
    {
        coreTerm: "Nawozy",
        intent: ["ceny nawozów", "drogie nawozy", "azoty"],
        legal: ["wsparcie dla rynku nawozów", "dopłaty do zakupu nawozów"],
        related: ["Grupa Azoty", "gaz ziemny", "rolnictwo"]
    },
    {
        coreTerm: "ASF",
        intent: ["świnie", "pomór świń", "odszkodowania dla rolników"],
        legal: ["afrykański pomór świń", "zwalczanie chorób zakaźnych zwierząt"],
        related: ["bioasekuracja", "hodowla", "weterynaria"]
    },

    // --- 8. HOUSING & TRANSPORT (Infrastruktura) ---
    {
        coreTerm: "CPK",
        intent: ["lotnisko w baranowie", "megalotnisko", "wywłaszczenia", "kolej dużych prędkości"],
        legal: ["Centralny Port Komunikacyjny", "program inwestycyjny CPK"],
        related: ["Horała", "LOT", "szprychy kolejowe"]
    },
    {
        coreTerm: "Patodeweloperka",
        intent: ["klitki", "chów klatkowy", "mikroapartamenty", "betonoza"],
        legal: ["warunki techniczne budynków", "prawo budowlane"],
        related: ["deweloperzy", "ceny mieszkań", "planowanie przestrzenne"]
    },
    {
        coreTerm: "Samorząd",
        intent: ["gmina", "wójt", "powiat", "pieniądze dla samorządów", "janosikowe"],
        legal: ["ustawa o samorządzie gminnym", "dochody jednostek samorządu terytorialnego"],
        related: ["subwencja oświatowa", "Polska Lokalna", "inwestycje samorządowe"]
    },

    // --- 9. NEW SATURATION BATCH (Media & Conflict) ---
    {
        coreTerm: "Kredyt we Frankach",
        intent: ["frankowicze", "kredyt w chf", "raty we frankach", "pozew banku", "przewalutowanie", "kurs franka"],
        legal: ["kredyt denominowany", "kredyt indeksowany", "klauzule abuzywne", "umowy kredytowe waloryzowane"],
        related: ["TSUE", "wyrok Dziubak", "ugody bankowe", "KNF", "Związek Banków Polskich"]
    },
    {
        coreTerm: "Podatek Katastralny",
        intent: ["podatek od wartości mieszkania", "kataster", "opodatkowanie majątku", "haracz od własności", "nowy podatek od nieruchomości"],
        legal: ["wartość katastralna nieruchomości", "powszechna taksacja nieruchomości", "system katastralny"],
        related: ["rentierzy", "spekulanci", "rynek mieszkaniowy", "lobby deweloperskie", "Ikonowicz"]
    },
    {
        coreTerm: "Handel w Niedzielę",
        intent: ["zakaz handlu", "niedziele handlowe", "sklepy otwarte w niedzielę", "żabka", "kasjerzy"],
        legal: ["ustawa o ograniczeniu handlu w niedziele i święta", "placówki handlowe"],
        related: ["Solidarność", "Piotr Duda", "pracownicy handlu", "wyjątki od zakazu"]
    },
    {
        coreTerm: "Karta Nauczyciela",
        intent: ["zarobki nauczycieli", "pensum", "strajk nauczycieli", "godziny przy tablicy", "urlop dla poratowania zdrowia"],
        legal: ["ustawa Karta Nauczyciela", "stopnie awansu zawodowego nauczycieli", "wynagrodzenie zasadnicze"],
        related: ["ZNP", "Broniarz", "Czarnek", "subwencja oświatowa", "szkoła"]
    },
    {
        coreTerm: "CBA",
        intent: ["agenci", "służby specjalne", "walka z korupcją", "zatrzymania", "Kamiński i Wąsik"],
        legal: ["Centralne Biuro Antykorupcyjne", "ustawa o CBA", "służba specjalna do spraw zwalczania korupcji"],
        related: ["Pegasus", "afera gruntowa", "przestępczość gospodarcza", "kontrola operacyjna"]
    },
    {
        coreTerm: "Oświadczenia Majątkowe",
        intent: ["majątek polityków", "ujawnienie majątku", "przepisanie na żonę", "willa plus", "ukrywanie dochodów"],
        legal: ["oświadczenie o stanie majątkowym", "rejestr korzyści", "jawność życia publicznego"],
        related: ["Morawiecki", "Obajtek", "działki", "korupcja", "CBA"]
    },
    {
        coreTerm: "Fundusze Europejskie",
        intent: ["dotacje z unii", "środki unijne", "dofinansowanie", "fundusze spójności", "rozwój regionalny"],
        legal: ["perspektywa finansowa UE", "porozumienie partnerstwa", "polityka spójności"],
        related: ["KPO", "Bruksela", "Komisja Europejska", "inwestycje samorządowe", "projekty unijne"]
    },
    {
        coreTerm: "Reforma Sądownictwa",
        intent: ["wolne sądy", "sędziowie", "kastą", "polityczni sędziowie", "usuwanie sędziów"],
        legal: ["ustawy sądowe", "nowelizacja ustawy o ustroju sądów powszechnych", "skarga nadzwyczajna"],
        related: ["Ziobro", "Duda", "weto prezydenta", "łańcuchy światła", "TSUE"]
    },
    {
        coreTerm: "Wiek Emerytalny",
        intent: ["praca do śmierci", "emerytura 60 65", "obniżenie wieku", "staż pracy"],
        legal: ["powszechny wiek emerytalny", "ustawa o emeryturach i rentach z FUS"],
        related: ["Tusk", "referendum emerytalne", "ZUS", "system repartycyjny", "rynek pracy"]
    },
    {
        coreTerm: "Bezpieczeństwo Energetyczne",
        intent: ["ceny prądu", "brak prądu", "niezależność energetyczna", "gaz z rosji", "baltic pipe"],
        legal: ["polityka energetyczna polski", "zapasy paliw", "dywersyfikacja dostaw"],
        related: ["Orlen", "PGNiG", "Nord Stream", "węgiel", "atom"]
    },
    {
        coreTerm: "Lex TVN",
        intent: ["wolne media", "koncesja dla tvn", "kapitał zagraniczny", "discovery", "protesty mediów"],
        legal: ["nowelizacja ustawy o radiofonii i telewizji", "koncesja na rozpowszechnianie programów"],
        related: ["KRRiT", "Świrski", "weto prezydenta", "czarny ekran", "wolność słowa"]
    },
    {
        coreTerm: "Tarcza Antyinflacyjna",
        intent: ["obniżka vat", "tańsze paliwo", "dodatek osłonowy", "walka z inflacją", "zerowy vat na żywność"],
        legal: ["ustawa o zmianie ustawy o podatku od towarów i usług", "tarcza solidarnościowa"],
        related: ["Orlen", "ceny paliw", "stacje benzynowe", "Morawiecki", "drożyzna"]
    },
    {
        coreTerm: "Bon Turystyczny",
        intent: ["500 na wakacje", "pieniądze na wczasy", "darmowe wakacje", "wsparcie turystyki"],
        legal: ["polski bon turystyczny", "pomoc dla branży turystycznej"],
        related: ["wakacje", "ZUS", "dzieci", "COVID-19", "hotele"]
    },
    {
        coreTerm: "Podatek od Pustych Mieszkań",
        intent: ["pustostany", "spekulacja mieszkaniami", "flipperzy", "trzecie mieszkanie"],
        legal: ["opodatkowanie pustostanów", "podatek od czynności cywilnoprawnych"],
        related: ["kryzys mieszkaniowy", "najem instytucjonalny", "Lewica", "deweloperzy"]
    },
    {
        coreTerm: "Koalicja Obywatelska",
        intent: ["platforma", "PO", "nowoczesna", "zieloni", "inicjatywa polska", "opozycja"],
        legal: ["Koalicyjny Komitet Wyborczy Koalicja Obywatelska", "klub parlamentarny KO"],
        related: ["Tusk", "Budka", "Trzaskowski", "program wyborczy", "100 konkretów"]
    },
    {
        coreTerm: "Prawo i Sprawiedliwość",
        intent: ["PiS", "zjednoczona prawica", "partia rządząca", "nowogrodzka", "dobra zmiana"],
        legal: ["Komitet Wyborczy Prawo i Sprawiedliwość", "klub parlamentarny PiS"],
        related: ["Kaczyński", "Morawiecki", "witek", "Błaszczak", "polski ład"]
    },
    {
        coreTerm: "Lewica",
        intent: ["SLD", "Wiosna", "Razem", "partia razem", "socjaldemokracja"],
        legal: ["Koalicyjny Komitet Wyborczy Lewica", "klub parlamentarny Lewica"],
        related: ["Czarzasty", "Biedroń", "Zandberg", "prawa kobiet", "świeckie państwo"]
    },
    {
        coreTerm: "Trzecia Droga",
        intent: ["hołownia", "psl", "polska 2050", "kosiniak-kamysz", "rolnicy i ekolodzy"],
        legal: ["Koalicyjny Komitet Wyborczy Trzecia Droga", "klub parlamentarny"],
        related: ["żółty szalik", "sejmflix", "alternatywa", "koalicja"]
    },
    {
        coreTerm: "Konfederacja",
        intent: ["mentzen", "bosak", "narodowcy", "korwin", "braun", "wolność"],
        legal: ["Konfederacja Wolność i Niepodległość", "koło poselskie"],
        related: ["niskie podatki", "polexit", "gaśnica", "wywrócimy stolik"]
    },
    {
        coreTerm: "Wybory Kopertowe",
        intent: ["wybory pocztowe", "sasin", "70 milionów", "poczta polska", "wybory 10 maja"],
        legal: ["ustawa o szczególnych zasadach przeprowadzania wyborów powszechnych na Prezydenta RP", "druk kart wyborczych"],
        related: ["pandemia", "Grodzki", "Kidawa-Błońska", "nieodbyte wybory"]
    }
];

// Helper to flatten the matrix into the legacy Record<string, string[]> format
export function flattenSemanticMatrix(): Record<string, string[]> {
    const map: Record<string, string[]> = {};

    SEMANTIC_MATRIX.forEach(entry => {
        const allTerms = new Set([
            ...entry.intent,
            ...entry.legal,
            ...entry.related,
            entry.coreTerm.toLowerCase()
        ]);

        // Map core term to all variations
        map[entry.coreTerm.toLowerCase()] = Array.from(allTerms);

        // Map variations back to core term + other variations
        allTerms.forEach(term => {
            const termLower = term.toLowerCase();
            if (!map[termLower]) {
                map[termLower] = [];
            }
            // Add core term and limiting others to avoid huge lists
            map[termLower].push(entry.coreTerm.toLowerCase());
            entry.intent.forEach(i => map[termLower].push(i));
        });
    });

    return map;
}
