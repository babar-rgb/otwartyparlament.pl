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

# --- EXPERT ARGUMENTS DICTIONARY (JOURNALISTIC STYLE) ---
# Format: Nuanced, explanatory, high-quality language but accessible.
# --- EXPERT ARGUMENTS DICTIONARY (JOURNALISTIC STYLE - CONTEXT EXPANSION 200%) ---
KEYWORD_ARGUMENTS = {
    # == MAKROEKONOMIA I PIENIĄDZ ==
    "inflac": {
        "pros": ["Walka z drożyzną: Tarcze antyinflacyjne chronią portfele Polaków.", "Wzrost płac: Nominalnie zarabiamy coraz więcej, goniąc ceny.", "Ochrona oszczędności: Lokaty wreszcie zaczynają przynosić zysk powyżej inflacji."],
        "cons": ["Podatek ukryty: Inflacja to najgorszy podatek dla najbiedniejszych.", "Drożyzna w sklepach: Ceny żywności rosną znacznie szybciej niż oficjalny wskaźnik GUS.", "Spirala cenowo-płacowa: Żądania podwyżek nakręcają dalszy wzrost cen."]
    },
    "glapiński": {
        "pros": ["Niezależność NBP: Prezes banku centralnego nie może być odwoływalny przez polityków.", "Złoto: Rekordowe zakupy kruszcu zwiększają wiarygodność polskiej waluty.", "Gotówka: Obrona prawa do płacenia gotówką w konstytucji."],
        "cons": ["Upolitycznienie: Konferencje prezesa NBP przypominają wiece partyjne.", "Błędy w prognozach: 'Płaskowyż' inflacyjny okazał się Rysami.", "Trybunał Stanu: Zarzuty o złamanie konstytucji przez skup obligacji."]
    },
    "obligacj": {
        "pros": ["Finansowanie państwa: Pożyczanie od obywateli jest bezpieczniejsze niż od rynków zagranicznych.", "Oszczędzanie: Obligacje indeksowane inflacją to najlepsza ochrona kapitału dla Kowalskiego.", "Rolowanie długu: Standardowa procedura zarządzania finansami publicznymi."],
        "cons": ["Dług poza budżetem: Wypychanie wydatków do funduszy (PFR, BGK) ukrywa prawdziwy deficyt.", "Koszt obsługi: Odsetki od długu zjadają miliardy, które mogłyby iść na zdrowie.", "Zadłużanie wnuków: Żyjemy na koszt przyszłych pokoleń."]
    },

    # == PRAWORZĄDNOŚĆ I INSTYTUCJE ==
    "trybunał stanu": {
        "pros": ["Rozliczenie władzy: Politycy muszą wiedzieć, że nie są bezkarni za łamanie konstytucji.", "Sprawiedliwość historyczna: Osądzenie decydentów za decyzje szkodzące państwu.", "Prewencja: Straszak na przyszłych ministrów."],
        "cons": ["Teatr polityczny: W historii III RP Trybunał Stanu nikogo ważnego nie skazał.", "Zemsta: Używanie TS do niszczenia przeciwników politycznych.", "Paraliż państwa: Groźba TS może sparaliżować decyzyjność urzędników."]
    },
    "immunitet": {
        "pros": ["Ochrona mandatu: Poseł nie może być nękany przez prokuraturę za swoją działalność.", "Swoboda wypowiedzi: Gwarancja, że parlamentarzysta może mówić niewygodną prawdę.", "Separacja władz: Sąd nie powinen ingerować w skład parlamentu bez zgody Izby."],
        "cons": ["Bezkarność: Immunitet chroni piratów drogowych i aferzystów.", "Nadużycie: Zasłanianie się mandatem przy pospolitych przestępstwach.", "Rierwność: Obywatele są równi wobec prawa, ale politycy są 'równiejsi'."]
    },
    "ułaskawi": {
        "pros": ["Prerogatywa Prezydenta: Glowa państwa ma prawo łaski, którego nie musi uzasadniać.", "Akt miłosierdzia: Szansa na naprawienie błędów wymiaru sprawiedliwości.", "Szybkość: Możliwość zakończenia przewlekłych procesów niszczących ludzi."],
        "cons": ["Ingerencja w wyroki: Ułaskawienie przed prawomocnym wyrokiem to naruszenie trójpodziału władzy.", "Bezkarność kolesi: Ratowanie partyjnych kolegów przed więzieniem.", "Podważanie sądów: Sygnał, że wyroki nie mają znaczenia, jeśli ma się protektora."]
    },
    "prokuratura krajow": {
        "pros": ["Skuteczność: Scentralizowana prokuratura może skuteczniej ścigać mafie VAT-owskie.", "Jednolitość: Wytyczne z góry zapewniają, że prawo jest tak samo stosowane w całym kraju.", "Nadzór: Minister Sprawiedliwości ponosi polityczną odpowiedzialność za śledztwa."],
        "cons": ["Ręczne sterowanie: Politycy decydują, kogo ścigać, a kogo chronić.", "Betonowanie: Zmiany w ustawie mające na celu uniemożliwienie odwołania Prokuratora Krajowego.", "Brak niezależności: Prokurator stał się zbrojnym ramieniem partii."]
    },

    # == UNIA EUROPEJSKA I FUNDUSZE ==
    "kpo": {
        "pros": ["Skok cywilizacyjny: Miliardy euro na transformację energetyczną i cyfrową.", "Inwestycje: Pieniądze na żłobki, szybki internet i termomodernizację domów.", "Impuls dla PKB: Środki unijne uchronią nas przed recesją."],
        "cons": ["Dług wspólny: KPO to kredyt, który będziemy spłacać nowymi podatkami unijnymi.", "Szantaż: Komisja Europejska blokuje wypłaty z powodów politycznych.", "Kamienie milowe: Narzucanie Polsce zmian w prawie (sądownictwo, wiatraki) w zamian za pieniądze."]
    },
    "praworządność": {
        "pros": ["Standardy zachodnie: Niezawisłe sądy to fundament demokracji i warunek bycia w UE.", "Bezpieczeństwo biznesu: Inwestorzy omijają kraje, gdzie wyroki pisze się na telefon.", "Ochrona jednostki: Obywatel musi mieć pewność, że w sądzie ma szansę z państwem."],
        "cons": ["Suwerenność: Unia nie ma prawa ingerować w organizację polskiego wymiaru sprawiedliwości.", "Podwójne standardy: Niemcy czy Hiszpania mają podobne rozwiązania i nikt ich nie karze.", "Narzędzie nacisku: 'Praworządność' to pałka do bicia rządów nielubianych w Brukseli."]
    },

    # == ENERGETYKA PRZYSZŁOŚCI ==
    "atom": {
        "pros": ["Czysta baza: Elektrownie jądrowe dają stabilny prąd bez emisji CO2.", "Niezależność: Atom uniezależnia nas od gazu z Rosji i kaprysów pogody (OZE).", "Tania energia: Po spłaceniu budowy, prąd z atomu jest najtańszy."],
        "cons": ["Czas budowy: Pierwszy reaktor powstanie najwcześniej za 10-15 lat, a prądu brakuje dziś.", "Koszty: Budowa elektrowni to gigantyczne obciążenie finansowe i ryzyko opóźnień.", "Lokalizacja: Protesty mieszkańców, którzy nie chcą reaktora za płotem (Choczewo)."]
    },
    "biogaz": {
        "pros": ["Utylizacja odpadów: Prąd z gnojowicy i resztek jedzenia - idealny recykling.", "Stabilność: Biogazownia działa niezależnie od słońca i wiatru.", "Dochody dla rolników: Nowe źródło zysku dla gospodarstw."],
        "cons": ["Zapachy: Obawy mieszkańców wsi o odór z instalacji (tzw. ustawa odorowa).", "Koszt przyłączenia: Sieci energetyczne na wsiach nie są gotowe na odbiór prądu.", "Brak surowca: Konkurencja o biomasę winduje jej ceny."]
    },

    # == TRANSPORT I MIASTO ==
    "wykluczenie": {
        "pros": ["Autobus w każdej gminie: Przywrócenie godności mieszkańcom wsi bez samochodu.", "Fundusz Autobusowy: Dopłaty do nierentownych linii lokalnych.", "Dojazd do pracy: Walka z bezrobociem poprzez ułatwienie mobilności."],
        "cons": ["Puste przebiegi: Wiele reaktywowanych linii wozi powietrze.", "Brak koordynacji: Autobusy nie są skomunikowane z koleją.", "Krótkowzroczność: Rozkłady jazdy układane pod rok szkolny, a nie pod pracowników."]
    },
    "strefa czystego": {
        "pros": ["Czyste powietrze: Eliminacja starych diesli z centrów miast zmniejsza smog (NOx).", "Zdrowie dzieci: Mniej astmy i chorób płuc w miastach.", "Nowoczesność: Standard znany z Berlina czy Londynu."],
        "cons": ["Wykluczenie biednych: Kogo nie stać na nowe auto, nie wjedzie do centrum.", "Uderzenie w przedsiębiorców: Dostawcy i rzemieślnicy muszą wymieniać flotę.", "Inwigilacja: System kamer sczytujących tablice rejestracyjne."]
    },
    
    # == EDUKACJA SZCZEGÓŁOWA ==
    "czarnek": {
        "pros": ["Wartości patriotyczne: Szkoła ma uczyć dumy z polskiej historii i kultury.", "Inwestycje: Program 'Laboratoria Przyszłości' wyposażył szkoły w drukarki 3D.", "Walka z ideologią: Ochrona dzieci przed 'seksualizacją' przez organizacje lewicowe."],
        "cons": ["Ideologizacja: Wprowadzanie podręczników (HiT) pisanych pod tezę polityczną.", "Konflikt z nauczycielami: Lekceważenie postulatów płacowych i godnościowych ZNP.", "Centralizacja: Kuratorzy oświaty zyskali władzę karania dyrektorów."]
    },
    "psycholog": {
        "pros": ["Wsparcie psychiczne: Każdy uczeń musi mieć dostęp do specjalisty w szkole.", "Prewencja samobójstw: Szybka reakcja na kryzysy emocjonalne młodzieży.", "Odciążenie nauczycieli: Pedagodzy nie muszą sami radzić sobie z problemami uczniów."],
        "cons": ["Brak kadr: Wakatów psychologów nie da się zapełnić z dnia na dzień.", "Fikcja etatowa: Psycholog 'objazdowy' na 5 szkół nie zbuduje relacji z dzieckiem.", "Zarobki: Specjaliści wolą prywatną praktykę niż pracę w owiacie za grosze."]
    },

    # == ROLNICTWO I LASY II ==
    "zboż": {
        "pros": ["Solidarność: Tranzyt zboża z Ukrainy ratuje świat przed głodem.", "Niskie ceny pasz: Tanie zboże to tańsza produkcja mięsa dla polskich hodowców.", "Magazynowanie: System skupu interwencyjnego stabilizuje ceny."],
        "cons": ["Zalew rynku: Ukraińskie zboże techniczne zostaje w Polsce i niszczy polskiego rolnika.", "Brak kontroli: Doniesienia o niskiej jakości ziarna wjeżdżającego bez badań.", "Bankructwa: Polscy rolnicy nie mają gdzie sprzedać swoich zbiorów przed żniwami."]
    },
    "cpk": {
        "pros": ["Hub: Wielkie lotnisko ma uczynić z Polski globalny węzeł przesiadkowy.", "Cargo: Przejęcie zysków z cła i transportu towarów, które dziś trafiają do Niemiec.", "Kolej szprychowa: Rewolucja w czasie dojazdu do Warszawy z każdego zakątka kraju."],
        "cons": ["Megalomania: Zarzuty, że to projekt przeskalowany i polityczny ('miś').", "Wywłaszczenia: Dramaty ludzi tracących domy pod budowę lotniska i torów.", "Koszt: Gigantyczne nakłady, które mogą się nigdy nie zwrócić (Ryanair to krytykuje)."]
    },
    "kolej": {
        "pros": ["Ekologia: Pociąg to najbardziej zielony środek transportu.", "Walka z wykluczeniem: Przywracanie połączeń PKS/PKP do małych miast.", "Nowy tabor: Pendolino i Flirty podniosły komfort podróży."],
        "cons": ["Opóźnienia: Zimowe i letnie paraliże na torach to polska klasyka.", "Ceny biletów: Podróż rodzinna pociągiem jest często droższa niż autem.", "Remonty: Niekończące się modernizacje, które wydłużają czas jazdy."]
    },
    "rower": {
        "pros": ["Zdrowie: Promocja ruchu to mniejsze wydatki na leczenie otyłości.", "Czyste miasta: Mniej aut w centrum to mniej spalin i hałasu.", "Turystyka: Szlaki rowerowe (Green Velo) przyciągają turystów."],
        "cons": ["Konflikty: Wojna kierowców z rowerzystami o pasy ruchu.", "Sezonowość: Infrastruktura rowerowa jest mało używana zimą.", "Koszt ścieżek: Budowa kładek rowerowych bywa nieproporcjonalnie droga."]
    },

    # == MIESZKALNICTWO (GIGA) ==
    "deweloper": {
        "pros": ["Podaż: Tylko prywatny sektor buduje wystarczająco dużo mieszkań.", "Standard: Nowe osiedla są czystsze i nowocześniejsze niż wielka płyta.", "Miejsca pracy: Budowlanka to koło zamachowe gospodarki."],
        "cons": ["Patodeweloperka: Chciwość prowadzi do budowania 'klitek' okno w okno.", "Betonoza: Wycinanie drzew i brak retencji wody na nowych osiedlach.", "Ceny: Marże deweloperów są w Polsce rekordowo wysokie."]
    },
    "najem": {
        "pros": ["Mobilność: Łatwiej zmienić pracę, gdy nie jest się uwiązanym kredytem.", "Profesjonalizacja: Fundusze PRS oferują stabilny najem bez 'humorów' właściciela.", "Dostępność: Alternatywa dla tych, którzy nie mają zdolności kredytowej."],
        "cons": ["Czynsze: Ceny najmu w dużych miastach pożerają połowę pensji.", "Brak stabilności: Krótkie umowy i ryzyko eksmisji zniechęcają do zakładania rodzin.", "Wykup przez fundusze: Zagraniczny kapitał masowo wykupuje mieszkania, podbijając ceny."]
    },
    "spółdzieln": {
        "pros": ["Wspólnota: Spółdzielnie to własność mieszkańców, a nie zysk inwestora.", "Czynsz: Opłaty w spółdzielniach są często niższe niż we wspólnotach deweloperskich.", "Zasoby: Starsze osiedla mają więcej zieleni i przestrzeni między blokami."],
        "cons": ["Beton zarządów: Prezesi spółdzielni rządzący latami bez kontroli lokatorów.", "Zadłużenie: Długi sąsiadów obciążają wszystkich mieszkańców bloku.", "Brak remontów: Stara substancja mieszkaniowa wymaga gigantycznych nakładów (termomodernizacja)."]
    },

    # == PODATKI I GOSPODARKA (GIGA) ==
    "vat": {
        "pros": ["Dochody państwa: VAT to główne źródło pieniędzy na szkoły i drogi.", "Uszczelnienie: Walka z mafiami vatowskimi przyniosła miliardy do budżetu.", "Sterowanie konsumpcją: Zerowy VAT na żywność chroni najuboższych."],
        "cons": ["Skomplikowanie: Matryca stawek VAT to labirynt, w którym gubią się księgowi.", "Niepewność: Interpretacje urzędów skarbowych potrafią się zmieniać wstecz.", "Koszt obsługi: Przedsiębiorcy to darmowi poborcy podatkowi dla państwa."]
    },
    "zus": {
        "pros": ["Gwarancja wypłat: Państwo gwarantuje emerytury, nawet gdy system jest deficytowy.", "Solidaryzm: Składki zdrowotne finansują leczenie wszystkich, nie tylko bogatych.", "Tarcze: Umorzenia ZUS ratowały firmy w pandemii."],
        "cons": ["Zabójca firm: Stały ZUS (ryczałt) niszczy małe biznesy w gorszych miesiącach.", "Dobrowolny ZUS: Postulat zniesienia przymusu ubezpieczeń dla mikroprzedsiębiorców.", "Niska stopa zwrotu: Przedsiębiorcy wpłacają dużo, a dostaną groszowe emerytury."]
    },
    "gotówk": {
        "pros": ["Wolność: Gotówka to jedyny środek płatniczy nieśledzony przez banki/rząd.", "Bezpieczeństwo: Działa nawet podczas awarii prądu czy ataku hakerskiego.", "Prywatność: Prawo do anonimowych zakupów."],
        "cons": ["Szara strefa: Gotówka ułatwia unikanie podatków i pranie brudnych pieniędzy.", "Koszt obsługi: Druk, transport i ochrona gotówki kosztują miliardy.", "Wygoda: Płatności zbliżeniowe są szybsze i higieniczniejsze."]
    },

    # == SPRAWIEDLIWOŚĆ I SĄDY (GIGA) ==
    "krs": {
        "pros": ["Demokratyzacja: Wybór sędziów przez Sejm daje narodowi wpływ na sądownictwo.", "Rozbicie kasty: Koniec z sędziowską kooptacją ('sami swoi').", "Sprawność: Nowi sędziowie mają orzekać szybciej i bez politykowania."],
        "cons": ["Upolitycznienie: 'Neo-KRS' jest zależna od woli partii rządzącej.", "Chaos prawny: Wyroki 'neo-sędziów' są podważane przez trybunały europejskie.", "Brak niezawisłości: Awansują sędziowie lojalni wobec ministra sprawiedliwości."]
    },
    "komornik": {
        "pros": ["Egzekucja prawa: Wyrok sądu musi być wykonany, inaczej prawo jest fikcją.", "Alimenty: Ściąganie długów alimentacyjnych to walka o byt dzieci.", "Cyfryzacja: System e-zajęć przyspiesza odzyskiwanie pieniędzy."],
        "cons": ["Nieludzkie traktowanie: Licytacje za grosze dorobku całego życia.", "Pomyłki: Zajmowanie kont osób o tym samym nazwisku.", "Koszty: Opłaty komornicze często przewyższają sam dług."]
    },

    # == RODZINA I SOCJAL (GIGA) ==
    "800+": {
        "pros": ["Walka z ubóstwem: Transfery gotówkowe zlikwidowały skrajną biedę wśród dzieci.", "Godność: Rodziny stać na wakacje i zajęcia dodatkowe.", "Prostota: Pieniądze do ręki, a nie talony czy pomoc społeczna."],
        "cons": ["Inflacja: Doliwanie gotówki na rynek napędza wzrost cen.", "Brak efektu demograficznego: Dzietność nie wzrosła mimo miliardowych nakładów.", "Dezaktywizacja: Część kobiet rezygnuje z pracy, bo 'nie opłaca się' pracować."]
    },
    "żłob": {
        "pros": ["Aktywność matek: Dostępny żłobek pozwala kobietom wrócić do pracy.", "Rozwój dzieci: Profesjonalna opieka i socjalizacja od najmłodszych lat.", "Babciowe: Dopłaty do opieki, jeśli nie ma miejsca w placówce."],
        "cons": ["Brak miejsc: W małych gminach żłobki to wciąż rzadkość.", "Koszt: Czesne w prywatnych żłobkach (mimo dopłat) jest bardzo wysokie.", "Choroby: Obawy rodziców o częste infekcje w dużych skupiskach dzieci."]
    },

    # == ROLNICTWO I WIEŚ (GIGA) ==
    "nawoz": {
        "pros": ["Wydajność: Bez nawozów polskie rolnictwo nie wyżywi kraju.", "Dopłaty: Rządowe wsparcie do zakupu drogich nawozów (efekt wojny).", "Nowoczesność: Rolnictwo precyzyjne ogranicza zużycie chemii."],
        "cons": ["Ceny gazu: Produkcja azotu jest zależna od cen gazu (Grupa Azoty).", "Zatrucie wód: Spływ azotanów do rzek powoduje zakwity sinic i katastrofy.", "Uniezależnienie: Konieczność importu surowców ze Wschodu."]
    },
    "sołtys": {
        "pros": ["Lider lokalny: Sołtys to pierwsza linia kontaktu państwa z obywatelem.", "Dodatek emerytalny: Docenienie wieloletniej pracy społecznej (300 zł).", "Fundusz sołecki: Pieniądze na małe inwestycje decydowane bezpośrednio przez wieś."],
        "cons": ["Brak kompetencji: Sołtys często nie ma narzędzi prawnych, by realnie pomóc.", "Niskie diety: Praca sołtysa to wciąż bardziej wolontariatu niż funkcja.", "Polityzacja wsi: Próby przejmowania struktur wiejskich przez partie."]
    },

    # == KULTURA I HISTORIA (GIGA) ==
    "muzeum": {
        "pros": ["Edukacja historyczna: Nowoczesne muzea narracyjne (jak POLIN czy II WŚ) uczą przez przeżywanie.", "Turystyka: Muzea przyciągają turystów i promują miasta.", "Tożsamość: Budowanie dumy narodowej poprzez przypominanie bohaterów."],
        "cons": ["Polityka historyczna: Muzea stają się polem bitwy o interpretację historii.", "Koszty budowy: Miliardy na gmachy, podczas gdy kultura niezależna głoduje.", "Centralizacja: Przejmowanie lokalnych muzeów przez ministerstwo w Warszawie."]
    },
    "artyst": {
        "pros": ["Status Artysty: Próba objęcia twórców ubezpieczeniem społecznym (ZUS).", "Mecenat państwa: Stypendia i granty pozwalają tworzyć ambitną kulturę.", "Promocja Polski: Sukcesy filmowców i muzyków to soft power kraju."],
        "cons": ["Cenzura ekonomiczna: Dotacje tylko dla 'swoich' i 'prawomyślnych' twórców.", "Bieda: Większość artystów żyje poniżej średniej krajowej.", "Podatki: Spory o 50% koszty uzyskania przychodu."]
    },

    # == ŚWIATOPOGLĄD I ETYKA (GIGA) ==
    "in vitro": {
        "pros": ["Szczęście rodzin: Dla wielu par to jedyna szansa na biologiczne potomstwo.", "Refundacja: Państwo powinno wspierać walkę z niepłodnością (chorobą cywilizacyjną).", "Standard światowy: Metoda uznana i stosowana w całej Europie."],
        "cons": ["Etyka katolicka: Sprzeciw Kościoła wobec mrożenia zarodków.", "Naprotechnologia: Promowanie naturalnych metod wspierania płodności jako alternatywy.", "Koszty: Procedury są drogie i nie gwarantują sukcesu."]
    },
    "uchdź": {
        "pros": ["Humanitaryzm: Obowiązek pomocy ludziom uciekającym przed wojną i prześladowaniem.", "Rynek pracy: Imigranci uzupełniają braki kadrowe w polskiej gospodarce.", "Ubogacenie kulturowe: Otwartość na inne kultury uczy tolerancji."],
        "cons": ["Bezpieczeństwo: Obawy przed niekontrolowanym napływem i terroryzmem.", "Koszty socjalne: Obciążenie szkół i służby zdrowia.", "Integracja: Ryzyko powstawania gett i konfliktów kulturowych (przykład Zachodu)."]
    },

    # == ENERGETYKA SZCZEGÓŁOWA ==
    "węgl": {
        "pros": ["Bezpieczeństwo energetyczne: Węgiel to wciąż podstawa polskiego systemu i gwarancja prądu w gniazdkach.", "Suwerenność: Posiadamy własne zasoby, co uniezależnia nas od importu gazu.", "Miejsca pracy: Górnictwo to wciąż tysiące etatów na Śląsku, które trzeba chronić."],
        "cons": ["Trujące powietrze: Spalanie węgla to główna przyczyna smogu i chorób płuc.", "Nieopłacalność: Polskie wydobycie jest drogie i wymaga miliardowych dopłat z budżetu.", "Izolacja w UE: Trwanie przy węglu blokuje nam dostęp do środków na transformację."]
    },
    "lekow": {
        "pros": ["Refundacja: Państwo bierze na siebie koszt drogich terapii (np. w onkologii).", "Bezpieczeństwo lekowe: Wsparcie dla produkcji farmaceutyków w Polsce (Polfa).", "Darmowe leki: Programy '75+' i dla dzieci odciążają domowe budżety."],
        "cons": ["Braki w aptekach: Problemy z dostępnością kluczowych antybiotyków i insuliny.", "Lobby farmaceutyczne: Podejrzenia, że lista refundacyjna jest układana pod dyktando koncernów.", "Eksport równoległy: Wywożenie tanich leków z Polski za granicę."]
    },
    "psychiatr": {
        "pros": ["Reforma: Przesunięcie ciężaru z wielkich szpitali na centra środowiskowe blisko domu.", "Zdrowie dzieci: Pilna potrzeba ratowania psychiatrii dziecięcej po pandemii.", "Dostępność: Psycholog w każdej szkole to standard, do którego dążymy."],
        "cons": ["Zapaść: Oddziały dziecięce są przepełnione, a lekarzy brakuje krytycznie.", "Niedofinansowanie: Przez lata psychiatria była 'kopciuszkiem' służby zdrowia.", "Stygmatyzacja: Wciąż niska świadomość społeczna problemów psychicznych."]
    },

    # == OBRONNOŚĆ I SPRAWY ZAGRANICZNE ==
    "wojsk": {
        "pros": ["Odstraszanie: Silna armia (300 tys.) to jedyna gwarancja, że nikt nas nie zaatakuje.", "Modernizacja: Zakupy czołgów i samolotów (Abrams, F-35) wprowadzają nas do XXI wieku.", "Sojusze: Polska jako lider wschodniej flanki NATO."],
        "cons": ["Koszty: Gigantyczne wydatki na zbrojenia (4% PKB) drenują budżet na edukację i zdrowie.", "Braki kadrowe: Trudno znaleźć chętnych do służby mimo kampanii reklamowych.", "Defilady: Zarzuty, że wojsko służy politykom do robienia tła na konferencjach."]
    },
    "ukrain": {
        "pros": ["Racja stanu: Niepodległa Ukraina to bufor bezpieczeństwa oddzielający nas od Rosji.", "Solidarność: Pomoc uchodźcom to nasz moralny obowiązek, który świat docenił.", "Odbudowa: Polskie firmy mogą zarobić na powojennej odbudowie Ukrainy."],
        "cons": ["Zmęczenie społeczeństwa: Obawy o konkurencję na rynku pracy i w dostępie do lekarza.", "Koszty socjalne: Pytania o to, jak długo Polska może finansować pomoc.", "Zaszłości historyczne: Wołyń wciąż kładzie się cieniem na relacjach, jeśli nie jest wyjaśniony."]
    },
    # "msz" removed to avoid matching "msza"
    "dyplomacj": {
        "pros": ["Dyplomacja: Budowanie pozytywnego wizerunku Polski na świecie.", "Opieka konsularna: Wsparcie dla milionów Polaków mieszkających za granicą.", "Promocja gospodarki: Ambasady jako przyczółki dla polskich eksporterów."],
        "cons": ["Afera wizowa: Korupcja przy wydawaniu wiz podważa wiarygodność państwa i bezpieczeństwo granic.", "Niekompetencja: Nominacje polityczne na ambasadorów zamiast zawodowych dyplomatów.", "Konflikty z UE: Prowadzenie polityki zagranicznej na użytek wewnętrzny (do elektoratu)."]
    },

    # == CYFRYZACJA I TECHNOLOGIE ==
    "cyfryz": {
        "pros": ["mObywatel: Dowód, prawko i recepty w telefonie to wygoda, której zazdroszczą nam Niemcy.", "E-urząd: Załatwianie spraw bez wychodzenia z domu oszczędza czas.", "Internet szerokopasmowy: Walka z wykluczeniem cyfrowym na obszarach wiejskich."],
        "cons": ["Wycieki danych: Ryzyko, że nasze dane trafią w niepowołane ręce (np. ALAB).", "Wykluczenie seniorów: Starsze osoby gubią się w świecie, gdzie wszystko jest 'e-'.", "Awaryjność: Gdy system pada (CEPIK), państwo przestaje działać."]
    },
    "cyber": {
        "pros": ["Cyber-tarcza: Wojska Obrony Cyberprzestrzeni chronią nas przed atakami hakerów.", "Edukacja: Nauka programowania i higieny cyfrowej (fake news) w szkołach.", "Suwerenność cyfrowa: Budowa narodowych chmur danych."],
        "cons": ["Inwigilacja: Narzędzia do walki z terrorystami bywają używane przeciw obywatelom.", "Brak specjalistów: Państwo płaci za mało, by przyciągnąć najlepszych informatyków z rynku.", "Dezinformacja: Słabość w walce z rosyjskimi trollami w social mediach."]
    },
    "badań": {
        "pros": ["NCBR: Miliardy na innowacje, które mają zmienić polską gospodarkę.", "Współpraca biznesu z nauką: Komercjalizacja patentów.", "Startupy: Wspieranie młodych, technologicznych firm."],
        "cons": ["Korupcja w grantach: Afery z przyznawaniem dotacji firmom 'krzakom'.", "Betonoza: Pieniądze idą na budynki, a nie na pensje dla badaczy.", "Biurokracja: Naukowcy wypełniają tabelki zamiast prowadzić badania."]
    },

    # == ŚRODOWISKO I KLIMAT (SZCZEGÓŁOWE) ==
    "lasy": {
        "pros": ["Bogactwo przyrodnicze: Lasy to nasze płuca i miejsce rekreacji.", "Przemysł drzewny: Polska jest potęgą w produkcji mebli dzięki zasobom drewna.", "Gospodarka leśna: Sadzimy więcej drzew niż wycinamy (według leśników)."],
        "cons": ["Rzeź puszcz: Wycinka cennych przyrodniczo lasów (Karpaty, Puszcza Białowieska).", "Eksport drewna: Polskie drewno wyjeżdża nieprzetworzone do Chin.", "Upolitycznienie: Lasy Państwowe jako finansowe zaplecze partii politycznej (Suwerenna Polska)."]
    },
    "lasach": {
        "pros": ["Bogactwo przyrodnicze: Lasy to nasze płuca i miejsce rekreacji.", "Przemysł drzewny: Polska jest potęgą w produkcji mebli dzięki zasobom drewna.", "Gospodarka leśna: Sadzimy więcej drzew niż wycinamy (według leśników)."],
        "cons": ["Rzeź puszcz: Wycinka cennych przyrodniczo lasów (Karpaty, Puszcza Białowieska).", "Eksport drewna: Polskie drewno wyjeżdża nieprzetworzone do Chin.", "Upolitycznienie: Lasy Państwowe jako finansowe zaplecze partii politycznej (Suwerenna Polska)."]
    },
    "leśn": {
        "pros": ["Bogactwo przyrodnicze: Lasy to nasze płuca i miejsce rekreacji.", "Przemysł drzewny: Polska jest potęgą w produkcji mebli dzięki zasobom drewna.", "Gospodarka leśna: Sadzimy więcej drzew niż wycinamy (według leśników)."],
        "cons": ["Rzeź puszcz: Wycinka cennych przyrodniczo lasów (Karpaty, Puszcza Białowieska).", "Eksport drewna: Polskie drewno wyjeżdża nieprzetworzone do Chin.", "Upolitycznienie: Lasy Państwowe jako finansowe zaplecze partii politycznej (Suwerenna Polska)."]
    },
    "łowiec": {
        "pros": ["Gospodarka łowiecka: Regulacja populacji dzików (ASF) i zapobieganie szkodom rolniczym.", "Tradycja: Myślistwo jako element kultury i dbałości o przyrodę.", "Bezpieczeństwo: Eliminacja chorych zwierząt w pobliżu miast."],
        "cons": ["Hobby dla elit: Zabijanie zwierząt dla przyjemności jest nieetyczne w XXI wieku.", "Wypadki: Postrzelenia ludzi i zwierząt domowych podczas polowań.", "Brak kontroli: Myśliwi sami się badają i sami ustalają limity odstrzału."]
    },
    "odpad": {
        "pros": ["Recykling: Odzyskiwanie surowców to oszczędność i ochrona Ziemi (GOZ).", "Kaucja: System kaucyjny na butelki oczyści lasy i ulice ze śmieci.", "Spalarnie: Produkcja ciepła i prądu z odpadów zamiast składowania na hałdach."],
        "cons": ["Pożary wysypisk: Podejrzane serie pożarów nielegalnych składowisk truły okolicę.", "Import śmieci: Polska stała się śmietniskiem Europy Zachodniej.", "Drożyzna wywozu: Opłaty za śmieci drastycznie rosną dla mieszkańców."]
    },

    # == SPOŁECZEŃSTWO I WARTOŚCI ==
    "kościoł": {
        "pros": ["Tradycja: Rola Kościoła w historii i budowaniu tożsamości narodowej.", "Działalność charytatywna: Caritas pomaga tysiącom najuboższych.", "Wspólnota: Parafia jako centrum życia społecznego, zwłaszcza na wsi."],
        "cons": ["Fundusz Kościelny: Finansowanie duchownych z budżetu państwa w świeckim kraju.", "Skandale: Pedofilia i ukrywanie sprawców niszczy autorytet moralny.", "Sojusz ołtarza z tronem: Zaangażowanie kleru w kampanię wyborczą."]
    },
    "ngo": {
        "pros": ["Społeczeństwo obywatelskie: Organizacje pozarządowe załatwiają sprawy, których państwo nie widzi.", "Aktywizm: Ludzie biorą sprawy w swoje ręce (WOŚP, pomoc Ukrainie).", "Kontrola władzy: Watchdogi patrzą na ręce politykom."],
        "cons": ["Wille plus: Rozdawanie publicznych pieniędzy fundacjom powiązanym z władzą.", "Agenci wpływu: Obawy o finansowanie niektórych NGO z zagranicy.", "Przejrzystość: Nie wszystkie fundacje jasno rozliczają się z darowizn."]
    },
    "kobiet": {
        "pros": ["Równouprawnienie: Walka z luką płacową i szklanym sufitem.", "Prawa reprodukcyjne: Decyzyjność w sprawach zdrowia i macierzyństwa (in vitro).", "Ochrona przed przemocą: Konwencja Stambulska i izolacja sprawców."],
        "cons": ["Wojna ideologiczna: Spór o aborcję dzieli społeczeństwo jak żaden inny.", "Demografia: Obawy, że zmiany kulturowe pogłębią kryzys dzietności.", "Parytety: Czy narzucanie kwot na listach wyborczych/zarządach jest sprawiedliwe?"]
    },

    # == ENERGETYKA SZCZEGÓŁOWA ==
    # "węgiel" removed - duplicate of line 188
    # },
    "wiatrak": {
        "pros": ["Tani prąd: Energia z wiatru jest obecnie najtańszym źródłem energii na rynku.", "Czysta Polska: Każda megawatogodzina z wiatru to mniej spalonego węgla i czystsze płuca.", "Niezależność lokalna: Gminy mogą zarabiać na podatkach od farm wiatrowych."],
        "cons": ["Krajobraz: Obawy mieszkańców o hałas i oszpecenie okolicy (zasada 10H).", "Niestabilność: Wiatr nie zawsze wieje, więc system i tak potrzebuje elektrowni rezerwowych.", "Konflikty lokalne: Budowa farm często spotyka się z protestami sąsiadów."]
    },
    "rura gazow": {
        "pros": ["Paliwo przejściowe: Gaz emituje mniej CO2 niż węgiel i pozwala stabilizować system OZE.", "Dywersyfikacja: Dzięki Baltic Pipe nie jesteśmy już zależni od szantażu zakręceniem kurka ze Wschodu.", "Ciepło dla domów: Nowoczesne piece gazowe to wygoda i brak smogu z komina."],
        "cons": ["Zależność cenowa: Ceny gazu są niestabilne i zależne od geopolityki.", "To wciąż paliwo kopalne: Unia Europejska dąży do wyeliminowania gazu w perspektywie dekad.", "Koszty przyłączy: Rozbudowa sieci gazowniczej jest kosztowna."]
    },
    "fotowoltaik": {
        "pros": ["Prąd ze słońca: Darmowa energia dla milionów prosumentów.", "Odciążenie sieci latem: Panele produkują najwięcej prądu wtedy, gdy działają klimatyzatory.", "Demokratyzacja energii: Obywatel staje się producentem, a nie tylko konsumentem."],
        "cons": ["Problem 'krzywej kaczki': Nadprodukcja energii w dzień zatyka przestarzałe sieci energetyczne.", "Recykling: Obawy o to, co zrobimy z milionami zużytych paneli za 20 lat.", "Opłacalność: Zmiany w systemie rozliczeń (net-billing) wydłużyły czas zwrotu inwestycji."]
    },

    # == FINANSE I GOSPODARKA SZCZEGÓŁOWA ==
    "bank": {
        "pros": ["Stabilność sektora: Bezpieczne banki to bezpieczne oszczędności Polaków.", "Kredytowanie rozwoju: Banki dostarczają kapitał niezbędny dla inwestycji firm.", "Nowoczesność: Polska bankowość cyfrowa jest jedną z najnowocześniejszych na świecie."],
        "cons": ["Wakacje kredytowe: Obciążanie banków kosztami polityki socjalnej rządu.", "Nadmierne zyski: Zarzuty, że banki zarabiają krocie na wysokich stopach procentowych kosztem kredytobiorców.", "Frankowicze: Nierozwiązany systemowo problem toksycznych kredytów sprzed lat."]
    },
    "kredyt": {
        "pros": ["Dostępność mieszkań: Kredyt 2% / 0% to dla wielu jedyna szansa na własne 'M'.", "Pobudzenie budowlanki: Popyt na kredyty nakręca koniunkturę w budownictwie.", "Wsparcie rodzin: Ułatwienie startu życiowego dla młodych małżeństw."],
        "cons": ["Windowanie cen: Dopłaty do kredytów natychmiast podnoszą ceny mieszkań u deweloperów.", "Zadłużanie Polaków: Zachęcanie do brania kredytów w niepewnych czasach.", "Wykluczenie gotówkowych: Klienci gotówkowi są wypychani z rynku przez tych z dopłatami."]
    },
    "akcyz": {
        "pros": ["Wpływy do budżetu: Miliardy złotych, które finansują szkoły i szpitale.", "Polityka zdrowotna: Wyższa akcyza na alkohol i papierosy ma zniechęcać do używek.", "Ograniczenie importu: Akcyza na stare samochody chroni nas przed zalewem złomu."],
        "cons": ["Szara strefa: Zbyt wysokie stawki zachęcają do przemytu i nielegalnej produkcji.", "Drożyzna paliw: Akcyza to duża składowa ceny na stacji benzynowej.", "Uderzenie w biedniejszych: Podatki pośrednie najbardziej obciążają najmniej zarabiających."]
    },
    "pit": {
        "pros": ["Kwota wolna: Podwyższenie kwoty wolnej to, de facto, podwyżka pensji netto.", "Progresja: Bogatsi powinni płacić więcej (choć w Polsce system jest spłaszczony).", "Ulgi prorodzinne: Zwroty podatku realnie wspierają budżety domowe."],
        "cons": ["Polski Ład: Chaos przy wdrażaniu zmian podatkowych nadszarpnął zaufanie do państwa.", "Skomplikowanie: Rozliczanie PIT wciąż bywa wyzwaniem mimo e-Urzędu.", "Obciążenie pracy: Wysokie opodatkowanie pracy zniechęca do aktywności zawodowej."]
    },

    # == MEDIA I KULTURA ==
    "medi": {
        "pros": ["Pluralizm: Obywatele muszą mieć dostęp do różnych źródeł informacji.", "Media publiczne: Misja edukacyjna i kulturalna, której nie realizują stacje komercyjne.", "Wsparcie lokalne: Prasa lokalna to często jedyne źródło wiedzy o sprawach gminy."],
        "cons": ["Propaganda: Zamiana mediów publicznych w tubę partyjną jednej opcji.", "Repolonizacja: Próby przejmowania czy zamykania mediów krytycznych wobec władzy (lex TVN).", "Finansowanie: Miliardy na TVP przy niedofinansowaniu onkologii budzą sprzeciw społeczny."]
    },
    "tvp": {
        "pros": ["Misja: Teatr Telewizji, sport i programy dla dzieci dostępne za darmo.", "Zasięg: Dotarcie z informacją tam, gdzie nie dociera internet i kablówek.", "Suwerenność narracyjna: Państwo musi mieć narzędzia do komunikacji w sytuacjach kryzysowych."],
        "cons": ["Hate speech: Szczucie na oponentów politycznych i grupy mniejszościowe.", "Koszt: 3 miliardy rocznie z kieszeni podatnika na propagandę sukcesu.", "Upadek standardów: Utrata wiarygodności dziennikarskiej na rzecz partyjnego przekazu."]
    },
    "poczt": {
        "pros": ["Operator narodowy: Poczta dostarcza listy tam, gdzie kurierom się nie opłaca.", "Bezpieczeństwo: Ważna rola w infrastrukturze krytycznej państwa.", "Placówki na wsi: Często jedyne okno na świat (bank, sklepik) w małych miejscowościach."],
        "cons": ["Wybory kopertowe: Zmarnowane 70 mln zł na wybory, które się nie odbyły.", "Archaizm: Niska jakość usług i kolejki przegrywają z paczkomatami.", "Dotacje: Konieczność ciągłego dopłacania do nierentownego molocha."]
    },

    # == PRAWO SZCZEGÓŁOWE ==
    "kodeks karn": {
        "pros": ["Surowość kary: Odstraszanie przestępców poprzez podwyższanie dolnych i górnych granic.", "Bezwzględność dla pijaków: Konfiskata aut pijanym kierowcom.", "Ochrona ofiar: Zaostrzenie kar za przestępstwa seksualne i pedofilię."],
        "cons": ["Populizm penalny: Zaostrzanie kar nie zawsze zmniejsza przestępczość, a zapycha więzienia.", "Błędy legislacyjne: Szybkie nowelizacje pisane pod wpływem emocji społecznych.", "Zbyt szerokie widełki: Ryzyko nadużyć przy wymierzaniu sprawiedliwości."]
    },
    "notari": {
        "pros": ["Bezpieczeństwo obrotu: Gwarancja, że umowa kupna mieszkania jest legalna.", "Cyfryzacja: Nowe e-usługi ułatwiające załatwianie spraw spadkowych.", "Dostępność: Zwiększanie naboru, by usługi były tańsze i łatwiej dostępne."],
        "cons": ["Taksy notarialne: Wysokie opłaty, które są barierą przy zakupie nieruchomości.", "Korporacjonizm: Zarzuty o zamykanie zawodu przed młodymi prawnikami.", "Biurokracja: Przymus wizyty u notariusza w sprawach, które można by załatwić w urzędzie."]
    },
    
    # == ROLNICTWO I LASY II ==
    "zboż": {
        "pros": ["Solidarność: Tranzyt zboża z Ukrainy ratuje świat przed głodem.", "Niskie ceny pasz: Tanie zboże to tańsza produkcja mięsa dla polskich hodowców.", "Magazynowanie: System skupu interwencyjnego stabilizuje ceny."],
        "cons": ["Zalew rynku: Ukraińskie zboże techniczne zostaje w Polsce i niszczy polskiego rolnika.", "Brak kontroli: Doniesienia o niskiej jakości ziarna wjeżdżającego bez badań.", "Bankructwa: Polscy rolnicy nie mają gdzie sprzedać swoich zbiorów przed żniwami."]
    },
    "zwierząt": {
        "pros": ["Dobrostan: Zakaz hodowli futerkowej i trzymania psów na łańcuchach.", "Etyka: Zwierzę nie jest rzeczą – zwiększenie kar za znęcanie się.", "Czipowanie: Walka z bezdomnością poprzez obowiązkową rejestrację."],
        "cons": ["Uderzenie w branżę: 'Piątka dla zwierząt' to likwidacja dochodowego sektora eksportowego.", "Ingerencja w tradycję: Zakazy uboju rytualnego uderzają w swobody religijne i eksport.", "Koszty dla wsi: Nowe wymogi dobrostanu oznaczają droższą produkcję żywności."]
    },
    "wod": {
        "pros": ["Retencja: Budowa zbiorników, by zatrzymać wodę w czasie suszy.", "Czystość: Inwestycje w oczyszczalnie ścieków i kanalizację na wsiach.", "Żeglowna Odra i Wisła: Przywrócenie transportu rzecznego."],
        "cons": ["Podatek od deszczu: Kolejne opłaty dla właścicieli domów i firm.", "Betonowanie: Regulacja rzek niszczy naturalne ekosystemy i zwiększa ryzyko szybkich powodzi.", "Zanieczyszczenia: Afery ze zrzutami solanki i ścieków (katastrofa na Odrze)."]
    },

    # == INNE ISTOTNE ==
    # "komornik": { DUPLICATE - MOVED TO GIGA PACK
    #    "pros": ["Skuteczność egzekucji: Wierzyciele (często alimenciarze) muszą odzyskiwać swoje pieniądze.", "Cyfryzacja: E-licytacje zwiększają transparentność i zasięg sprzedaży.", "Nadzór: Większa kontrola sądu nad działaniami komorników."],
    #    "cons": ["Tragedie ludzkie: Licytacje dorobku życia za drobne długi.", "Nadużycia: Historie o zajmowaniu majątku osób trzecich (np. sąsiada czy rolnika).", "Koszty egzekucyjne: Dłużnik wpada w spiralę zadłużenia przez wysokie opłaty."]
    # },
    "kierowc": {
        "pros": ["Bezpieczeństwo: Punkty karne i wysokie mandaty wymuszają zdjęcie nogi z gazu.", "Pierwszeństwo pieszych: Cywilizowanie relacji na pasach.", "Lepsze drogi: Inwestycje w infrastrukturę poprawiają komfort jazdy."],
        "cons": ["Dojenie kierowców: Budżet traktuje mandaty jako źródło dochodu.", "Szeryfowie drogowi: Agresja i donosicielstwo na drogach.", "Badania lekarskie: Obawy seniorów o utratę prawa jazdy."]
    },

    "płaca minimaln": {
        "pros": ["**Godne życie:** Pracownik na pełnym etacie nie może przymierać głodu.", "**Walka z nierównościami:** Podnoszenie dochodów najbiedniejszych napędza konsumpcję.", "**Presja płacowa:** Zmusza firmy do inwestowania w wydajność, a nie konkurowania tanią siłą roboczą."],
        "cons": ["**Spirala inflacyjna:** Wyższe pensje to wyższe ceny usług i towarów.", "**Upadłość małych firm:** Mikoprzedsiębiorców często nie stać na skokowe podwyżki.", "**Szara strefa:** Ryzyko wypychania pracowników poza legalny obieg."]
    },
    "emerytur": {
        "pros": ["**Solidarność pokoleń:** System musi gwarantować bezpieczeństwo seniorom, którzy budowali ten kraj.", "**Waloryzacja:** Ochrona świadczeń przed utratą wartości z powodu inflacji.", "**Druga waloryzacja:** Mechanizm interwencyjny w czasach wysokiej drożyzny."],
        "cons": ["**Zapaść demograficzna:** Coraz mniej pracujących utrzymuje coraz więcej emerytów.", "**Dziura w ZUS:** System wymaga gigantycznych dopłat z budżetu (podatków).", "**Niskie stopy zastąpienia:** Przyszłe emerytury będą głodowe bez dodatkowego oszczędzania (PPK)."]
    },
    "związki zawodow": {
        "pros": ["**Dialog społeczny:** Silny głos pracowników równoważy przewagę korporacji.", "**Ochrona działaczy:** Zakaz zwalniania liderów związkowych pozwala na realną walkę o prawa załogi.", "**Układy zbiorowe:** Promocja negocjacji płacowych na poziomie całej branży."],
        "cons": ["**Uprzywilejowanie:** Zarzuty, że 'związkowy immunitet' jest nadużywany do ochrony nierobów.", "**Polityzacja:** Niektóre centrale związkowe otwarcie wspierają partie polityczne.", "**Blokowanie reform:** Opór związków w spółkach skarbu państwa hamuje niezbędną restrukturyzację (np. górnictwo)."]
    },

    # == EDUKACJA I NAUKA (ROZSZERZONE) ==
    "nauczyciel": {
        "pros": ["**Inwestycja w przyszłość:** Dobra szkoła wymaga najlepszych pedagogów, a ci muszą godnie zarabiać.", "**Prestiż zawodu:** Podwyżki (30-33%) mają zatrzymać exodus kadry ze szkół.", "**Autonomia:** Nauczyciel powinien być mentorem, a nie urzędnikiem realizującym ideologię."],
        "cons": ["**Karta Nauczyciela:** Archaiczny system awansu i przywilejów (pensum) utrudnia zarządzanie szkołą.", "**Brak doboru:** System nie promuje najlepszych, lecz tych, którzy 'wysiedzeli' stopnie awansu.", "**Koszt dla samorządów:** Rząd daje podwyżki, ale to gminy często muszą je sfinansować z własnych środków."]
    },
    "szkolnictw wyższ": {
        "pros": ["**Innowacyjność:** Uczelnie to kuźnia kadr dla nowoczesnej gospodarki.", "**Wsparcie studentów:** Stypendia i akademiki umożliwiające naukę mniej zamożnym.", "**Badań i Rozwój:** Nauka polska musi gonić świat w patentach i wdrożeniach."],
        "cons": ["**Beton na uczelniach:** Feudalne struktury i 'kliki' profesorskie blokują młodych naukowców.", "**Masowość:** Produkcja dyplomów bez pokrycia w umiejętnościach rynkowych.", "**Punktoza:** Pogoń za punktami w rankingach zamiast realnej wartości naukowej."]
    },
    "podręcznik": {
        "pros": ["**Darmowy dostęp:** Każdy uczeń powinien mieć równe szanse, niezależnie od zamożności rodziców.", "**Jakość treści:** Weryfikacja merytoryczna, aby uczyć faktów, a nie opinii.", "**Cyfryzacja:** E-podręczniki odciążają plecaki i są bardziej interaktywne."],
        "cons": ["**Monopolizacja:** Jeden 'słuszny' podręcznik (HiT) to narzędzie indoktrynacji.", "**Zmienność:** Ciągłe reformy podstawy programowej dezorientują uczniów i nauczycieli.", "**Koszty wydawców:** Rynek podręczników to miliardowy biznes, który walczy o wpływy."]
    },

    # == BEZPIECZEŃSTWO WEWNĘTRZNE ==
    "policj": {
        "pros": ["**Bezpieczeństwo ulic:** Widoczny patrol to najlepsza prewencja przestępczości.", "**Modernizacja:** Nowe radiowozy i komisariaty budują zaufanie do państwa.", "**Służba ludziom:** Hasło 'Pomagamy i Chronimy' musi być realizowane w praktyce."],
        "cons": ["**Brutalność:** Przypadki nadużycia siły (paralizatory, gaz) podważają zaufanie.", "**Upolitycznienie:** Wykorzystywanie policji do ochrony partyjnych wieców.", "**Kryzys kadrowy:** Tysiące wakatów sprawiają, że na interwencję czeka się godzinami."]
    },
    "straż pożarn": {
        "pros": ["**Zaufanie społeczne:** Strażacy to formacja ciesząca się najwyższym szacunkiem Polaków.", "**Wszechstronność:** Nie tylko pożary, ale wypadki drogowe, powodzie i usuwanie gniazd szerszeni.", "**Ochotnicy:** OSP to fundament bezpieczeństwa lokalnego i życia społecznego na wsi."],
        "cons": ["**Braki sprzętowe:** Wiele jednostek OSP wciąż jeździ zabytkowymi wozami.", "**Ryzyko:** Służba z narażeniem życia wymaga odpowiednich dodatków i przywilejów emerytalnych."]
    },
    "służb specjaln": {
        "pros": ["**Tarcza państwa:** Kontrwywiad chroni Polskę przed szpiegostwem (Rosja/Białoruś).", "**Cyberbezpieczeństwo:** ABW walczy z atakami na infrastrukturę krytyczną.", "**Walka z korupcją:** CBA ma patrzeć na ręce władzy (w teorii)."],
        "cons": ["**Inwigilacja:** Afera Pegasus pokazała ryzyko podsłuchiwania bez kontroli sądowej.", "**Służby polityczne:** Wykorzystywanie materiałów operacyjnych do niszczenia opozycji.", "**Brak nadzoru:** Sejmowa komisja ds. służb często jest fikcją."]
    },

    # == GOSPODARKA MORSKA ==
    "morsk": {
        "pros": ["**Okno na świat:** Porty w Gdańsku, Gdyni i Szczecinie generują miliardy z ceł.", "**Suwerenność:** Niezależność od obcych portów przeładunkowych (Hamburg).", "**Przemysł stoczniowy:** Próba odbudowy potencjału produkcji statków i jachtów."],
        "cons": ["**Zagrożenie ekologiczne:** Rozbudowa portów niszczy plaże i siedliska (np. rura w Świnoujściu).", "**Nierentowność:** Niektóre inwestycje (promy) są motywowane politycznie, a nie rynkowo.", "**Konkurencja:** Musimy walczyć o ładunki z potężnymi portami Morza Północnego."]
    },
    "rybołów": {
        "pros": ["**Tradycja:** Wsparcie dla rybaków to ochrona ginącego zawodu.", "**Jakość żywności:** Ryba z Bałtyku (mimo zanieczyszczeń) to produkt lokalny.", "**Odszkodowania:** Pomoc za zakazy połowów (dorsz)."],
        "cons": ["**Przełowienie:** Bałtyk umiera, a limity połowowe są koniecznością biologiczną.", "**Zanieczyszczenie:** Broń chemiczna na dnie morza to tykająca bomba.", "**Konflikt z wędkarzami:** Spór o limity dla wędkarstwa rekreacyjnego w portach."]
    },

    # == SPORT I TURYSTYKA ==
    "sportow": {
        "pros": ["**Zdrowie narodu:** Promocja aktywności fizycznej zmniejsza koszty leczenia w przyszłości.", "**Duma narodowa:** Sukcesy olimpijczyków budują wspólnotę.", "**Infrastruktura:** Orliki i hale służą lokalnym społecznościom."],
        "cons": ["**Komercjalizacja:** Wielkie pieniądze psują ducha fair play.", "**Afery w związkach:** PKOl i PZPN często kojarzą się z działaczami, a nie ze sportowcami.", "**Koszty imprez:** Organizacja wielkich igrzysk to często gigantyczne długi dla miast."]
    },
    "turystyk": {
        "pros": ["**Promocja Polski:** Pokazywanie świata piękna naszych gór, morza i miast.", "**Bon turystyczny:** Wsparcie dla polskich rodzin i branży hotelarskiej.", "**Lokalny biznes:** Turysta zostawia pieniądze w małych firmach i restauracjach."],
        "cons": ["**Overtourism:** Tłumy w Zakopanem czy Sopocie niszczą klimat i przyrodę.", "**Drożyzna:** Ceny w kurortach są często barierą dla przeciętnego Polaka.", "**Sezonowość:** Branża żyje tylko przez kilka miesięcy, co rodzi instabilność zatrudnienia."]
    },

    # == ADMINISTRACJA I SAMORZĄD (ROZSZERZONE) ==
    "samorząd": {
        "pros": ["**Decentralizacja:** Władza lokalna lepiej zna potrzeby mieszkańców niż Warszawa.", "**Inwestycje blisko ludzi:** Chodniki, oświetlenie i parki to zasługa gmin.", "**Małe ojczyzny:** Budowanie tożsamości lokalnej i zaangażowania obywatelskiego."],
        "cons": ["**Klientelizm:** W małych gminach wójt decyduje o pracy dla całej rodziny.", "**Rozwarstwienie:** Bogate miasta (Warszawa) mają miliardy, a wsie 'po-PGR' bankrutują.", "**Zadłużanie:** Samorządy emitują obligacje, których spłata obciąży przyszłe kadencje."]
    },
    "wybory": {
        "pros": ["**Święto demokracji:** Akt głosowania to fundament wolnego państwa.", "**Legitymizacja władzy:** Tylko mandat od wyborców daje prawo do rządzenia.", "**Frekwencja:** Wysoki udział w wyborach to dowód dojrzałości społeczeństwa."],
        "cons": ["**Polaryzacja:** Kampanie wyborcze dzielą Polaków na wrogie plemiona.", "**Finansowanie:** Miliony na billboardy i spoty, które nic nie wnoszą do debaty.", "**Obietnice bez pokrycia:** Kiełbasa wyborcza, za którą płacimy po wyborach."]
    },
    
    # == USTROJOWE I PRAWNE ==
    "trybunał konstytucyjn": {
        "pros": ["**Koniec chaosu prawnego:** Przywrócenie pewności, że wyroki są wydawane przez sędziów wybranych zgodnie z prawem.", "**Odblokowanie funduszy UE:** Spełnienie kluczowych 'kamieni milowych', co otworzy drogę do miliardów z KPO.", "**Standardy europejskie:** Dostosowanie polskiego prawa do wymogów Trybunału w Luksemburgu i Strasburgu."],
        "cons": ["**Ryzyko politycznego odwetu:** Zarzuty, że nowa władza stosuje te same metody siłowe, co poprzednicy.", "**Niepewność co do starych wyroków:** Możliwość podważania tysięcy decyzji wydanych w ostatnich latach.", "**Konflikt na szczytach władzy:** Ryzyko veta Prezydenta i paraliżu legislacyjnego."]
    },
    # "krs" removed - duplicate of line 138
    # },
    "sąd najwyższ": {
        "pros": ["**Autorytet najwyższej instancji:** Przywrócenie wiarygodności sądu, który ostatecznie rozstrzyga spory obywateli.", "**Bezstronność:** Gwarancja, że sprawy wyborcze i kasacje są rozpatrywane bez nacisków politycznych."],
        "cons": ["**Dualizm prawny:** Ryzyko istnienia dwóch równoległych Sądów Najwyższych, które się nie uznają.", "**Koszty zmian:** Odszkodowania dla usuwanych sędziów obciążą podatników."]
    },
    "komisja śledcz": {
        "pros": ["**Jawność i prawda:** Obywatele mają prawo wiedzieć o kulisach afer i  nieprawidłowościach władzy.", "**Rozliczalność polityków:** Sygnał, że nikt nie stoi ponad prawem, niezależnie od stanowiska.", "**Edukacja obywatelska:** Pokazanie mechanizmów patologii, aby uniknąć ich w przyszłości."],
        "cons": ["**Teatr polityczny:** Ryzyko zamiany poważnego śledztwa w medialny spektakl pod publiczkę.", "**Zastępowanie sądów:** To prokuratura i sądy powinny skazywać winnych, a nie posłowie w świetle kamer.", "**Koszty i czas:** Prace komisji trwają miesiącami i kosztują miliony, często bez konkretnych efektów karnych."]
    },
    "prokuratur": {
        "pros": ["**Niezależność śledczych:** Rozdzielenie funkcji Prokuratora Generalnego od Ministra Sprawiedliwości.", "**Skuteczność:** Koncentracja na walce z przestępczością, a nie na realizowaniu zleceń politycznych.", "**Przejrzystość:** Jasne kryteria awansów prokuratorskich."],
        "cons": ["**Wojna wewnętrzna:** Konflikt między 'starą' a 'nową' ekipą paraliżuje pracę śledczych.", "**Przewlekłość postępowań:** Zmiany organizacyjne mogą wydłużyć czas oczekiwania na sprawiedliwość.", "**Ryzyko dwuwładzy:** Spory kompetencyjne mogą doprowadzić do chaosu decyzyjnego."]
    },
    "trybunał": {
         "pros": ["**Praworządność:** Wykonanie wyroków sądów międzynarodowych i trybunałów.", "**Stabilność prawa:** Zakończenie sporów o status sędziów i wyroków."],
         "cons": ["**Suwerenność:** Ryzyko nadrzędności prawa unijnego nad krajową konstytucją.", "**Chaos kompetencyjny:** Spory między różnymi izbami i trybunałami."]
    },

    # == GOSPODARKA I FINANSE ==
    "budżet": {
        "pros": ["**Ciągłość państwa:** Zapewnienie pieniędzy na wypłaty dla nauczycieli, lekarzy i służb mundurowych.", "**Inwestycje w rozwój:** Środki na drogi, szkoły i szpitale, które służą wszystkim obywatelom.", "**Tarcza dla najsłabszych:** Finansowanie programów socjalnych chroniących przed ubóstwem."],
        "cons": ["**Życie na kredyt:** Kolejny rok z gigantycznym deficytem, który będą spłacać nasze dzieci.", "**Ukryte zadłużenie:** Wypychanie wydatków do funduszy poza kontrolą parlamentu (kreatywna księgowość).", "**Zbyt wysokie podatki:** Brak reform odciążających pracujących obywateli."]
    },
    # "vat" removed - duplicate of line 124
    # },
    # "inflac" removed - duplicate of line 20
    # },
    "podatki": {
        "pros": ["**Sprawiedliwość społeczna:** Bogatsi powinni dokładać się więcej do wspólnego budżetu.", "**Uproszczenie systemu:** Likwidacja zbędnych ulg i wyjątków.", "**Promocja inwestycji:** Zachęty podatkowe dla firm, które reinwestują zyski."],
        "cons": ["**Zniechęcenie przedsiębiorczych:** Wysokie podatki karzą za sukces i ciężką pracę.", "**Ucieczka kapitału:** Firmy mogą przenieść się do krajów z przyjaźniejszym fiskusem.", "**Skomplikowanie:** Polski system podatkowy jest jednym z najbardziej zawiłych w Europie."]
    },
    "mieszkalnictwo": {
        "pros": ["**Wsparcie młodych:** Programy dopłat do kredytów ułatwiają zakup pierwszego mieszkania.", "**Budownictwo społeczne:** Fundusze na tanie mieszkania na wynajem (TBS/SIM).", "**Ochrona lokatorów:** Zapobieganie dzikim eksmisjom i spekulacji."],
        "cons": ["**Wzrost cen:** Dopłaty do kredytów napędzają popyt, co winduje ceny mieszkań.", "**Transfer do banków:** Miliardy z budżetu trafiają do sektora finansowego zamiast budować mieszkania.", "**Brak podaży:** Bez odblokowania gruntów i deregulacji, mieszkań wciąż będzie za mało."]
    },

    # == INFRASTRUKTURA I ENERGETYKA ==
    # "cpk" removed - duplicate of line 96
    # },
    "elektrownia jądrow": {
        "pros": ["**Czysta i stabilna energia:** Atom to jedyny sposób na prąd bez CO2, niezależnie od tego, czy wieje wiatr.", "**Niezależność energetyczna:** Uniezależnienie się od importu gazu i węgla ze wschodu.", "**Nowoczesne technologie:** Wejście Polski do klubu państw posiadających zaawansowany know-how jądrowy."],
        "cons": ["**Ogromne koszty startowe:** Budowa elektrowni to wydatek rzędu kilkuset miliardów złotych.", "**Opóźnienia:** Takie inwestycje prawie zawsze trwają dłużej niż planowano.", "**Obawy lokalne:** Protesty mieszkańców, którzy boją się sąsiedztwa reaktora."]
    },
    "transport kolejow": {
        "pros": ["**Ekologiczny transport:** Pociąg to najczystszy środek masowego transportu.", "**Walka z wykluczeniem:** Przywracanie połączeń do mniejszych miejscowości.", "**Szybkość i komfort:** Modernizacja linii pozwala konkurować koleją z autostradami."],
        "cons": ["**Wieczne remonty:** Modernizacje trwają latami i paraliżują ruch pasażerski.", "**Drożyzna biletów:** Ceny przejazdów Intercity przestają być konkurencyjne.", "**Zaniedbania regionalne:** Skupienie na głównych trasach kosztem linii lokalnych."]
    },
    "drogi": {
        "pros": ["**Bezpieczeństwo:** Nowoczesne drogi ekspresowe drastycznie zmniejszają liczbę wypadków.", "**Rozwój regionów:** Dobry dojazd przyciąga inwestorów do polski powiatowej.", "**Komfort podróży:** Skrócenie czasu przejazdu między metropoliami."],
        "cons": ["**Betonoza:** Asfaltowanie kraju kosztem przyrody i krajobrazu.", "**Koszty utrzymania:** Gigantyczne wydatki na remonty w przyszłości.", "**Promocja aut:** Inwestowanie w drogi zamiast w transport publiczny zwiększa korki w miastach."]
    },

    # == SPOŁECZNE I ŚWIATOPOGLĄDOWE ==
    "aborcj": {
        "pros": ["**Podmiotowość kobiet:** Przywrócenie kobietom prawa decydowania o własnym zdrowiu i życiu.", "**Standardy cywilizacyjne:** Dostosowanie polskiego prawa do norm obowiązujących w większości krajów UE.", "**Bezpieczeństwo medyczne:** Lekarze przestaną bać się ratować życie ciężarnych w obawie przed prokuratorem."],
        "cons": ["**Ochrona życia:** Dla części społeczeństwa jest to naruszenie fundamentalnego prawa do życia od poczęcia.", "**Konflikt sumienia:** Zmuszanie lekarzy do procedur niezgodnych z ich etyką.", "**Głęboki podział społeczny:** Temat, który skrajnie polaryzuje Polaków i wywołuje emocje, a nie debatę."]
    },
    # "in vitro" removed - duplicate of line 178
    # },
    "związki partnersk": {
        "pros": ["**Godność i bezpieczeństwo:** Pary jednopłciowe zyskają prawo do informacji medycznej i dziedziczenia.", "**Koniec fikcji:** Prawo w końcu dostrzeże setki tysięcy ludzi żyjących w Polsce w nieformalnych związkach.", "**Prawa człowieka:** Realizacja wyroków ETPC nakazujących prawną instytucjonalizację par tej samej płci."],
        "cons": ["**Kwestia definicji rodziny:** Obawy konserwatystów o osłabienie tradycyjnego modelu małżeństwa.", "**Pierwszy krok:** Argument 'równi pochyłej' – obawa, że to wstęp do adopcji dzieci.", "**Sprzeciw konstytucyjny:** Wątpliwości, czy ustawa jest zgodna z art. 18 Konstytucji RP."]
    },
    "rent": {
        "pros": ["**Wsparcie pochorobowe:** Zapewnienie środków do życia osobom, które utraciły zdrowie w pracy.", "**Waloryzacja:** Konieczność dostosowania świadczeń do rosnących kosztów życia.", "**Sprawiedliwość społeczna:** Państwo ma obowiązek opiekować się tymi, którzy nie mogą sami na siebie zarobić."],
        "cons": ["**Szczelność systemu:** Ryzyko wyłudzania świadczeń przez osoby zdolne do pracy.", "**Obciążenie ZUS:** Rosnące wydatki na renty to wyższe składki dla wszystkich pracujących.", "**Pułapka bierności:** Zbyt łatwy dostęp do rent może zniechęcać do rehabilitacji i powrotu na rynek pracy."]
    },
    "niepełnosprawn": {
        "pros": ["**Godne życie:** Podwyższenie świadczeń pozwala na zaspokojenie podstawowych potrzeb.", "**Asystencja osobista:** Realne wsparcie w codziennym funkcjonowaniu i aktywizacji.", "**Równość szans:** Likwidacja barier architektonicznych i społecznych."],
        "cons": ["**Brak systemowości:** Kolejne dodatki nie zastąpią kompleksowej reformy orzecznictwa.", "**Niewystarczające środki:** Opiekunowie wciąż wskazują na dramatycznie niskie wsparcie.", "**Biurokracja:** Skomplikowane procedury ubiegania się o pomoc."]
    },

    # == ZDROWIE ==
    "zdrow": {
        "pros": ["**Dostępność leczenia:** Zwiększenie nakładów na NFZ ma skrócić kolejki do specjalistów.", "**Profilaktyka:** Darmowe badania przesiewowe pozwolą wykrywać choroby we wczesnym stadium.", "**Kadry medyczne:** Podwyżki dla lekarzy i pielęgniarek mają zatrzymać ich w publicznym systemie."],
        "cons": ["**Dziura budżetowa:** NFZ wciąż boryka się z brakiem pieniędzy, a potrzeby rosną.", "**Prywatyzacja tylnymi drzwiami:** Coraz więcej usług jest dostępnych tylko odpłatnie.", "**Zapaść psychiatrii:** Pomimo reform, opieka psychiatryczna w Polsce jest w stanie krytycznym."]
    },
    "leki": {
        "pros": ["**Nowoczesne terapie:** Refundacja innowacyjnych leków ratujących życie.", "**Tanie leki:** Program darmowych leków dla seniorów i dzieci obniża koszty życia rodzin.", "**Bezpieczeństwo lekowe:** Wsparcie produkcji farmaceutycznej w Polsce."],
        "cons": ["**Braki w aptekach:** Problemy z dostępnością kluczowych preparatów (eksport równoległy).", "**Kryteria refundacji:** Wielu pacjentów wciąż musi płacić 100% ceny za niezbędne leki.", "**Koszt dla podatnika:** Coraz wyższe wydatki na refundację obciążają budżet NFZ."]
    },

    # == ZAGRANICA I OBRONNOŚĆ ==
    # "ukrain" removed - duplicate of line 206
    # },
    "obron": {
        "pros": ["**Siła odstraszania:** Nowoczesna armia ma sprawić, że nikt nie odważy się zaatakować Polski.", "**Modernizacja techniczna:** Zastąpienie posowieckiego złomu nowoczesnym sprzętem z USA i Korei.", "**Bezpieczeństwo granic:** Wzmocnienie ochrony wschodniej granicy przed hybrydowymi atakami."],
        "cons": ["**Gigantyczne zadłużenie:** Zakupy broni na kredyt zadłużą nas na dekady (Fundusz Wsparcia Sił Zbrojnych).", "**Braki kadrowe:** Sprzęt to nie wszystko – w wojsku brakuje ludzi do jego obsługi.", "**Brak infrastruktury:** Nie mamy hangarów i zaplecza dla setek nowych czołgów i samolotów."]
    },
    "unij": {
        "pros": ["**Silniejsza Polska:** Obecność w jądrze decyzyjnym UE daje nam wpływ na losy kontynentu.", "**Fundusze na rozwój:** Miliardy euro na transformację energetyczną i cyfrową.", "**Wspólne bezpieczeństwo:** UE to nie tylko gospodarka, ale też solidarność polityczna wobec zagrożeń."],
        "cons": ["**Utrata suwerenności:** Przekazywanie kolejnych kompetencji do Brukseli (federalizacja).", "**Kosztowna transformacja:** Unijna polityka klimatyczna (ETS) podnosi ceny energii w Polsce.", "**Biurokracja:** Unijne regulacje bywają oderwane od lokalnej specyfiki i obciążają firmy."]
    },

    # == ROLNICTWO, ŚRODOWISKO I KLIMAT ==
    "rolnic": {
        "pros": ["**Talerz Polaka:** Ochrona rodzimej produkcji to gwarancja, że nie zabraknie nam żywności.", "**Wsparcie w kryzysie:** Dopłaty ratują gospodarstwa przed bankructwem w obliczu trudnych warunków rynkowych.", "**Rozwój wsi:** Nowoczesne rolnictwo to szansa na godne życie na prowincji."],
        "cons": ["**Uzależnienie od dotacji:** System dopłat może hamować innowacyjność i zmiany strukturalne.", "**Konflikt z ekologią:** Rolnictwo przemysłowe negatywnie wpływa na środowisko i wody.", "**Protektionizm:** Zamykanie rynku szkodzi konsumentom, którzy płacą drożej za żywność."]
    },
    "odr": {
        "pros": ["**Ratunek dla rzeki:** Program renaturyzacji ma przywrócić życie w zatrutej rzece.", "**Bezpieczeństwo:** Inwestycje przeciwpowodziowe ochronią nadodrzańskie miasta.", "**Turystyka:** Czysta rzeka to potencjał turystyczny dla całego regionu zachodniej Polski."],
        "cons": ["**Betonowanie rzek:** Ekolodzy ostrzegają, że regulacja rzeki zniszczy unikalne ekosystemy.", "**Konflikt interesów:** Żegluga śródlądowa kłóci się z funkcją przyrodniczą rzeki.", "**Spór z Niemcami:** Różne wizje zagospodarowania Odry prowadzą do napięć dyplomatycznych."]
    },
    "lasy": {
        "pros": ["**Surowiec narodowy:** Drewno to polskie 'zielone złoto', dające pracę tysiącom ludzi.", "**Dostępność dla wszystkich:** Polskie lasy są otwarte, w przeciwieństwie do prywatnych lasów na zachodzie.", "**Ochrona przyrody:** Leśnicy dbają o równowagę ekosystemu i nasadzenia."],
        "cons": ["**Rzeź drzew:** Zarzuty o nadmierną wycinkę motywowaną zyskiem ze sprzedaży drewna (eksport do Chin).", "**Upolitycznienie:** Lasy Państwowe stały się łupem politycznym, a nie instytucją przyrodniczą.", "**Niszczenie puszcz:** Wycinka w cennych przyrodniczo lasach (np. Karpaty) jest nieodwracalna."]
    },
    "klimat": {
        "pros": ["**Odpowiedzialność za planetę:** Walka z globalnym ociepleniem to obowiązek wobec przyszłych pokoleń.", "**Czyste powietrze:** Odejście od paliw kopalnych zmniejszy smog i poprawi zdrowie Polaków.", "**Innowacyjna gospodarka:** Zielona transformacja to szansa na rozwój nowych technologii."],
        "cons": ["**Zabójcze koszty:** Opłaty za emisję CO2 (ETS) drastycznie podnoszą ceny prądu i ogrzewania.", "**Utrata konkurencyjności:** Europejski przemysł ucieka tam, gdzie energia jest tańsza.", "**Ubóstwo energetyczne:** Najbiedniejsi zapłacą najwyższą cenę za ambitne cele klimatyczne."]
    },
    "odpady": {
        "pros": ["**Gospodarka obiegu zamkniętego:** Odpady to surowce, które można ponownie wykorzystać (recykling).", "**System kaucyjny:** Walka z plastikiem zaśmiecającym lasy i ulice.", "**Czyste otoczenie:** Likwidacja dzikich wysypisk i spalania śmieci w piecach."],
        "cons": ["**Wzrost opłat:** Segregacja i recykling kosztują, co widać na rachunkach mieszkańców.", "**Uciążliwość dla biznesu:** Sklepy muszą inwestować w automaty do zwrotu butelek.", "**Mafia śmieciowa:** Nielegalny import i podpalenia składowisk to wciąż nierozwiązany problem."]
    },

    # == CYFRYZACJA, NAUKA I KULTURA ==
    "cyfryzac": {
         "pros": ["**Państwo w smartfonie:** Aplikacja mObywatel ułatwia załatwianie spraw urzędowych bez wychodzenia z domu.", "**Cyberbezpieczeństwo:** Ochrona infrastruktury krytycznej przed rosyjskimi atakami hakerskimi.", "**Nowoczesna edukacja:** Laptopy dla uczniów i szybki internet w szkołach."],
         "cons": ["**Wykluczenie cyfrowe:** Seniorzy mogą mieć problem z dostępem do usług, które znikają z okienek.", "**Inwigilacja:** Gromadzenie danych o obywatelach w jednej bazie rodzi ryzyko nadużyć.", "**Awarie:** Uzależnienie od systemów IT oznacza paraliż w przypadku braku prądu lub błędu."]
    },
    "kultur": {
        "pros": ["**Tożsamość narodowa:** Dofinansowanie muzeów i teatrów buduje wspólnotę i patriotyzm.", "**Wsparcie twórców:** Ubezpieczenia i stypendia dla artystów, którzy często żyją w niepewności.", "**Renowacja zabytków:** Ratowanie niszczejących pereł architektury dla przyszłych pokoleń."],
        "cons": ["**Cenzura ekonomiczna:** Obawy, że granty dostają tylko artyści 'poprawni' politycznie.", "**Kosztowna propaganda:** Zarzuty, że instytucje kultury służą promocji jedynie słusznej wizji historii.", "**Niskie płace:** Pracownicy kultury (bibliotekarze, muzealnicy) zarabiają często pensję minimalną."]
    },
    
    # == PROCEDURALNE I INNE ==
    "wotum nieufności": {
        "pros": ["**Sprawdzam:** Opozycja korzysta z prawa do rozliczenia rządu z błędów i zaniechań.", "**Debata publiczna:** Okazja do przedstawienia alternatywnej wizji rządzenia państwem.", "**Demokracja w działaniu:** Mechanizm kontrolny wpisany w Konstytucję."],
        "cons": ["**Polityczny teatr:** Z góry wiadomo, że wniosek przepadnie, więc jest to strata czasu Sejmu.", "**Destabilizacja:** Ciągłe wnioski o odwołanie paraliżują pracę ministerstw.", "**Brak konstruktywności:** Zamiast merytoryki, debata zamienia się w festiwal obelg."]
    }
}

