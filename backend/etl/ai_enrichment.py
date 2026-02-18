import logging
import json
import os
import sys
from typing import List, Dict, Any, Optional

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.db import db
from backend.services.gemini import GeminiService
from backend.models import Vote, VoteAnalysis

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("etl.ai_enrichment")

class AIEnrichmentETL:
    def __init__(self):
        self.db = db
        self.gemini = GeminiService()

    def run(self, limit: int = 50):
        """Runs the enrichment process for votes missing deep analysis."""
        logger.info(f"🚀 Starting AI Enrichment batch (Limit: {limit})...")
        
        # 1. Process Human-Friendly Street Titles
        self.process_street_titles(limit)
        
        # 2. Process Deep Analyses
        self.process_vote_analyses(limit)

    def process_street_titles(self, limit: int):
        """Generates human-friendly titles for votes with technical names."""
        query = """
            SELECT v.id, v.title_clean, v.title_raw, v.details_json::text as context 
            FROM votes v
            WHERE v.street_title IS NULL 
               OR v.street_title = '' 
               OR v.street_title LIKE 'Pkt %%'
               OR v.street_title LIKE 'Głosowanie nr \%%'
            ORDER BY v.date DESC
            LIMIT %s
        """
        try:
            results = self.db.fetch_all(query, (limit,))
            logger.info(f"Processing {len(results)} street titles...")
            
            count = 0
            for row in results:
                vote_id = row['id']
                original_title = row['title_clean'] or row['title_raw']
                context = row['context'] or ""
                
                # Basic check for procedural headers to save tokens and improve quality
                if "posiedzenie Sejmu" in original_title and len(original_title) < 100:
                    logger.info(f"Skipping street title for sitting header: {vote_id}")
                    self.db.execute("UPDATE votes SET street_title = 'Nagłówek Posiedzenia', is_procedural = True WHERE id = %s", (vote_id,))
                    count += 1
                    continue

                new_title = self.gemini.generate_simple_title(original_title, description=context)
                if new_title and len(new_title) > 3:
                    self.db.execute(
                        "UPDATE votes SET street_title = %s WHERE id = %s",
                        (new_title, vote_id)
                    )
                    count += 1
            logger.info(f"Updated {count} street titles.")
        except Exception as e:
            logger.error(f"Error processing street titles: {e}")

    def process_vote_analyses(self, limit: int):
        """Generates deep AI analysis for votes."""
        query = """
            SELECT v.id, v.street_title, v.title_clean, v.title_raw, v.details_json::text as description, v.details_json::text as context
            FROM votes v
            LEFT JOIN vote_analyses va ON v.id = va.vote_id
            WHERE v.is_procedural = False 
              AND (va.vote_id IS NULL OR v.ai_summary IS NULL OR va.summary_expert IS NULL)
            ORDER BY v.date DESC
            LIMIT %s
        """
        results = self.db.fetch_all(query, (limit,))
        logger.info(f"Generating {len(results)} deep vote analyses...")
        
        # Prepare SQL statements
        sql_analysis = """
            INSERT INTO vote_analyses (vote_id, summary, summary_expert, pros, cons, procedural_context, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (vote_id) DO UPDATE SET
                summary = EXCLUDED.summary,
                summary_expert = EXCLUDED.summary_expert,
                pros = EXCLUDED.pros,
                cons = EXCLUDED.cons,
                procedural_context = EXCLUDED.procedural_context;
        """
        
        sql_vote = """
            UPDATE votes SET 
                topic = %s, 
                importance = %s,
                personas = %s,
                pros = %s,
                cons = %s,
                ai_summary = %s
            WHERE id = %s
        """

        count = 0
        for row in results:
            vote_id = row['id']
            title = row['street_title'] or row['title_clean'] or row['title_raw']
            # Combine Sejm description with bill summary for best context
            context = (row['description'] or "") + "\n\n" + (row['context'] or "")
            
            # Check for generic headers
            if row['street_title'] == 'Nagłówek Posiedzenia':
                logger.info(f"Setting procedural summary for header: {vote_id}")
                self.db.execute("UPDATE votes SET ai_summary = 'Głosowanie techniczne otwierające posiedzenie Sejmu.', is_procedural = True WHERE id = %s", (vote_id,))
                count += 1
                continue

            analysis = self.gemini.analyze_vote_expert(title, context)
            if analysis:
                try:
                    import json
                    # Store deep analysis
                    self.db.execute(sql_analysis, (
                        vote_id,
                        analysis.get('summary_citizen') or analysis.get('summary') or '',
                        analysis.get('summary_expert') or '',
                        json.dumps(analysis.get('pros', [])),
                        json.dumps(analysis.get('cons', [])),
                        analysis.get('procedural_context') or ''
                    ))
                    
                    # Store metadata and citizen summary in main table
                    self.db.execute(sql_vote, (
                        analysis.get('category'),
                        analysis.get('importance_score'),
                        json.dumps(analysis.get('personas', {})),
                        json.dumps(analysis.get('pros', [])),
                        json.dumps(analysis.get('cons', [])),
                        analysis.get('summary_citizen') or analysis.get('summary') or '',
                        vote_id
                    ))
                    count += 1
                    logger.info(f"✅ Enriched vote {vote_id}")
                except Exception as e:
                    logger.error(f"❌ Failed to save analysis for vote {vote_id}: {e}")

                import time
                time.sleep(1) # Quota protection
        
        logger.info(f"Generated {count} deep analyses.")

if __name__ == "__main__":
    etl = AIEnrichmentETL()
    etl.run()
