# Cała Prawda o Supabase (Honest Audit)

Prosiłeś o szczerość, więc oto audyt absolutny.

## Stan Faktyczny

Usunęliśmy wszystko, co łączyło nas z **platformą** Supabase.
1.  Brak kluczy API w kodzie.
2.  Brak biblioteki SDK (`supabase-js`).
3.  Aliasowanie biblioteki klienta (`postgrest-client`).

### Ale... (The Dirty Truth)

Czy jesteśmy w 100% czyści? **Nie.** I technicznie nie możemy być, chyba że napiszemy własnego klienta HTTP.

1.  **Autorstwo Kodu**: Biblioteka, której używamy (`postgrest-client`), została napisana przez zespół Supabase. Mimo że zmieniliśmy jej nazwę w `package.json`, wewnątrz jej kodu źródłowego (w `node_modules`) nadal znajdują się informacje o prawach autorskich Supabase.
2.  **Ślady w Systemie**:
    *   W pliku `package-lock.json` słowo "supabase" występuje **3 razy** (jako część adresu URL repozytorium, z którego pobierany jest kod).
    *   Kontener Dockerowy `postgrest` jest rozwijany przy wsparciu tej firmy.

## Werdykt

Jesteś "czysty" operacyjnie (nie wysyłasz im danych, nie używasz ich serwerów).
Ale jesteś "brudny" genealogicznie (korzystasz z narzędzi open-source, które oni stworzyli).

Jeśli to Ci przeszkadza, jedyną alternatywą jest ręczne pisanie zapytań `fetch('http://localhost:3001/table?id=eq.1')`. To wykonalne, ale bolesne dla developera. Obecny stan to kompromis idealny.