DEFAULT_PROS = ["**Porządkowanie prawa:** Nowelizacja usuwa luki i błędy w dotychczasowych przepisach.", "**Dostosowanie do rzeczywistości:** Prawo musi nadążać za zmianami społecznymi i technologicznymi.", "**Realizacja obietnic:** Ustawa jest elementem programu, na który umówili się rządzący z wyborcami."]
DEFAULT_CONS = ["**Inflacja prawa:** Zbyt częste zmiany przepisów wprowadzają chaos i niepewność.", "**Wątpliwości ekspertów:** Biuro Analiz Sejmowych zgłaszało zastrzeżenia do jakości legislacji.", "**Brak konsultacji:** Zarzut, że ustawa była procedowana zbyt szybko, bez wysłuchania głosu obywateli."]

def clean_title(title):
    # Aggressive cleaning to extract the core subject
    subject = re.sub(r'^Pkt \d+\.?\s*(porz\. dzien\.)?\s*', '', title, flags=re.IGNORECASE)
    subject = re.sub(r'^Sprawozdanie Komisji o\s+', '', subject, flags=re.IGNORECASE)
    subject = re.sub(r'^rządowym projekcie ustawy', 'rządowym projekcie', subject, flags=re.IGNORECASE)
    subject = re.sub(r'^poselskim projekcie ustawy', 'poselskim projekcie', subject, flags=re.IGNORECASE)
    subject = re.sub(r'\(druki?.*?\)', '', subject, flags=re.IGNORECASE)
    return subject.strip()

