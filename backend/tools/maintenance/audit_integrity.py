import logging
logging.basicConfig(level=logging.INFO)
import sys
import os
import json
import requests
import random
from collections import Counter

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.core.db import db
    from backend.core.logger import get_logger
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from core.db import db
    from core.logger import get_logger

logger = get_logger("audit.integrity")

def check_internal_consistency():
    logger.info("--- 1. INTERNAL CONSISTENCY CHECK ---")
    
    with db.get_cursor() as cur:
        # Get all votes with their stored totals
        # Assuming details_json has keys 'yes', 'no', 'abstain'
        # Or we might have specific columns? The run_nightly script used details_json.
        cur.execute("SELECT id, details_json, term, sitting, voting_number FROM votes WHERE term = 10")
        votes = cur.fetchall()
        
        discrepancies = []
        
        logger.info(f"Checking {len(votes)} votes for mathematical accuracy...")
        
        for v in votes:
            if not v['details_json']:
                continue
                
            details = v['details_json'] 
            # Handle string/dict
            if isinstance(details, str):
                details = json.loads(details)
                
            expected_yes = int(details.get('yes', 0))
            expected_no = int(details.get('no', 0))
            expected_abstain = int(details.get('abstain', 0))
            
            # Count actual rows
            cur.execute("""
                SELECT 
                    COUNT(*) FILTER (WHERE result = 'YES') as yes,
                    COUNT(*) FILTER (WHERE result = 'NO') as no,
                    COUNT(*) FILTER (WHERE result = 'ABSTAIN') as abstain
                FROM vote_results 
                WHERE vote_id = %s
            """, (v['id'],))
            
            actual = cur.fetchone()
            
            if (actual['yes'] != expected_yes or 
                actual['no'] != expected_no or 
                actual['abstain'] != expected_abstain):
                
                # Allow small margin? No. Exact match.
                # Actually, sometimes API 'notParticipating' vs 'absent' mapping differs?
                # But YES/NO/ABSTAIN should match exactly.
                
                discrepancies.append({
                    "id": v['id'],
                    "loc": f"{v['term']}/{v['sitting']}/{v['voting_number']}",
                    "expected": f"Y:{expected_yes} N:{expected_no} A:{expected_abstain}",
                    "actual": f"Y:{actual['yes']} N:{actual['no']} A:{actual['abstain']}"
                })
        
        if discrepancies:
            logger.error(f"❌ Found {len(discrepancies)} internal discrepancies!")
            for d in discrepancies[:5]:
                logger.error(f"   Vote {d['loc']}: Expected {d['expected']} vs Actual [{d['actual']}]")
        else:
            logger.info("✅ All votes matches their summary totals exactly.")

def check_structure():
    logger.info("\n--- 2. STRUCTURAL INTEGRITY CHECK ---")
    with db.get_cursor() as cur:
        # Check duplicates
        cur.execute("""
            SELECT vote_id, mp_id, COUNT(*) 
            FROM vote_results 
            GROUP BY vote_id, mp_id 
            HAVING COUNT(*) > 1
        """)
        dupes = cur.fetchall()
        if dupes:
            logger.error(f"❌ Found {len(dupes)} duplicate votes (same MP voting twice in one vote)!")
        else:
            logger.info("✅ No duplicate individual votes found.")
            
        # Check orphans
        cur.execute("""
            SELECT count(*) as cnt 
            FROM vote_results r
            LEFT JOIN mps m ON r.mp_id = m.id
            WHERE m.id IS NULL
        """)
        orphans = cur.fetchone()['cnt']
        if orphans > 0:
            logger.error(f"❌ Found {orphans} vote results linked to non-existent MPs!")
        else:
            logger.info("✅ All votes linked to valid MPs.")

def check_external_truth():
    logger.info("\n--- 3. EXTERNAL TRUTH VERIFICATION (Spot Check) ---")
    
    # Pick random votes to check
    with db.get_cursor() as cur:
        cur.execute("SELECT id, term, sitting, voting_number FROM votes WHERE term=10 ORDER BY RANDOM() LIMIT 5")
        sample_votes = cur.fetchall()
        
    for v in sample_votes:
        logger.info(f"🕵️  Verifying Ref Vote {v['term']}/{v['sitting']}/{v['voting_number']}...")
        
        # Fetch DB results
        db_results = {}
        with db.get_cursor() as cur:
            cur.execute("SELECT mp_id, result FROM vote_results WHERE vote_id = %s", (v['id'],))
            rows = cur.fetchall()
            for r in rows:
                db_results[r['mp_id']] = r['result']
        
        if not db_results:
            logger.warning("   ⚠️  No local results to check.")
            continue
            
        # Fetch API results
        url = f"https://api.sejm.gov.pl/sejm/term{v['term']}/votings/{v['sitting']}/{v['voting_number']}"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code != 200:
                logger.error(f"   API Error {resp.status_code}")
                continue
                
            api_data = resp.json()
            api_votes = api_data.get('votes', [])
            
            errors = 0
            checked = 0
            
            for api_v in api_votes:
                mp_id = api_v.get('MP')
                if not mp_id: continue
                
                # Map API to DB format
                val = api_v.get('vote')
                expected = 'ABSENT'
                if val == 1 or val == 'YES': expected = 'YES'
                elif val == 2 or val == 'NO': expected = 'NO'
                elif val == 3 or val == 'ABSTAIN': expected = 'ABSTAIN'
                elif val == 4 or val == 'ABSENT': expected = 'ABSENT'
                
                actual = db_results.get(mp_id, 'MISSING')
                
                if actual != expected:
                    # Ignore partial mismatch if we don't have absent, but strictly YES/NO match?
                    # No, we want exactness.
                    logger.error(f"   Mismatch MP {mp_id}: API says {expected}, DB says {actual}")
                    errors += 1
                
                checked += 1
            
            if errors == 0:
                logger.info(f"   ✅ Verified {checked} MPs. 100% Match.")
            else:
                logger.error(f"   ❌ FAILED. {errors} mismatches found.")
                
        except Exception as e:
            logger.error(f"   Error checking API: {e}")

if __name__ == "__main__":
    check_internal_consistency()
    check_structure()
    check_external_truth()
