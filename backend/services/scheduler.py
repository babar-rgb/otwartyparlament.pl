"""
Standardized Scheduler for otwartyparlament.pl
Orchestrates all ETL jobs using backend modules.
"""
import os
import time
from datetime import datetime
from backend.core.logger import get_logger
from backend.etl.incremental import IncrementalETL
from backend.etl.heuristics import ExpertHeuristicsETL

logger = get_logger("services.scheduler")


def run_incremental_etl():
    """Run incremental ETL update."""
    logger.info("Starting Incremental ETL...")
    try:
        etl = IncrementalETL(term=10)
        etl.run()
        return True
    except Exception as e:
        logger.error(f"Incremental ETL failed: {e}")
        return False


def run_heuristics_etl():
    """Generate expert analyses for votes."""
    logger.info("Starting Heuristics ETL...")
    try:
        etl = ExpertHeuristicsETL()
        etl.run()
        return True
    except Exception as e:
        logger.error(f"Heuristics ETL failed: {e}")

def run_europarl_etl():
    """Run Europarl ETL."""
    logger.info("Starting Europarl ETL...")
    try:
        from backend.etl.europarl import EuroparlETL
        etl = EuroparlETL()
        etl.run()
        return True
    except Exception as e:
        logger.error(f"Europarl ETL failed: {e}")
        return False


def run_interpellations_etl():
    """Run Interpellations ETL."""
    logger.info("Starting Interpellations ETL...")
    try:
        from backend.etl.interpellations import InterpellationsETL
        etl = InterpellationsETL()
        etl.run()
        return True
    except Exception as e:
        logger.error(f"Interpellations ETL failed: {e}")
        return False


def run_committees_etl():
    """Run Committees ETL."""
    logger.info("Starting Committees ETL...")
    try:
        from backend.etl.committees import CommitteesETL
        etl = CommitteesETL()
        etl.run()
        return True
    except Exception as e:
        logger.error(f"Committees ETL failed: {e}")
        return False


def run_declarations_etl():
    """Run Declarations ETL."""
    logger.info("Starting Declarations ETL...")
    try:
        from backend.etl.declarations import DeclarationsETL
        etl = DeclarationsETL()
        etl.run()
        return True
    except Exception as e:
        logger.error(f"Declarations ETL failed: {e}")
        return False


def run_daily_maintenance():
    """Run all daily maintenance tasks."""
    logger.info("=" * 60)
    logger.info("DAILY MAINTENANCE STARTED")
    logger.info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)
    
    start_time = time.time()
    
    # 1. Incremental ETL (Sejm Votes & MPs)
    run_incremental_etl()
    
    # 2. Expert Heuristics (Vote Analyses)
    run_heuristics_etl()
    
    # 3. Europarl
    run_europarl_etl()
    
    # 4. Interpellations
    run_interpellations_etl()
    
    # 5. Committees
    run_committees_etl()
    
    # 6. Declarations (Asset Statements)
    run_declarations_etl()
    
    elapsed = time.time() - start_time
    logger.info(f"Maintenance completed in {elapsed:.1f} seconds")
    logger.info("=" * 60)
    
    return True


def run_scheduler():
    """Run the scheduler daemon."""
    try:
        from apscheduler.schedulers.blocking import BlockingScheduler
        from apscheduler.triggers.cron import CronTrigger
    except ImportError:
        logger.error("APScheduler not installed. Run: pip install apscheduler")
        logger.info("Falling back to simple loop mode...")
        run_simple_scheduler()
        return
    
    scheduler = BlockingScheduler()
    
    # Daily update at 6:00 AM
    scheduler.add_job(
        run_daily_maintenance,
        CronTrigger(hour=6, minute=0),
        id='daily_update',
        name='Daily Data Update',
        max_instances=1
    )
    
    # Afternoon update at 14:00
    scheduler.add_job(
        run_daily_maintenance,
        CronTrigger(hour=14, minute=0),
        id='afternoon_update',
        name='Afternoon Data Update',
        max_instances=1
    )
    
    logger.info("Scheduler started")
    for job in scheduler.get_jobs():
        logger.info(f"  - {job.name}: {job.trigger}")
    
    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("Scheduler stopped")


def run_simple_scheduler():
    """Simple scheduler fallback without APScheduler."""
    logger.info("Simple scheduler mode (checks every hour)")
    
    last_run_hour = -1
    
    while True:
        now = datetime.now()
        current_hour = now.hour
        
        if current_hour in [6, 14] and current_hour != last_run_hour:
            run_daily_maintenance()
            last_run_hour = current_hour
        
        time.sleep(1800)  # 30 minutes


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Scheduler for otwartyparlament.pl')
    parser.add_argument('--once', action='store_true', help='Run maintenance once and exit')
    parser.add_argument('--status', action='store_true', help='Show last run status')
    
    args = parser.parse_args()
    
    if args.status:
        etl = IncrementalETL()
        etl.status()
    elif args.once:
        run_daily_maintenance()
    else:
        run_scheduler()