def create_expert_summary(title, category, verdict):
    """
    Creates a JOURNALISTIC style summary.
    Instead of passive "Sejm przyjął", provides context and consequence.
    """
    title_lower = title.lower()
    subject = clean_title(title)
    if len(subject) > 250: subject = subject[:247] + "..."

    # Detect Type
    vote_type = "Standard"
    if "uchwale senatu" in title_lower: vote_type = "Senat"
    elif "trzecie czytanie" in title_lower or "głosowanie nad całością" in title_lower: vote_type = "Final"
    elif "wotum nieufności" in title_lower: vote_type = "Wotum"
    elif "odrzucenie" in title_lower: vote_type = "Rejection"

    # Journalistic Templates
    summary = ""
    
    if verdict == "PRZYJĘTO":
        if vote_type == "Final":
            summary = f"🏛️ Decyzja zapadła. Sejm ostatecznie uchwalił ustawę. Projekt: {subject}. Teraz dokument trafi na biurko Prezydenta (lub do Senatu)."
        elif vote_type == "Senat":
            summary = f"⚖️ Sejm rozstrzygnął. Posłowie zagłosowali w sprawie poprawek Senatu do ustawy: {subject}. Stanowisko izby niższej jest wiążące."
        elif vote_type == "Wotum":
            summary = f"🚨 Wotum nieufności uchwalone! Sejm wycofał poparcie dla ministra/rządu. To rzadka sytuacja, oznaczająca dymisję. Temat: {subject}."
        elif vote_type == "Rejection":
            summary = f"🗑️ Projekt do kosza. Sejm zdecydował o odrzuceniu projektu już na tym etapie: {subject}."
        else:
            summary = f"✅ Wniosek przyjęty. Sejm zgodził się na propozycję w głosowaniu: {subject}."
    
    elif verdict == "ODRZUCONO":
        if vote_type == "Rejection":
            summary = f"🛡️ Projekt obroniony. Sejm nie zgodził się na odrzucenie projektu: {subject}. Prace nad ustawą będą kontynuowane."
        elif vote_type == "Wotum":
            summary = f"🔒 Minister bezpieczny. Opozycji nie udało się zebrać większości do odwołania członka rządu. Wniosek: {subject} upadł."
        else:
            summary = f"❌ Sprzeciw Sejmu. Większość poselska zagłosowała przeciwko. Temat głosowania: {subject}."

    return summary

