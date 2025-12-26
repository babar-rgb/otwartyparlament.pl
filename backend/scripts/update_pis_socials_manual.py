
import sys
import os
import re

# Ensure we can import core modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.db import db

RAW_DATA = """
## 🐦 TWITTER/X

1. Andrzej Adamczyk - [@A_Adamczyk](https://x.com/A_Adamczyk)
2. Andrzej Gawron - [@andrzejgawron](https://x.com/andrzejgawron)
3. Andrzej Kryj - [@andrzej_kryj](https://x.com/andrzej_kryj)
4. Anna Baluch - [@AnnaBaluch](https://x.com/AnnaBaluch)
5. Anna Gembicka - [@AnnaDanuta](https://x.com/AnnaDanuta)
6. Anna Schmidt - [@AnnaSchmidt1](https://x.com/AnnaSchmidt1)
7. Bożena Borys-Szopa - [@BBorys_Szopa](https://x.com/BBorys_Szopa)
8. Czesław Hoc - [@CzeslawHoc1](https://x.com/CzeslawHoc1)
9. Daniel Milewski - [@Daniel_Milewski](https://x.com/Daniel_Milewski)
10. Dariusz Matecki - [@dmatecki](https://x.com/dmatecki)
11. Dariusz Piontkowski - [@D_Piontkowski](https://x.com/D_Piontkowski)
12. Dorota Arciszewska-Mielewczyk - [@D_ArciszewskaMi](https://x.com/D_ArciszewskaMi)
13. Ewa Leniart - [@EwaLeniart](https://x.com/EwaLeniart)
14. Grzegorz Puda - [@GrzegorzPuda](https://x.com/GrzegorzPuda)
15. Grzegorz Woźniak - [@GWozniak1969](https://x.com/GWozniak1969)
16. Jacek Świat - [@jacek_swiat](https://x.com/jacek_swiat)
17. Jacek Niedźwiedzki - [@jacniedzwiedzki](https://x.com/jacniedzwiedzki)
18. Jadwiga Emilewicz - [@JEmiliewicz](https://x.com/JEmiliewicz)
19. Jan Mosiński - [@JanMosinski](https://x.com/JanMosinski)
20. Jan Warzecha - [@JanWarzeNarut](https://x.com/JanWarzeNarut)
21. Jarosław Krajewski - [@jaroslaw_posel](https://x.com/jaroslaw_posel)
22. Jarosław Zieliński - [@JaroslawZielinski](https://x.com/JaroslawZielinski)
23. Jarosław Wieczorek - [@JaroslawWiecz](https://x.com/JaroslawWiecz)
24. Jerzy Polaczek - [@JPolaczekPosel](https://x.com/JPolaczekPosel)
25. Joanna Lichocka - [@Joanna_Lichocka](https://x.com/Joanna_Lichocka)
26. Kamil Bortniczuk - [@kbortniczuk](https://x.com/kbortniczuk)
27. Katarzyna Sójka - [@KSojka_posel](https://x.com/KSojka_posel)
28. Krzysztof Lipiec - [@KLipiec](https://x.com/KLipiec)
29. Krzysztof Sobolewski - [@ksobolewski](https://x.com/ksobolewski)
30. Krzysztof Szczucki - [@KSzczucki](https://x.com/KSzczucki)
31. Krzysztof Tchórzewski - [@K_Tchorzewski](https://x.com/K_Tchorzewski)
32. Lidia Burzyńska - [@LBurzynska](https://x.com/LBurzynska)
33. Łukasz Kmita - [@LukaszKmita](https://x.com/LukaszKmita)
34. Magdalena Filipek-Sobczak - [@MFilipek](https://x.com/MFilipek)
35. Małgorzata Golińska - [@golinsk](https://x.com/golinsk)
36. Małgorzata Wassermann - [@MWassermann](https://x.com/MWassermann)
37. Marek Ast - [@MarekAst](https://x.com/MarekAst)
38. Marek Gróbarczyk - [@GrobarczykM](https://x.com/GrobarczykM)
39. Marek Kuchciński - [@MarekKuchinsk1](https://x.com/MarekKuchinsk1)
40. Marek Subocz - [@msubocz](https://x.com/msubocz)
41. Marek Suski - [@MarekSuski_](https://x.com/MarekSuski_)
42. Marek Wesoły - [@MarkWeoly](https://x.com/MarkWeoly)
43. Marcin Porzucek - [@MarciniP](https://x.com/MarciniP)
44. Marcin Romanowski - [@m_romanowski](https://x.com/m_romanowski)
45. Marcin Warchoł - [@MarcinWarchol](https://x.com/MarcinWarchol)
46. Mariusz Kałużny - [@MariuszKaluzny](https://x.com/MariuszKaluzny)
47. Marlena Maląg - [@MarlenaMailag](https://x.com/MarlenaMailag)
48. Marzena Machałek - [@MachAlekMarzena](https://x.com/MachAlekMarzena)
49. Michał Jach - [@MichalJach](https://x.com/MichalJach)
50. Michał Kowalski - [@mikowalski](https://x.com/mikowalski)
51. Michał Woś - [@MichalWos_](https://x.com/MichalWos_)
52. Michał Wójcik - [@MarekWojcik](https://x.com/MarekWojcik)
53. Mirosława Stachowiak-Różecka - [@MiroslawaStach](https://x.com/MiroslawaStach)
54. Monika Falej - [@FalejMonika](https://x.com/FalejMonika)
55. Monika Pawłowska - [@MonikaP_posel](https://x.com/MonikaP_posel)
56. Patryk Wicher - [@wicher_patryk](https://x.com/wicher_patryk)
57. Paweł Hreniak - [@Pawel_Hreniak](https://x.com/Pawel_Hreniak)
58. Paweł Sałek - [@PawelSalek_](https://x.com/PawelSalek_)
59. Paweł Szrot - [@PawelSzrot](https://x.com/PawelSzrot)
60. Paweł Rychlik - [@PawelRychlik](https://x.com/PawelRychlik)
61. Piotr Babinetz - [@PiotrBabinetz](https://x.com/PiotrBabinetz)
62. Piotr Kaleta - [@PiotrKaleta](https://x.com/PiotrKaleta)
63. Piotr Müller - [@PiotrMullerRPL](https://x.com/PiotrMullerRPL)
64. Piotr Uściński - [@PiotrUscinski](https://x.com/PiotrUscinski)
65. Piotr Uruski - [@PiotrUruski](https://x.com/PiotrUruski)
66. Rafał Weber - [@RafalWeber1](https://x.com/RafalWeber1)
67. Robert Telus - [@RobertTelus](https://x.com/RobertTelus)
68. Robert Warwas - [@WarwasRobert](https://x.com/WarwasRobert)
69. Ryszard Terlecki - [@rterlecki](https://x.com/rterlecki)
70. Sebastian Łukaszewicz - [@SLukaszewicz](https://x.com/SLukaszewicz)
71. Stanisław Szwed - [@S_Szwed](https://x.com/S_Szwed)
72. Sylwester Tułajew - [@STulaiew](https://x.com/STulaiew)
73. Szymon Szynkowski vel Sęk - [@szynkowski](https://x.com/szynkowski)
74. Tadeusz Chrzan - [@TChrzan](https://x.com/TChrzan)
75. Tadeusz Woźniak - [@TadeuszWozniak1](https://x.com/TadeuszWozniak1)
76. Teresa Pamuła - [@TeresaPamula_](https://x.com/TeresaPamula_)
77. Teresa Wilk - [@TeresaWilk_](https://x.com/TeresaWilk_)
78. Tomasz Zieliński - [@Tomasz_Zielinski](https://x.com/Tomasz_Zielinski)
79. Urszula Rusecka - [@RuseckaUrszula](https://x.com/RuseckaUrszula)
80. Waldemar Andzel - [@WAndzelnew](https://x.com/WAndzelnew)
81. Waldemar Buda - [@waldemar_buda](https://x.com/waldemar_buda)
82. Wiesław Krajewski - [@WKrajewskiRP](https://x.com/WKrajewskiRP)
83. Wioletta Kulpa - [@WiolettaKulpa](https://x.com/WiolettaKulpa)
84. Witold Czarnecki - [@witold_czarnecki](https://x.com/witold_czarnecki)
85. Włodzimierz Tomaszewski - [@WTomaszewski](https://x.com/WTomaszewski)
86. Wojciech Zubowski - [@WZubowski](https://x.com/WZubowski)
87. Zbigniew Bogucki - [@ZBogucki](https://x.com/ZBogucki)
88. Zbigniew Dolata - [@ZDolata](https://x.com/ZDolata)
89. Zbigniew Kuźmiuk - [@ZKuzmiuk](https://x.com/ZKuzmiuk)
90. Zbigniew Rau - [@RauZbigniew](https://x.com/RauZbigniew)
91. Zbigniew Ziobro - [@ZiobroZbigniew](https://x.com/ZiobroZbigniew)
92. Ireneusz Zyska - [@Zyska_Ireneusz](https://x.com/Zyska_Ireneusz)
93. Iwona Arent - [@IwonaArent](https://x.com/IwonaArent)
94. Maria Koc - [@MariaKoc1](https://x.com/MariaKoc1)
1. Jarosław Kaczyński - [@JaKaczynski](https://x.com/JaKaczynski)
2. Mateusz Morawiecki - [@MorawieckiM](https://x.com/MorawieckiM)
3. Beata Szydło - [@beataszydlo](https://x.com/beataszydlo)
4. Zbigniew Ziobro - [@ZiobroZbigniew](https://x.com/ZiobroZbigniew)
5. Mariusz Błaszczak - [@mblaszczak](https://x.com/mblaszczak)
6. Dominik Tarczyński - [@domtar](https://x.com/domtar)
Elżbieta Witek - [@ElzbietaWitek](https://x.com/ElzbietaWitek)
Paweł Szefernaker - [@pszefernaker](https://x.com/pszefernaker)

## 📱 FACEBOOK

1. Agata Wojtyszek - [Profil](https://www.facebook.com/agata.wojtyszek)
2. Agnieszka Wojciechowska van Heukelom - [Profil](https://www.facebook.com/agnieszka.wojciechowskavanheukelom)
3. Andrzej Adamczyk - [Profil](https://www.facebook.com/PoselAndrzejAdamczyk)
4. Andrzej Gawron - [Profil](https://www.facebook.com/gawronandrzej)
5. Andrzej Kryj - [Profil](https://www.facebook.com/andrzej.kryj)
6. Anna Baluch - [Profil](https://www.facebook.com/posel.AnnaBaluch)
7. Anna Gembicka - [Profil](https://www.facebook.com/AnnaGembickaPL)
8. Anna Schmidt - [Profil](https://www.facebook.com/AnnaSchmidtPosel)
9. Bartłomiej Wróblewski - [Profil](https://www.facebook.com/wroblewski.bartlomiej)
10. Bożena Borys-Szopa - [Profil](https://www.facebook.com/borysszopabozena)
11. Czesław Hoc - [Profil](https://www.facebook.com/czeslawhocprywatne)
12. Daniel Milewski - [Profil](https://www.facebook.com/milewskidaniel)
13. Dariusz Matecki - [Profil](https://www.facebook.com/DariuszMateckiFanPage)
14. Dariusz Piontkowski - [Profil](https://www.facebook.com/DariuszPiontkowski)
15. Dorota Arciszewska-Mielewczyk - [Profil](https://www.facebook.com/arciszewskamielewczyk)
16. Ewa Leniart - [Profil](https://www.facebook.com/LeniartEwa)
17. Grzegorz Puda - [Profil](https://www.facebook.com/ministerpuda)
18. Grzegorz Woźniak - [Profil](https://www.facebook.com/grzegorz.adam.wozniak)
19. Jacek Niedźwiedzki - [Profil](https://www.facebook.com/p/Jacek-Niedźwiedzki-Poseł-Rzeczpospolitej-Polskiej-X-Kadencji-100075752061950)
20. Jacek Świat - [Profil](https://www.facebook.com/JacekSwiat)
21. Jadwiga Emilewicz - [Profil](https://www.facebook.com/JEmilewicz)
22. Jan Mosiński - [Profil](https://www.facebook.com/p/Jan-Mosiński-100010205261151)
23. Jan Warzecha - [Profil](https://www.facebook.com/poseljanwarzecha)
24. Jarosław Krajewski - [Profil](https://www.facebook.com/wybierzKrajewskiego)
25. Jarosław Zieliński - [Profil](https://www.facebook.com/ZielinskiJaro)
26. Jarosław Wieczorek - [Profil](https://www.facebook.com/WieczorekRP)
27. Jerzy Polaczek - [Profil](https://www.facebook.com/JerzyPolaczek)
28. Joanna Lichocka - [Profil](https://www.facebook.com/joanna.lichocka.5)
29. Kamil Bortniczuk - [Profil](https://www.facebook.com/poselBortniczuk)
30. Katarzyna Sójka - [Profil](https://www.facebook.com/PoselKatarzynaSojka)
31. Krzysztof Lipiec - [Profil](https://www.facebook.com/posel.krzysztof.lipiec)
32. Krzysztof Sobolewski - [Profil](https://www.facebook.com/KrzysztofSobolewskiPiS)
33. Krzysztof Szczucki - [Profil](https://www.facebook.com/KrzSzczucki)
34. Krzysztof Tchórzewski - [Profil](https://www.facebook.com/KrzysztofTchorzewskiSiedlce)
35. Lidia Burzyńska - [Profil](https://www.facebook.com/LidiaBurzynskaSejmRP)
36. Łukasz Kmita - [Profil](https://www.facebook.com/KmitaLukasz)
37. Magdalena Filipek-Sobczak - [Profil](https://www.facebook.com/magdalenafilipeksobczak)
38. Małgorzata Golińska - [Profil](https://www.facebook.com/golinskagosia)
39. Małgorzata Wassermann - [Profil](https://www.facebook.com/malgorzata.wassermann)
40. Marek Ast - [Profil](https://www.facebook.com/p/Marek-Ast-Pose%C5%82-na-Sejm-RP-100058168444336)
41. Marek Gróbarczyk - [Profil](https://www.facebook.com/marek.grobarczyk)
42. Marek Kuchciński - [Profil](https://www.facebook.com/KuchcinskiMarek)
43. Marek Subocz - [Profil](https://www.facebook.com/subocz.marek)
44. Marek Suski - [Profil](https://www.facebook.com/mwsuski)
45. Marek Wesoły - [Profil](https://www.facebook.com/MarekWesolyRudaSlaska)
46. Marcin Porzucek - [Profil](https://www.facebook.com/posel.marcin.porzucek)
47. Marcin Romanowski - [Profil](https://www.facebook.com/drmarcinromanowski)
48. Marcin Warchoł - [Profil](https://www.facebook.com/WarcholRzeszow)
49. Mariusz Kałużny - [Profil](https://www.facebook.com/kaluznymariusz)
50. Marlena Maląg - [Profil](https://www.facebook.com/MalagMarlena)
51. Marzena Machałek - [Profil](https://www.facebook.com/MarzenaMachalekPL)
52. Michał Jach - [Profil](https://www.facebook.com/p/Michał-Jach-61551823392260)
53. Michał Kowalski - [Profil](https://www.facebook.com/michalkowalski.info)
54. Michał Woś - [Profil](https://www.facebook.com/mwosPL)
55. Michał Wójcik - [Profil](https://www.facebook.com/MichalMarekWojcik)
56. Mirosława Stachowiak-Różecka - [Profil](https://www.facebook.com/rozecka)
57. Monika Falej - [Profil](https://www.facebook.com/FalejMonika)
58. Monika Pawłowska - [Profil](https://www.facebook.com/pawlowskapl)
59. Patryk Wicher - [Profil](https://www.facebook.com/wicher.patryk)
60. Paweł Hreniak - [Profil](https://www.facebook.com/pawel.hreniak)
61. Paweł Sałek - [Profil](https://www.facebook.com/pawelsalekpl)
62. Paweł Szrot - [Profil](https://www.facebook.com/pawelszrot)
63. Paweł Rychlik - [Profil](https://www.facebook.com/rychlik2018)
64. Piotr Babinetz - [Profil](https://www.facebook.com/BabinetzPiotr)
65. Piotr Kaleta - [Profil](https://www.facebook.com/piotr.kaleta.pis)
66. Piotr Müller - [Profil](https://www.facebook.com/piotr.muller)
67. Piotr Uściński - [Profil](https://www.facebook.com/PoselUscinski)
68. Piotr Uruski - [Profil](https://www.facebook.com/UruskiPiotr)
69. Rafał Weber - [Profil](https://www.facebook.com/WeberRafal)
70. Robert Telus - [Profil](https://www.facebook.com/roberttelus)
71. Robert Warwas - [Profil](https://www.facebook.com/WarwasRobert)
72. Ryszard Terlecki - [Profil](https://www.facebook.com/ryszardterlecki)
73. Sebastian Łukaszewicz - [Profil](https://www.facebook.com/SLukaszewicz)
74. Stanisław Szwed - [Profil](https://www.facebook.com/stanislaw.szwed)
75. Sylwester Tułajew - [Profil](https://www.facebook.com/tulajew)
76. Szymon Szynkowski vel Sęk - [Profil](https://www.facebook.com/szynkowskivelsek)
77. Tadeusz Chrzan - [Profil](https://www.facebook.com/TadeuszChrzanPolityk)
78. Tadeusz Woźniak - [Profil](https://www.facebook.com/tadeuszwozniakposel)
79. Teresa Pamuła - [Profil](https://www.facebook.com/teresapamula)
80. Teresa Wilk - [Profil](https://www.facebook.com/p/Teresa-Wilk-Poseł-na-Sejm-RP-61551044125746)
81. Tomasz Zieliński - [Profil](https://www.facebook.com/TomaszZielinskiPolityk)
82. Urszula Rusecka - [Profil](https://www.facebook.com/ruseckaurszula)
83. Waldemar Andzel - [Profil](https://www.facebook.com/poselandzel)
84. Wiesław Krajewski - [Profil](https://www.facebook.com/krajewskiwieslaw)
85. Wioletta Kulpa - [Profil](https://www.facebook.com/kulpawioletta)
86. Witold Czarnecki - [Profil](https://www.facebook.com/CzarneckiPiS)
87. Włodzimierz Tomaszewski - [Profil](https://www.facebook.com/TomaszewskiWlodzimierz)
88. Wojciech Zubowski - [Profil](https://www.facebook.com/WojciechZubowskiPL)
89. Zbigniew Bogucki - [Profil](https://www.facebook.com/ZbigniewBoguckiPL)
90. Zbigniew Dolata - [Profil](https://www.facebook.com/PoselZbigniewDolata)
91. Zbigniew Kuźmiuk - [Profil](https://www.facebook.com/zbigniew.kuzmiuk)
92. Zbigniew Rau - [Profil](https://www.facebook.com/RauZbigniew)
93. Zbigniew Ziobro - [Profil](https://www.facebook.com/ZiobroPL)
94. Ireneusz Zyska - [Profil](https://www.facebook.com/Zyska.Ireneusz)
95. Maria Koc - [Profil](https://www.facebook.com/mariazofiakoc)
1. Jarosław Kaczyński - [Profil](https://www.facebook.com/kaczynskijarowslaw)
2. Mateusz Morawiecki - [Profil](https://www.facebook.com/MorawieckiPL)
3. Beata Szydło - [Profil](https://www.facebook.com/BeataSzydlo)
4. Zbigniew Ziobro - [Profil](https://www.facebook.com/ZiobroPL)
5. Mariusz Błaszczak - [Profil](https://www.facebook.com/PoselMariuszBlaszczak)
6. Dominik Tarczyński - [Profil](https://www.facebook.com/tarczynski.dominik)
Elżbieta Witek - [Profil](https://www.facebook.com/EWitek.Sejm)
Paweł Szefernaker - [Profil](https://www.facebook.com/szefernaker)
"""

