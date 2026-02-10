import logging
logging.basicConfig(level=logging.INFO)

import sys
import os
import json

# Ensure we can import core modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.db import db

def audit_socials():
    logging.info("Running Final Social Media Audit...")
    
    with db.get_cursor() as cur:
        # Get all active MPs in term 10
        cur.execute("""
            SELECT name, party, contact_info 
            FROM mps 
            WHERE term = 10 AND active = true
            ORDER BY party, name
        """)
        mps = cur.fetchall()
        
        total_mps = len(mps)
        missing_any = 0
        missing_both = 0
        
        clubs_stats = {}
        
        logging.info(f"Total Active MPs: {total_mps}")
        logging.info("-" * 60)
        logging.info(f"{'Name':<30} | {'Club':<15} | {'Missing'}")
        logging.info("-" * 60)
        
        for mp in mps:
            name = mp['name']
            club = mp['party']
            contact = mp['contact_info'] or {}
            
            has_fb = contact.get('facebook') and contact.get('facebook').startswith('http')
            has_tw = contact.get('twitter') and contact.get('twitter').startswith('http')
            
            missing = []
            if not has_fb:
                missing.append('Facebook')
            if not has_tw:
                missing.append('Twitter')
            
            if club not in clubs_stats:
                clubs_stats[club] = {'total': 0, 'missing_fb': 0, 'missing_tw': 0, 'missing_both': 0}
            
            clubs_stats[club]['total'] += 1
            if not has_fb:
                clubs_stats[club]['missing_fb'] += 1
            if not has_tw:
                clubs_stats[club]['missing_tw'] += 1
            if not has_fb and not has_tw:
                clubs_stats[club]['missing_both'] += 1

            if missing:
                missing_any += 1
                if len(missing) == 2:
                    missing_both += 1
                    logging.info(f"{name:<30} | {club:<15} | Both missing")
                # else:
                #     logging.info(f"{name:<30} | {club:<15} | Missing {missing[0]}")

        logging.info("-" * 60)
        logging.info("CLUB STATISTICS")
        logging.info("-" * 60)
        logging.info(f"{'Club':<20} | {'Total':<6} | {'No FB':<6} | {'No TW':<6} | {'No Socials':<10}")
        logging.info("-" * 60)
        for club, stats in clubs_stats.items():
            logging.info(f"{club:<20} | {stats['total']:<6} | {stats['missing_fb']:<6} | {stats['missing_tw']:<6} | {stats['missing_both']:<10}")
            
        logging.info("-" * 60)
        logging.info(f"MPs with at least one missing: {missing_any}")
        logging.info(f"MPs with NO social media: {missing_both}")

if __name__ == "__main__":
    audit_socials()
