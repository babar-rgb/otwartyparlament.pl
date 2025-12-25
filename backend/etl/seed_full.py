import logging
import sys
import os

# Add backend to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.etl.incremental import IncrementalETL
from backend.etl.committees import CommitteesETL
from backend.etl.declarations import DeclarationsETL
from backend.etl.bills import BillsETL
from backend.core.orm_db import engine
from backend.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_full")

def main():
    logger.info("🚀 STARTING FULL DATA SEEDING 🚀")

    # 0. Ensure Tables Exist
    logger.info("checking/creating tables via ORM...")
    Base.metadata.create_all(bind=engine)
    logger.info("\n--- STEP 1: MPs and Votes (Incremental ETL) ---")
    sejm = IncrementalETL()
    logger.info("Syncing Sittings & Votes (Term 10)...")
    # For seeding, we might want to be aggressive. 
    # The default run() method does both.
    sejm.run()

    # 2. Committees (New ETL)
    logger.info("\n--- STEP 2: Committees ---")
    comm = CommitteesETL()
    comm.run()

    # 3. Declarations (Asset Statements)
    logger.info("\n--- STEP 3: Asset Declarations ---")
    decl = DeclarationsETL()
    decl.run()

    logger.info("\n--- STEP 4: Legislative Processes (Bills) ---")
    bills = BillsETL()
    bills.run()
    
    logger.info("\n✅ SEEDING COMPLETE. Database should be populated.")

if __name__ == "__main__":
    main()