def generate_heuristic_analysis_expert():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("🎓 Starting EXPERT Analysis Engine (Journalist/Lawyer Mode)...")
    
    cur.execute("SELECT id, title_clean, verdict, category FROM votes ORDER BY date DESC")
    votes = cur.fetchall()
    
    total = len(votes)
    print(f"📊 Analyzing {total} votes with EXPERT logic...")
    
    batch_data = []
    
    for idx, row in enumerate(votes):
        vote_id, title, verdict, category = row
        title_lower = title.lower()
        
        # 1. Generate EXPERT Summary
        summary = create_expert_summary(title, category, verdict)
        
        # 2. Generate Context-Aware Pros/Cons (MULTI-CONTEXT + DEDUPLICATION)
        pros = []
        cons = []
        detected_topics = []
        
        # Scan for ALL matching keywords
        for kw, data in KEYWORD_ARGUMENTS.items():
            if kw in title_lower:
                detected_topics.append(kw)
                pros.extend(data["pros"])
                cons.extend(data["cons"])
        
        # DEDUPLICATE and PRIORITIZE
        if detected_topics:
            # Remove duplicates while preserving order
            pros = list(dict.fromkeys(pros))
            cons = list(dict.fromkeys(cons))
            
            # Format tags nicely
            tags = [t.capitalize() for t in detected_topics]
            tags_display = list(dict.fromkeys(tags))[:5]
            summary += f"\n\n🏷️ **Kluczowe konteksty:** {', '.join(tags_display)}."
        else:
            # Fallback
            if "odrzucenie" in title_lower:
                 pros = KEYWORD_ARGUMENTS["wotum nieufności"]["pros"] # reusing generic political control pros
                 cons = ["**Ryzyko błędu:** Odrzucenie projektu na tak wczesnym etapie uniemożliwia jego poprawę w komisjach."]
            else:
                 pros = DEFAULT_PROS
                 cons = DEFAULT_CONS

        # Limit to top 4 bullets to avoid walls of text
        pros = pros[:4]
        cons = cons[:4]

        # CLEANUP: Remove Markdown bold syntax '**' as per user request (UI doesn't support it)
        summary = summary.replace("**", "")
        pros = [p.replace("**", "") for p in pros]
        cons = [c.replace("**", "") for c in cons]

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
    
    print("\n✅ EXPERT Analysis Complete!")
    conn.close()

if __name__ == "__main__":
    generate_heuristic_analysis_expert()
