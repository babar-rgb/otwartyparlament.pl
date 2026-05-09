import sys, os; sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import asyncio
import aiohttp
import feedparser
import psycopg2
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# --- KONFIGURACJA DANYCH ---

SOURCES = [
  {"name": "onet", "rss": "https://wiadomosci.onet.pl/rss", "lean": "centrum"},
  {"name": "wp", "rss": "https://wiadomosci.wp.pl/rss.xml", "lean": "centrum"},
  {"name": "interia", "rss": "https://fakty.interia.pl/feed", "lean": "centrum"},
  {"name": "gazeta_pl", "rss": "https://rss.gazeta.pl/pub/rss/najnowsze_wyborcza.xml", "lean": "lewica"},
  {"name": "tvn24", "rss": "https://tvn24.pl/najnowsze.xml", "lean": "centrum-lewo"},
  {"name": "polsat_news", "rss": "https://www.polsatnews.pl/rss/wszystkie.xml", "lean": "centrum"},
  {"name": "rmf24", "rss": "https://www.rmf24.pl/fakty/feed", "lean": "centrum"},
  {"name": "fakt", "rss": "https://www.fakt.pl/rss.xml", "lean": "centrum"},
  {"name": "super_express", "rss": "https://www.se.pl/rss/news.xml", "lean": "centrum"},
  {"name": "o2", "rss": "https://www.o2.pl/rss.xml", "lean": "centrum"},
  {"name": "rp", "rss": "https://www.rp.pl/rss/1019", "lean": "centrum-prawo"},
  {"name": "newsweek", "rss": "https://www.newsweek.pl/rss.xml", "lean": "lewica"},
  {"name": "polityka", "rss": "https://www.polityka.pl/rss.xml", "lean": "lewica"},
  {"name": "wprost", "rss": "https://www.wprost.pl/rss.xml", "lean": "centrum"},
  {"name": "pap", "rss": "https://www.pap.pl/rss.xml", "lean": "agencja"},
  {"name": "radiozet", "rss": "https://radiozet.pl/rss", "lean": "centrum"},
  {"name": "tok_fm", "rss": "https://audycje.tokfm.pl/rss", "lean": "lewica"},
  {"name": "tvp_info", "rss": "https://www.tvp.info/rss", "lean": "centrum"},
  {"name": "wpolityce", "rss": "https://wpolityce.pl/rss.xml", "lean": "prawica"},
  {"name": "niezalezna", "rss": "https://niezalezna.pl/feed", "lean": "prawica"},
  {"name": "dorzeczy", "rss": "https://dorzeczy.pl/feed", "lean": "prawica"},
  {"name": "republika", "rss": "https://tvrepublika.pl/rss", "lean": "prawica"},
  {"name": "tysol", "rss": "https://tysol.pl/feed", "lean": "prawica"},
  {"name": "salon24", "rss": "https://www.salon24.pl/feed", "lean": "prawica"},
  {"name": "pch24", "rss": "https://pch24.pl/feed", "lean": "prawica"},
  {"name": "oko_press", "rss": "https://oko.press/feed", "lean": "lewica"},
  {"name": "krytykapolityczna", "rss": "https://krytykapolityczna.pl/feed", "lean": "lewica"},
  {"name": "strajk", "rss": "https://strajk.eu/feed", "lean": "lewica"},
  {"name": "money", "rss": "https://www.money.pl/rss/informacje.xml", "lean": "gospodarka"},
  {"name": "businessinsider", "rss": "https://businessinsider.com.pl/feed", "lean": "centrum"},
  {"name": "pb", "rss": "https://www.pb.pl/rss.xml", "lean": "gospodarka"},
  {"name": "bankier", "rss": "https://www.bankier.pl/rss/wiadomosci.xml", "lean": "gospodarka"},
  {"name": "forsal", "rss": "https://forsal.pl/rss.xml", "lean": "gospodarka"},
  {"name": "obserwatorfinansowy", "rss": "https://www.obserwatorfinansowy.pl/feed", "lean": "gospodarka"},
  {"name": "gazetaprawna", "rss": "https://www.gazetaprawna.pl/rss.xml", "lean": "centrum"},
  {"name": "press", "rss": "https://www.press.pl/rss.xml", "lean": "media"},
  {"name": "wirtualnemedia", "rss": "https://www.wirtualnemedia.pl/rss.xml", "lean": "media"},
  {"name": "bezprawnik", "rss": "https://bezprawnik.pl/feed", "lean": "prawo"},
  {"name": "prawo_pl", "rss": "https://www.prawo.pl/rss.xml", "lean": "prawo"},
  {"name": "kanał_zero", "rss": "https://kanalzero.pl/feed", "lean": "niezależny"},
  {"name": "nczas", "rss": "https://nczas.com/feed", "lean": "prawica"},
  {"name": "kresy", "rss": "https://kresy.pl/feed", "lean": "prawica"},
  {"name": "myslpolska", "rss": "https://mysl-polska.pl/feed", "lean": "prawica"},
  {"name": "konfederacja", "rss": "https://konfederacja.pl/feed", "lean": "prawica"},
  {"name": "lewica_pl", "rss": "https://lewica.pl/feed", "lean": "lewica"},
  {"name": "dzienniktrybuna", "rss": "https://dzienniktrybuna.pl/feed", "lean": "lewica"},
  {"name": "spidersweb", "rss": "https://spidersweb.pl/feed", "lean": "tech"},
  {"name": "benchmark", "rss": "https://www.benchmark.pl/rss.xml", "lean": "tech"},
  {"name": "euractiv_pl", "rss": "https://poland.euractiv.com/feed", "lean": "eu"},
  {"name": "dziennikmediow", "rss": "https://dziennikmedialny.pl/feed", "lean": "media"}
]

