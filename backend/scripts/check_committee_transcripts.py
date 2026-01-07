
import sys
import os
import logging
import time
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.utils.http import http_session

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("check.committees")

def check_committee_transcripts():
    # Check a few random committee sittings
    # API: /committees/{code}/sittings/{number}
    
    test_cases = [
        ("KFP", 1), # Finansów Publicznych
        ("ZDR", 1), # Zdrowia
        ("OBN", 1), # Obrony Narodowej
    ]
    
    logger.info("🕵️ Checking Committee Transcripts Availability...")
    
    total_found = 0
    for code, num in test_cases:
        url = f"https://api.sejm.gov.pl/sejm/term10/committees/{code}/sittings/{num}"
        try:
            resp = http_session.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                # Check for 'agenda' -> 'links' or 'video'
                logger.info(f"\nSitting {code} #{num}:")
                logger.info(f"  Video: {data.get('video')}")
                
                # Sometimes transcripts are hidden in other endpoints or HTML scraping
                # Current API v2 documentation says "video" is primary.
                
                # Check agenda points for descriptions
                for point in data.get('agenda', []):
                     logger.info(f"  Point: {point.get('description')}")
                     if point.get('links'):
                         logger.info(f"  Links: {point.get('links')}")

            else:
                logger.warning(f"  Stats: {resp.status_code}")
                
        except Exception as e:
            logger.error(f"Error {code}: {e}")
            
    logger.info("\n🏁 Conclusion: Sejm API primarily exposes Video URLs. Text transcripts require OCR/ASR.")

if __name__ == "__main__":
    check_committee_transcripts()
