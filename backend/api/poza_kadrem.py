from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.poza_kadrem import PozaKadrem

router = APIRouter()

@router.get("/")
def lista_raportow(db: Session = Depends(get_db)):
    """Pobiera listę wszystkich raportów śledczych"""
    return db.query(PozaKadrem).all()

@router.get("/{raport_id}")
def szczegoly_raportu(raport_id: str, db: Session = Depends(get_db)):
    """Pobiera pełne dane konkretnego raportu"""
    wynik = db.query(PozaKadrem).filter(PozaKadrem.id == raport_id).first()
    if not wynik:
        raise HTTPException(status_code=404, detail="Nie znaleziono raportu w archiwum Poza Kadrem")
    return wynik

@router.post("/aktualizuj-baze-demo")
def seed_poza_kadrem(db: Session = Depends(get_db)):
    """Zasila bazę danymi początkowymi (Kobalt i Edukacja)"""
    db.query(PozaKadrem).delete()
    
    raporty = [
        PozaKadrem(
            id="kobalt",
            tytul="ANALIZA ŁAŃCUCHA DOSTAW KOBALTU",
            podtytul="RAPORT 01 / 2026",
            okladka="brain/0ad6d0e8-294a-4318-bca4-9f5af2ac0597/kobalt_mine_brutalism_1778603263113.png",
            struktura_json={
                "spis_tresci": [
                    {"id": "sec-1", "label": "GENEZA I TRANSFORMACJA ENERGETYCZNA"},
                    {"id": "sec-2", "label": "MECHANIZMY REGULACYJNE UE"},
                    {"id": "sec-3", "label": "RZECZYWISTOŚĆ WYDOBYWCZA (DR KONGA)"},
                    {"id": "sec-4", "label": "UZALEŻNIENIE GEOPOLITYCZNE I WNIOSKI"}
                ],
                "sekcje": [
                    {"id": "sec-1", "tytul": "01 / GENEZA", "tekst": "Porozumienie Paryskie wyznaczyło kierunek. Dekarbonizacja transportu stała się priorytetem."},
                    {"id": "sec-2", "tytul": "02 / REGULACJA", "tekst": "Pakiet \"Fit for 55\" przyspieszył popyt na baterie."},
                    {"id": "sec-3", "tytul": "03 / FAKTY", "tekst": "70% kobaltu pochodzi z Konga. Analiza 1420 dokumentów wykazuje nieprawidłowości."},
                    {"id": "sec-4", "tytul": "04 / WNIOSKI", "tekst": "Uzależnienie od Rosji zamieniamy na uzależnienie od Chin."}
                ],
                "drugi_plan": {
                    "tytul": "DRUGI PLAN",
                    "opis": "Zestawienie oficjalnych kampanii UE z rzeczywistością kopalń.",
                    "obrazek": "brain/0ad6d0e8-294a-4318-bca4-9f5af2ac0597/kobalt_mine_brutalism_1778603263113.png"
                }
            }
        ),
        PozaKadrem(
            id="edukacja",
            tytul="REFORMA SZKOLNICTWA: MODERNIZACJA CZY FASADA?",
            podtytul="RAPORT 02 / 2026",
            okladka="https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=1200&auto=format&fit=crop",
            struktura_json={
                "spis_tresci": [
                    {"id": "sec-1", "label": "GENEZA: CYFROWA SZKOŁA 2026"},
                    {"id": "sec-2", "label": "MECHANIZMY: ZMIANY PROGRAMOWE"},
                    {"id": "sec-3", "label": "FAKTY: KRYZYS KADROWY"},
                    {"id": "sec-4", "label": "WNIOSKI: KOSZT ZMIANY"}
                ],
                "sekcje": [
                    {"id": "sec-1", "tytul": "01 / GENEZA", "tekst": "Rządowy program \"Cyfrowa Szkoła 2026\" zakładał pełną digitalizację."},
                    {"id": "sec-2", "tytul": "02 / REGULACJA", "tekst": "Nowelizacja ustawy wprowadziła cięcia w podstawie programowej."},
                    {"id": "sec-3", "tytul": "03 / FAKTY", "tekst": "W Polsce brakuje obecnie 20 000 nauczycieli."},
                    {"id": "sec-4", "tytul": "04 / WNIOSKI", "tekst": "Inwestycje w sprzęt dominują nad inwestycją w ludzi."}
                ],
                "drugi_plan": {
                    "tytul": "DRUGI PLAN",
                    "opis": "Wizja cyfrowej szkoły vs rzeczywistość wakatów.",
                    "obrazek": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=500&auto=format&fit=crop"
                }
            }
        ),
        PozaKadrem(
            id="afera-reprywatyzacyjna",
            tytul="AFERA REPRYWATYZACYJNA W WARSZAWIE",
            podtytul="RAPORT ŚLEDCZY: SYSTEM ZBUDOWANY NA LUKACH",
            okladka="",
            struktura_json={
                "spis_tresci": [
                    {"id": "w1", "label": "POWIERZCHNIA"},
                    {"id": "w2", "label": "KORZENIE PROBLEMU (DEKRET BIERUTA)"},
                    {"id": "w3", "label": "PIERWSZE PYTANIE: JAK TO MOŻLIWE?"},
                    {"id": "w4", "label": "HANDEL ROSZCZENIAMI (ZŁOTY WIEK)"},
                    {"id": "w5", "label": "LUDZKIE KOSZTY (SPRAWA J. BRZESKIEJ)"},
                    {"id": "w6", "label": "MECHANIZM PARALIŻU"},
                    {"id": "w7", "label": "KRONIKA ZANIEDBAŃ (OŚ CZASU)"},
                    {"id": "w8", "label": "CEGIEŁKA PO CEGIEŁCE"},
                    {"id": "w9", "label": "ROZLICZENIA I KOMISJA"},
                    {"id": "w10", "label": "ŹRÓDŁA"}
                ],
                "sekcje": [
                    {
                        "id": "w1",
                        "typ": "hero-number",
                        "liczba": "2 400",
                        "tekst": "Tyle rodzin straciło mieszkania w Warszawie między 2012 a 2016 rokiem."
                    },
                    {
                        "id": "w2",
                        "tytul": "Korzenie problemu: Dekret Bieruta i jego długi cień",
                        "tekst": "<p>Zrozumienie afery reprywatyzacyjnej w Warszawie wymaga cofnięcia się w czasie do 26 października 1945 roku. To właśnie wtedy Krajowa Rada Narodowa wydała dekret o własności i użytkowaniu gruntów na obszarze m.st. Warszawy, znany powszechnie jako <strong>Dekret Bieruta</strong>. Z dnia na dzień, na mocy tego aktu prawnego, wszystkie grunty w granicach przedwojennej Warszawy przeszły na własność gminy (a w 1950 roku – państwa). Zrujnowana po wojnie stolica wymagała odbudowy, a komunistyczne władze argumentowały, że bez nacjonalizacji gruntów planowe podniesienie miasta z gruzów będzie niemożliwe.</p><p>Dekret nie pozbawiał jednak dawnych właścicieli własności budynków (kamienic), a jedynie gruntów pod nimi. Dawał też teoretyczne prawo do złożenia w ciągu pół roku wniosku o przyznanie prawa własności czasowej (późniejszego użytkowania wieczystego) do przejętego gruntu. W praktyce komunistyczne władze masowo, z przyczyn ideologicznych i politycznych, odrzucały takie wnioski. Po transformacji ustrojowej w 1989 roku dawni właściciele lub ich spadkobiercy zyskali wreszcie realną możliwość dochodzenia swoich praw przed sądami, domagając się unieważnienia tamtych, wydanych z naruszeniem prawa, decyzji odmownych. I to tu zaczyna się prawdziwy problem.</p><p>Polska, w przeciwieństwie do wielu innych państw bloku wschodniego, nigdy nie przyjęła kompleksowej ustawy reprywatyzacyjnej. Kolejne projekty upadały w parlamencie, a najbardziej zaawansowany został zawetowany przez prezydenta Aleksandra Kwaśniewskiego w 2001 roku z obawy przed gigantycznymi kosztami dla budżetu państwa. Ten brak systemowego rozwiązania stworzył potężną lukę prawną. Zamiast przejrzystego systemu odszkodowań (np. w wysokości 20% wartości utraconego mienia), pozostawiono sprawę sądom administracyjnym i urzędnikom miejskim. Każda sprawa była rozpatrywana indywidualnie w oparciu o przepisy Kodeksu postępowania administracyjnego.</p><p>W tej mętnej wodzie zaczęły pojawiać się rekiny. Ponieważ postępowania zwrotowe trwały latami, wymagały wiedzy prawniczej i pokonywania absurdalnych przeszkód biurokratycznych, prawowici spadkobiercy (często w podeszłym wieku, mieszkający za granicą) tracili cierpliwość. Chętnie odsprzedawali swoje 'roszczenia' (czyli ekspektatywę praw do nieruchomości) wyspecjalizowanym kancelariom prawnym, handlarzom i biznesmenom – często za ułamek faktycznej rynkowej wartości kamienicy.</p>"
                    },
                    {
                        "id": "w3",
                        "typ": "map-points",
                        "pytanie": "Jak to było możliwe?",
                        "tekst": "Miasto oddawało kamienice 'spadkobiercom' i handlarzom na podstawie szczątkowych, a czasem wręcz sfałszowanych dokumentów. Lokatorzy komunalni, którzy przez dekady inwestowali własne środki w remonty mieszkań, z dnia na dzień dostawali drastyczne podwyżki czynszów i nakazy eksmisji."
                    },
                    {
                        "id": "w4",
                        "tytul": "Złoty wiek handlu roszczeniami i metoda na 'kuratora'",
                        "tekst": "<p>Gdy wyspecjalizowane grupy przejęły rynek roszczeń, afera reprywatyzacyjna weszła w fazę przemysłową. Urząd m.st. Warszawy – ze szczególnym uwzględnieniem Biura Gospodarki Nieruchomościami (BGN) – wydawał decyzje zwrotowe taśmowo, często z pominięciem podstawowych weryfikacji. Odkryto liczne przypadki wydawania kamienic na rzecz rzekomych spadkobierców, którzy, gdyby żyli, mieliby po 120 lub 130 lat. W ten sposób zrodziła się słynna 'metoda na kuratora'.</p><p>Mechanizm był perfidny w swej prostocie. Handlarze roszczeniami występowali do sądów rejonowych o ustanowienie ich 'kuratorami dla osób nieobecnych' (czyli dawnych właścicieli, z którymi nie było kontaktu od czasów II wojny światowej). Sądy niezwykle pobłażliwie i bez głębszego zbadania sprawy ustanawiały takie kuratele. Handlarz, stając się kuratorem 120-letniego zaginionego, szedł do Urzędu Miasta, składał wniosek o zwrot kamienicy, a po pozytywnej decyzji... sprzedawał tę kamienicę samemu sobie lub powiązanym spółkom. Miasto oddawało w ten sposób wielomilionowe majątki w ręce oszustów.</p><p>Sztandarowym przykładem takiego procederu stała się działka na placu Defilad, tuż przy Pałacu Kultury i Nauki (dawny adres: Chmielna 70). Przed wojną należała do obywatela Danii, któremu po wojnie rząd PRL wypłacił odszkodowanie na podstawie układów indemnizacyjnych. Z punktu widzenia prawa działka była 'czysta' i należała do miasta. Mimo to trójka znanych warszawskich handlarzy roszczeniami zdołała nabyć roszczenia do tego niezwykle atrakcyjnego (warte ok. 160 milionów złotych) skrawka ziemi, a w 2012 roku miasto wydało decyzję o zwrocie. To właśnie śledztwo wokół Chmielnej 70, nagłośnione przez media i społeczników, zapoczątkowało upadek układu reprywatyzacyjnemu i wymusiło powołanie Komisji Weryfikacyjnej.</p><p>Warto dodać, że w całym tym procesie niezwykle istotną rolę odgrywali prawnicy, notariusze oraz rzeczoznawcy majątkowi, którzy legitymizowali i 'legalizowali' cały proceder. W aktach notarialnych kwoty transakcji były często zaniżane do absurdalnych rozmiarów, a 'odnalezione' w archiwach dokumenty weryfikowano wybiórczo. Reprywatyzacja w Warszawie przypominała doskonale naoliwioną maszynę finansową do transferu majątku publicznego w ręce prywatne, chronioną immunitetem skomplikowanych przepisów i tajemnicy adwokackiej.</p>"
                    },
                    {
                        "id": "w5",
                        "tytul": "Ludzkie koszty: Dramat lokatorów i morderstwo Jolanty Brzeskiej",
                        "tekst": "<p>Prawnicze sztuczki, wielomilionowe transakcje i decyzje administracyjne to tylko jedna strona medalu. Po drugiej znajdowali się ludzie – tysiące lokatorów komunalnych mieszkań, które miasto lekką ręką oddawało 'czyszcicielom kamienic'. Z chwilą odzyskania budynku, nowi właściciele stosowali sprawdzone i bezwzględne metody pozbywania się lokatorów, by móc z zyskiem sprzedać apartamenty na wolnym rynku. Czynsze były podnoszone z dnia na dzień o kilkaset procent. Zimą odcinano ogrzewanie i wyłączano dostęp do bieżącej wody. Celowo dewastowano klatki schodowe, zasypywano piony kanalizacyjne gruzem lub wyrzucano śmieci pod drzwi opornych lokatorów.</p><p>Najtragiczniejszym i najbardziej wstrząsającym symbolem tej nierównej walki stała się sprawa Jolanty Brzeskiej. Była ona wieloletnią lokatorką warszawskiej kamienicy przy ulicy Nabielaka 9 i współzałożycielką Warszawskiego Stowarzyszenia Lokatorskiego. Gdy budynek został przejęty przez znanego handlarza roszczeniami, Marka M., Brzeska stała się głównym celem nękania. Mimo gróźb, eksmisji i gigantycznych (naliczanych bezprawnie) długów czynszowych, nie chciała ustąpić i nagłaśniała metody 'czyszczycieli'.</p><p>1 marca 2011 roku Jolanta Brzeska zniknęła. Kilka dni później jej zwęglone ciało odnaleziono w Lesie Kabackim na obrzeżach Warszawy. Została oblana łatwopalną substancją i spalona żywcem. Początkowo prokuratura i policja próbowały forsować absurdalną tezę o samobójstwie. Dopiero po ogromnej presji społecznej i medialnej zmieniono kwalifikację na zabójstwo. Niestety, mimo upływu lat i powołania specjalnych zespołów śledczych, sprawcy tej zbrodni oraz ich zleceniodawcy nigdy nie zostali pociągnięci do odpowiedzialności. Śmierć Brzeskiej rzuciła mroczny cień na cały proces reprywatyzacji, pokazując, że gra toczyła się o tak wielkie pieniądze, że życie ludzkie nie miało w niej żadnej wartości.</p><p>Poza tym najbardziej znanym morderstwem, setki innych starszych i schorowanych osób straciło dach nad głową, co dla wielu zakończyło się zawałami, depresją, a w skrajnych przypadkach przedwczesną śmiercią lub bezdomnością. Zjawisko to, nazywane przez społeczników 'zbrodnią reprywatyzacyjną', było latami ignorowane przez władze centralne i samorządowe, które uważały, że 'prawo własności jest święte' i ignorowały społeczne dramaty odbywające się w zwróconych kamienicach.</p>"
                    },
                    {
                        "id": "w6",
                        "typ": "timeline-votes",
                        "pytanie": "Kto pozwalał na to tak długo?",
                        "tekst": "Uchwalenie małej ustawy reprywatyzacyjnej (zabezpieczającej budynki użyteczności publicznej) zajęło 25 lat. Przez ponad dekadę organizacje społeczne odbijały się od ściany w Radzie Miasta i parlamencie. Interesy partyjne wielokrotnie przeważały nad próbą załatania luki prawnej."
                    },
                    {
                        "id": "w7",
                        "tytul": "Systemowy paraliż, opór i wreszcie reakcja państwa",
                        "tekst": "<p>Pytanie, które do dziś zadaje sobie wielu badaczy i mieszkańców stolicy, brzmi: dlaczego instytucje państwa, od prokuratury, przez sądy, aż po władze samorządowe i parlamentarne, przez kilkanaście lat pozostawały całkowicie ślepe i bierne wobec tak jawnych nadużyć? Wiele wskazuje na głęboki paraliż systemowy i cichą zgodę elit polityczno-prawniczych na ten proceder.</p><p>W Ratuszu wykształciła się wąska grupa urzędników podejmująca kluczowe decyzje majątkowe przy minimalnym nadzorze politycznym. Prokuratury seryjnie umarzały zawiadomienia składane przez zdesperowanych lokatorów, uznając spory między nowymi 'właścicielami' a mieszkańcami za spory czysto cywilnoprawne. Sądy z niezwykłą swobodą ustanawiały kuratorów dla 130-latków i reaktywowały martwe przedwojenne spółki w oparciu o przedwojenne akcje na okaziciela, kupione za bezcen na targach staroci.</p><p>Dopiero potężny kryzys wizerunkowy związany z aferą wokół Chmielnej 70 w 2016 roku, ujawniony przez dziennikarzy 'Gazety Wyborczej' oraz miejskich aktywistów ze stowarzyszenia Miasto Jest Nasze, zmusił władze centralne do stanowczej reakcji. W 2017 roku powołano specjalną Komisję do spraw usuwania skutków prawnych decyzji reprywatyzacyjnych (potocznie: Komisję Weryfikacyjną). Jej zadaniem było badanie prawidłowości wydanych decyzji i, w przypadku stwierdzenia rażących naruszeń prawa, cofanie ich.</p><p>Działalność komisji doprowadziła do zatrzymania procederu dzikiej reprywatyzacji, odebrania dziesiątek kamienic i wielomilionowych odszkodowań wyłudzonych przez handlarzy roszczeniami, a także postawienia zarzutów korupcyjnych kluczowym urzędnikom warszawskiego Ratusza i kilku adwokatom. Mimo że część jej decyzji jest do dziś podważana przed sądami administracyjnymi z uwagi na zawiłości konstytucyjne jej umocowania, jej istnienie ostatecznie złamało 'zmowę milczenia'. Niemniej jednak dla wielu ofiar reprywatyzacji ta sprawiedliwość nadeszła zdecydowanie za późno – ich życia i społeczności zostały nieodwracalnie zniszczone przez system zbudowany na zaniechaniach i lukach.</p>"
                    },
                    {
                        "id": "w8",
                        "typ": "flow-diagram",
                        "pytanie": "Struktura przekrętu stulecia",
                        "tekst": "To nie były pojedyncze zaniedbania. Prawo które miało chronić właścicieli przedwojennych nieruchomości stało się narzędziem do przejmowania majątku publicznego. Luka w przepisach + brak centralnego rejestru + patologie w sądach i ratuszu = gigantyczny zysk dla garstki spekulantów."
                    },
                    {
                        "id": "w9",
                        "tytul": "Podsumowanie: Czego uczy nas afera w Warszawie?",
                        "tekst": "<p>Afera reprywatyzacyjna to coś więcej niż lokalny, warszawski skandal. To w soczewce ukazana słabość polskiego państwa w okresie transformacji ustrojowej. Pokazuje, w jaki sposób prymat świętego prawa własności – podniesiony do absolutnego dogmatu i interpretowany w izolacji od praw człowieka oraz społecznej użyteczności – doprowadził do powstania patologicznego kapitalizmu drapieżników.</p><p>Zjawisko to uwidoczniło również fundamentalny brak koordynacji między kluczowymi instytucjami państwa: prokuraturą, sądami rejestrowymi, administracją samorządową, ministerstwami nadzorującymi finanse i mieszkalnictwo. Każdy z tych podmiotów wycinkowo realizował procedury, nie chcąc dostrzec szerszego kontekstu zorganizowanej grupy wykorzystującej systemowe luki.</p><p>Na błędach dzikiej reprywatyzacji wyrosły najprężniejsze miejskie ruchy lokatorskie i obywatelskie w Polsce. Determinacja aktywistów miejskich udowodniła, że upór i zorganizowany nacisk społeczny są w stanie przełamać mur milczenia nawet wtedy, gdy w przestępczy proceder uwikłani są znani prawnicy, potężni deweloperzy i ważni politycy z różnych stron sceny politycznej. Afera ta na zawsze zmieniła polską politykę miejską, wprowadzając pojęcie bezpieczeństwa lokatorskiego i transparentności zarządzania majątkiem publicznym do debaty ogólnopolskiej.</p><p>Obecnie, po wejściu w życie nowych przepisów kpa blokujących podważanie kilkudziesięcioletnich decyzji administracyjnych, epoka masowej, zorganizowanej dzikiej reprywatyzacji wydaje się zakończona. Jednak otwarte pozostaje pytanie o rekompensaty dla ofiar i zadośćuczynienie sprawiedliwości. To test, którego polskie państwo – mimo spektakularnych prac komisji śledczych – wciąż w pełni nie zdało.</p>"
                    },
                    {
                        "id": "w10",
                        "typ": "sources-list",
                        "count": 142,
                        "tekst": "Przejrzeliśmy i opublikowaliśmy dziesiątki aktów, wyroków, zeznań. Dostęp do pełnej biblioteki PDF znajduje się w stopce artykułu."
                    }
                ]
            }
        )
    ]
    
    db.add_all(raporty)
    db.commit()
    return {"status": "sukces", "wiadomosc": "Archiwum Poza Kadrem zostało zasilone danymi."}
