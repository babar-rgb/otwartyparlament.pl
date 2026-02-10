import logging
logging.basicConfig(level=logging.INFO)

import os
import sys
import re
import argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.db import db

def parse_and_import(file_path, term):
    logging.info(f"Reading from {file_path} for Term {term}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by "X. posiedzenie"
    sections = re.split(r'(\d+\.\s+posiedzenie)', content)
    
    current_sitting = None
    count = 0
    
    for section in sections:
        if not section.strip():
            continue
            
        # Check if it's a header
        header_match = re.match(r'(\d+)\.\s+posiedzenie', section)
        if header_match:
            current_sitting = int(header_match.group(1))
        else:
            if current_sitting is not None:
                summary_md = section.strip()
                
                logging.info(f"Importing Sitting {current_sitting} (Term {term})...")
                
                # Upsert
                query = """
                    INSERT INTO sitting_summaries (term, sitting_number, summary_md, updated_at)
                    VALUES (%s, %s, %s, NOW())
                    ON CONFLICT (term, sitting_number) 
                    DO UPDATE SET summary_md = EXCLUDED.summary_md, updated_at = NOW();
                """
                
                try:
                    db.execute(query, (term, current_sitting, summary_md))
                    count += 1
                except Exception as e:
                    logging.info(f"Error importing sitting {current_sitting}: {e}")

    logging.info(f"Finished. Imported {count} summaries for Term {term}.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Import sitting summaries.')
    parser.add_argument('--term', type=int, default=10, help='Term number (e.g. 9 or 10)')
    parser.add_argument('--file', type=str, default='backend/data/historical_summaries.txt', help='Path to data file')
    
    args = parser.parse_args()
    
    parse_and_import(args.file, args.term)