def parse_twitter_line(line):
    # Regex for "Name - [Handle](URL)" or similar variations
    # Handles "1. Name Name - ...", "Name Name - ..."
    match = re.search(r'(?:^\d+\.\s*)?([^\-]+?)\s+-\s+\[.*\]\((https?://x\.com/[^\)]+)\)', line)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None, None

def parse_facebook_line(line):
    # Matches "1. Name Name - [Profil](URL)" or similar variations
    match = re.search(r'(?:^\d+\.\s*)?([^\-]+?)\s+-\s+\[.*\]\((https?://(www\.)?facebook\.com/[^\)]+)\)', line)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None, None

def parse_data(raw):
    mps = {} # { "Name": { "facebook": None, "twitter": None } }
    
    lines = raw.strip().split('\n')
    mode = None # 'twitter' or 'facebook'
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if "TWITTER/X" in line:
            mode = 'twitter'
            continue
        elif "FACEBOOK" in line:
            mode = 'facebook'
            continue
            
        if mode == 'twitter':
            name, url = parse_twitter_line(line)
            if name and url:
                if name not in mps:
                    mps[name] = {"facebook": None, "twitter": None}
                mps[name]['twitter'] = url
                
        elif mode == 'facebook':
            name, url = parse_facebook_line(line)
            if name and url:
                if name not in mps:
                    mps[name] = {"facebook": None, "twitter": None}
                mps[name]['facebook'] = url
                
    return mps

def update_mps():
    mps_data = parse_data(RAW_DATA)
    print(f"Parsed {len(mps_data)} MPs.")
    
    with db.get_cursor(commit=True) as cur:
        updated_count = 0
        for name, links in mps_data.items():
            updates = []
            if links['facebook']:
                updates.append(f'"facebook": "{links["facebook"]}"')
            if links['twitter']:
                updates.append(f'"twitter": "{links["twitter"]}"')
                
            if not updates:
                continue
                
            json_fragment = '{' + ', '.join(updates) + '}'
            
            # Print for logging
            # print(f"Updating {name} with {json_fragment}...")
            
            # Use jsonb concatenation
            cur.execute(
                "UPDATE mps SET contact_info = contact_info || %s::jsonb WHERE name = %s",
                (json_fragment, name)
            )
            updated_count += 1
            
        print(f"Updated {updated_count} MPs successfully.")

if __name__ == "__main__":
    update_mps()
