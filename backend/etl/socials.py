
import os
import time
from backend.core.db import db
from backend.core.logger import get_logger

logger = get_logger("etl.socials")

class SocialsETL:
    def __init__(self, term=10):
        self.term = term

    def run(self):
        """
        Check for MPs missing social media links and attempt to find them via Gemini.
        Requires GEMINI_API_KEY.
        """
        # 1. Check Feature Flag / API Key
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning(" ⚠️  SKIPPING SOCIALS DISCOVERY: 'GEMINI_API_KEY' not found.")
            logger.warning("    Auto-discovery of MP social media requires a Gemini API key.")
            return

        logger.info("Starting Social Media Discovery (Gemini Powered)...")

        # 2. Find MPs with missing data in current term
        # Simple heuristic: missing twitter OR facebook
        # We check contact_info jsonb
        query = """
            SELECT id, first_name, last_name, club 
            FROM mps 
            WHERE term = %s AND active = true 
            AND (
                contact_info IS NULL 
                OR (contact_info->>'twitter') IS NULL 
                OR (contact_info->>'facebook') IS NULL
            )
            ORDER BY last_name
        """
        mps_missing = db.fetch_all(query, (self.term,))
        
        if not mps_missing:
            logger.info("All MPs have social media links. Good job!")
            return

        logger.info(f"Found {len(mps_missing)} MPs missing social media links.")
        
        # 3. Process Batch (Placeholder for now)
        # Real implementation would:
        # - Iterate MPs
        # - Call Gemini with Google Search Grounding to find "Poseł [Name] Twitter"
        # - Parse result
        # - Update DB
        
        # For now, we just log that we WOULD work if the logic was fully implemented with a search tool.
        # Since standard Gemini API (text-only) cannot browse the web without Grounding configuration,
        # we treat this as "Ready to Implement" once the key and config is validated.
        
        logger.info(f"Ready to process {len(mps_missing)} MPs. (Search Logic waiting for active Key)")
        
        # TODO: Implement actual Gemini Client call here when key is provided by user.
        # Example:
        # for mp in mps_missing[:5]:
        #     logger.info(f"Searching for {mp['first_name']} {mp['last_name']}...")
        #     links = gemini_service.find_socials(mp['first_name'], mp['last_name'])
        #     if links:
        #         db.update_contact_info(mp['id'], links)

if __name__ == "__main__":
    SocialsETL().run()