TOPICS = {
  "Węgry": ["Magyar", "Węgry", "Budapeszt", "Orban"],
  "Hantawirus": ["hantawirus", "hanta", "wirus"],
  "Ukraina": ["Ukraina", "Zełenski", "Kijów", "rozejm"],
  "USA": ["USA", "Trump", "Biden", "Waszyngton", "Pentagon"],
  "Rosja": ["Rosja", "Putin", "Moskwa", "Kreml"],
  "Gospodarka": ["inflacja", "ceny", "podatki", "pkb", "stopy procentowe"],
  "Sądownictwo": ["KRS", "sądy", "Bodnar", "Trybunał"],
  "Bezpieczeństwo": ["wojsko", "armia", "sztab", "obrona", "NATO"]
}

# --- LOGIKA SILNIKA ---

DB_CONFIG = {
    "host":     os.getenv("POSTGRES_HOST", "127.0.0.1"),
    "port":     int(os.getenv("POSTGRES_PORT", 5432)),
    "dbname":   os.getenv("POSTGRES_DB", "otwarty_parlament"),
    "user":     os.getenv("POSTGRES_USER", "kajtek"),
    "password": os.getenv("POSTGRES_PASSWORD", ""),
}

class NewsSync:
    async def fetch_one(self, session, source):
        try:
            async with session.get(source["rss"], timeout=15) as response:
                if response.status != 200: return None
                xml = await response.text()
                feed = feedparser.parse(xml)
                articles = []
                for entry in feed.entries:
                    pub = entry.get("published_parsed")
                    pub_at = datetime(*pub[:6], tzinfo=timezone.utc) if pub else datetime.now(timezone.utc)
                    articles.append({
                        "url": entry.get("link", "").strip(),
                        "title": entry.get("title", "").strip(),
                        "portal": source["name"],
                        "lean": source["lean"],
                        "published_at": pub_at
                    })
                return articles
        except: return None

    def save(self, articles):
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        count = 0
        for a in articles:
            try:
                cur.execute("INSERT INTO headlines (url, title, portal, lean, published_at) VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING", 
                            (a["url"], a["title"], a["portal"], a["lean"], a["published_at"]))
                if cur.rowcount > 0: count += 1
            except: conn.rollback(); continue
        conn.commit(); cur.close(); conn.close()
        return count

    async def run(self):
        async with aiohttp.ClientSession(headers={"User-Agent": "Mozilla/5.0"}) as session:
            tasks = [self.fetch_one(session, s) for s in SOURCES]
            results = await asyncio.gather(*tasks)
            flat = [a for sub in results if sub for a in sub]
            new = self.save(flat)
            print(f"[{datetime.now().isoformat()}] Sync: {len(flat)} found, {new} new.")

if __name__ == "__main__":
    asyncio.run(NewsSync().run())
