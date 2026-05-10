import asyncio
import aiohttp
import feedparser
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models.headline import Headline
from backend.core.database import SessionLocal

# Twoje sprawdzone źródła newsów
SOURCES = [
    {"name": "onet", "rss": "https://wiadomosci.onet.pl/rss"},
    {"name": "wp", "rss": "https://wiadomosci.wp.pl/rss.xml"},
    {"name": "tvn24", "rss": "https://tvn24.pl/najnowsze.xml"},
    {"name": "rp", "rss": "https://www.rp.pl/rss/1019"},
    {"name": "pap", "rss": "https://www.pap.pl/rss.xml"}
]

class NewsService:
    def __init__(self, db: Session):
        self.db = db

    async def sync_all_sources(self):
        print(f">>> Rozpoczynanie synchronizacji newsów: {datetime.now()}")
        
        async with aiohttp.ClientSession() as session:
            tasks = [self._sync_source(session, source) for source in SOURCES]
            await asyncio.gather(*tasks)
        
        print(">>> Synchronizacja newsów zakończona.")

    async def _sync_source(self, session, source):
        try:
            async with session.get(source["rss"], timeout=10) as resp:
                if resp.status != 200:
                    return
                
                xml = await resp.text()
                feed = feedparser.parse(xml)
                
                new_count = 0
                for entry in feed.entries:
                    # Sprawdzamy unikalność po URL
                    exists = self.db.query(Headline).filter(Headline.url == entry.link).first()
                    if not exists:
                        h = Headline(
                            title=entry.title,
                            portal=source["name"],
                            url=entry.link,
                            published_at=datetime.now().date()
                        )
                        self.db.add(h)
                        new_count += 1
                
                self.db.commit()
                if new_count > 0:
                    print(f"  - {source['name']}: dodano {new_count} nowych nagłówków.")
        except Exception as e:
            print(f"  - Błąd w źródle {source['name']}: {e}")

# Funkcja do szybkiego testu z terminala
if __name__ == "__main__":
    db = SessionLocal()
    service = NewsService(db)
    asyncio.run(service.sync_all_sources())
    db.close()
