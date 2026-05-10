import asyncio
import aiohttp
import feedparser
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.main import SessionLocal, Headline, Vote, MP

# Twoje świetne źródła newsów
SOURCES = [
  {"name": "onet", "rss": "https://wiadomosci.onet.pl/rss"},
  {"name": "wp", "rss": "https://wiadomosci.wp.pl/rss.xml"},
  {"name": "tvn24", "rss": "https://tvn24.pl/najnowsze.xml"},
  {"name": "rp", "rss": "https://www.rp.pl/rss/1019"},
  {"name": "pap", "rss": "https://www.pap.pl/rss.xml"}
]

async def sync_news():
    db: Session = SessionLocal()
    print(f"[{datetime.now()}] Starting News Sync...")
    
    async with aiohttp.ClientSession() as session:
        for source in SOURCES:
            try:
                async with session.get(source["rss"], timeout=10) as resp:
                    if resp.status != 200: continue
                    xml = await resp.text()
                    feed = feedparser.parse(xml)
                    
                    new_count = 0
                    for entry in feed.entries:
                        # Sprawdzamy czy już mamy ten URL
                        exists = db.query(Headline).filter(Headline.url == entry.link).first()
                        if not exists:
                            h = Headline(
                                title=entry.title,
                                portal=source["name"],
                                url=entry.link,
                                published_at=datetime.now().date() # Uproszczone dla SQLite
                            )
                            db.add(h)
                            new_count += 1
                    db.commit()
                    print(f"  - {source['name']}: added {new_count} new articles.")
            except Exception as e:
                print(f"  - Error in {source['name']}: {e}")
    db.close()

if __name__ == "__main__":
    asyncio.run(sync_news())
