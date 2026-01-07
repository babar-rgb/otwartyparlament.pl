
import sys
import os
import logging
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.etl.declarations import DeclarationsETL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backfill.declarations")

if __name__ == "__main__":
    logger.info("Starting Asset Declarations Backfill...")
    etl = DeclarationsETL()
    etl.run()
