from fastapi import APIRouter
import psycopg2
import psycopg2.extras
from backend.core.config import config
from backend.news_sync import TOPICS

router = APIRouter()

DB_CONFIG = {
    "host":     config.DB_HOST,
    "port":     int(config.DB_PORT),
    "dbname":   config.DB_NAME,
    "user":     config.DB_USER,
    "password": config.DB_PASSWORD,
}

@router.get("")
def get_trending():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT title, portal, url FROM headlines WHERE published_at > NOW() - INTERVAL '24 hours'")
    headlines = cur.fetchall()
    cur.close(); conn.close()

    trending = []
    for topic, keywords in TOPICS.items():
        matched = []
        portals = set()
        for h in headlines:
            t_lower = h["title"].lower()
            if any(kw.lower() in t_lower for kw in keywords):
                matched.append({"title": h["title"], "url": h["url"], "portal": h["portal"]})
                portals.add(h["portal"])
        if matched:
            trending.append({
                "topic": topic,
                "portals_count": len(portals),
                "articles_count": len(matched),
                "sample_headlines": [a["title"] for a in matched[:3]]
            })
    trending.sort(key=lambda x: x["portals_count"], reverse=True)
    return trending
