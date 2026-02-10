
import sys
import os
import logging
from collections import defaultdict

# Add parent dir to path
sys.path.append(os.getcwd())

from backend.core.db import db

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger("audit")

def check_vote_consistency():
    logger.info("--- Auditing Vote Consistency ---")
    
    # 1. Check if YES + NO + ABSTAIN matches calculated total in Details JSON (if we parsed it)
    # But simpler: Check if we have individual vote results for every vote
    
    votes = db.fetch_all("SELECT id, sitting, voting_number, term FROM votes WHERE term=10")
    logger.info(f"Total Votes in DB (Term 10): {len(votes)}")
    
    # Check for votes with NO results
    issues = 0
    for vote in votes:
        count = db.fetch_one("SELECT COUNT(*) as c FROM vote_results WHERE vote_id = %s", (vote['id'],))['c']
        if count == 0:
            logger.warning(f"⚠️ Vote {vote['id']} (Sitting {vote['sitting']}, No {vote['voting_number']}) has ZERO individual results!")
            issues += 1
        elif count < 400:
             logger.warning(f"⚠️ Vote {vote['id']} has suspiciously low result count: {count}")
             issues += 1
             
    if issues == 0:
        logger.info("✅ All votes have associated individual results.")
    else:
        logger.error(f"❌ Found {issues} votes with missing or incomplete results.")

def check_mp_data_integrity():
    logger.info("\n--- Auditing MP Data Integrity ---")
    
    mps = db.fetch_all("SELECT id, first_name, last_name, club, active FROM mps WHERE term=10")
    logger.info(f"Total MPs in DB (Term 10): {len(mps)}")
    
    clubs = defaultdict(int)
    inactive_cnt = 0
    missing_data = 0
    
    for mp in mps:
        clubs[mp['club']] += 1
        if not mp['active']:
            inactive_cnt += 1
        
        if not mp['first_name'] or not mp['last_name']:
            logger.error(f"❌ MP {mp['id']} has missing name!")
            missing_data += 1
            
    logger.info("Club Distribution:")
    for club, count in clubs.items():
        logger.info(f"  - {club}: {count}")
        
    if inactive_cnt > 0:
         logger.info(f"ℹ️ Found {inactive_cnt} inactive MPs (normal for substitutions).")
    
    if missing_data == 0:
        logger.info("✅ Basic MP data integrity check passed.")

def check_ranking_logic():
    logger.info("\n--- Auditing Ranking/Calculated Data ---")
    # Quick sanity check on attendance stats
    stats = db.fetch_all("SELECT stats_attendance, stats_rebellion FROM mps WHERE term=10 LIMIT 5")
    
    zero_attendance = 0
    for s in stats:
        if s['stats_attendance'] == 0:
             zero_attendance += 1
             
    if zero_attendance > 0:
        logger.warning(f"⚠️ Found MPs with 0% attendance. Might be new MPs or calculation error.")
    else:
        logger.info("✅ Sample attendance stats look populated.")

if __name__ == "__main__":
    try:
        check_vote_consistency()
        check_mp_data_integrity()
        check_ranking_logic()
        logger.info("\n✅ Audit Complete.")
    except Exception as e:
        logger.error(f"Audit failed: {e}")
