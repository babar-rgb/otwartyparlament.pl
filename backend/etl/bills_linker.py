# Path setup not needed if imported as module in backend
try:
    from backend.core.orm_db import SessionLocal
except ImportError:
    # Fallback if running directly
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
    from backend.core.orm_db import SessionLocal

from backend.core.logger import get_logger
from sqlalchemy import text

logger = get_logger("etl.linker")

class BillVoteLinker:
    def run(self):
        """Run Vote <-> Bill Linking."""
        self.link_votes()

    def link_votes(self):
        session = SessionLocal()
        try:
            logger.info("🔗 Starting Vote <-> Bill Linker (SQL optimization)...")
            
            # We can do this with a single SQL UPDATE query which is instant
            # UPDATE votes SET bill_id = bills.id FROM bills WHERE votes.print_number = bills.number
            
            # 1. Link new votes and prefer AI street_title
            sql_link = """
                UPDATE votes 
                SET bill_id = bills.id,
                    title_clean = COALESCE(bills.street_title, bills.title),
                    topic = bills.topic
                FROM bills 
                WHERE votes.print_number = bills.number 
                  AND votes.bill_id IS NULL 
                  AND votes.print_number IS NOT NULL;
            """
            
            # 2. Update titles for already linked votes (retroactive fix + upgrade to street_title)
            # This will also upgrade existing votes if a new street_title appears for the bill
            sql_fix = """
                UPDATE votes
                SET title_clean = COALESCE(bills.street_title, bills.title),
                    topic = bills.topic
                FROM bills
                WHERE votes.bill_id = bills.id
                  AND (
                      votes.title_clean IS NULL 
                      OR votes.title_clean LIKE 'Pkt %' 
                      OR votes.title_clean LIKE 'Sprawozdanie Komisji%'
                      OR (bills.street_title IS NOT NULL AND votes.title_clean = bills.title) -- Upgrade from official to street
                  );
            """
            
            session.execute(text(sql_link))
            session.execute(text(sql_fix))
            session.commit()
            
            if result.rowcount > 0:
                logger.info(f"✅ Linked {result.rowcount} votes to bills instantly!")
            else:
                logger.debug("No new links created.")
            
        except Exception as e:
            logger.error(f"Error linking votes: {e}")
            session.rollback()
        finally:
            session.close()

if __name__ == "__main__":
    BillVoteLinker().run()
