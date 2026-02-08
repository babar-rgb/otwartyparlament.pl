import os
import sys
import logging
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteAnalysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notify_google")

SCOPES = ["https://www.googleapis.com/auth/indexing"]
ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"

def get_service():
    # Expecting key.json in backend/certs/ or env var
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "backend/certs/service_account.json")
    if not os.path.exists(key_path):
        logger.warning(f"⚠️ No service account key found at {key_path}. Skipping Google Indexing.")
        return None
        
    creds = service_account.Credentials.from_service_account_file(key_path, scopes=SCOPES)
    return build("indexing", "v3", credentials=creds)

def notify_google():
    service = get_service()
    if not service:
        return

    session = SessionLocal()
    try:
        # Fetch detailed votes that are worthy of indexing (e.g. have analysis)
        votes = session.query(Vote).join(VoteAnalysis).limit(50).all()
        
        for vote in votes:
            url = f"https://otwartyparlament.pl/glosowania/{vote.term}/{vote.sitting}/{vote.voting_number}"
            
            body = {
                "url": url,
                "type": "URL_UPDATED"
            }
            
            try:
                service.urlNotifications().publish(body=body).execute()
                logger.info(f"✅ Notified Google: {url}")
            except Exception as e:
                logger.error(f"❌ Failed to notify {url}: {e}")
                
    except Exception as e:
        logger.error(f"Global error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    notify_google()
