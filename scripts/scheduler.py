#!/usr/bin/env python3
"""
Scheduler for otwartyparlament.pl
Runs automated data updates on schedule.

Usage:
  python scheduler.py          # Run as daemon
  python scheduler.py --once   # Run once and exit
  python scheduler.py --status # Show job status
"""

import os
import sys
import time
import logging
from datetime import datetime
import subprocess

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'scheduler.log'))
    ]
)
logger = logging.getLogger(__name__)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def run_incremental_etl():
    """Run incremental ETL update"""
    logger.info("Starting incremental ETL...")
    try:
        result = subprocess.run(
            [sys.executable, os.path.join(SCRIPT_DIR, 'incremental_etl.py')],
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour max
        )
        
        if result.returncode == 0:
            logger.info("Incremental ETL completed successfully")
            logger.debug(result.stdout)
        else:
            logger.error(f"ETL failed: {result.stderr}")
            
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        logger.error("ETL timed out after 1 hour")
        return False
    except Exception as e:
        logger.error(f"ETL error: {e}")
        return False


def run_vote_analyses():
    """Generate analyses for new votes"""
    logger.info("Generating vote analyses...")
    try:
        result = subprocess.run(
            [sys.executable, os.path.join(SCRIPT_DIR, 'generate_vote_analyses.py')],
            capture_output=True,
            text=True,
            timeout=1800  # 30 min max
        )
        
        if result.returncode == 0:
            logger.info("Vote analyses completed")
        else:
            logger.warning(f"Vote analyses warning: {result.stderr[:200]}")
            
        return result.returncode == 0
        
    except Exception as e:
        logger.warning(f"Vote analyses skipped: {e}")
        return False


def run_europarl_etl():
    """Run Europarliament ETL"""
    logger.info("Starting Europarl ETL...")
    try:
        result = subprocess.run(
            [sys.executable, os.path.join(SCRIPT_DIR, 'etl_europarl_votes.py')],
            capture_output=True,
            text=True,
            timeout=3600
        )
        if result.returncode == 0:
            logger.info("Europarl ETL completed")
        else:
            logger.error(f"Europarl ETL failed: {result.stderr}")
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Europarl ETL error: {e}")
        return False

def run_interpellations_import():
    """Run Interpellations Import"""
    logger.info("Starting Interpellations Import...")
    try:
        # Check if environment variables are set, otherwise load from .env manually in the script?
        # The script creates Supabase client so it needs ENV.
        # Subprocess inherits ENV by default.
        result = subprocess.run(
            [sys.executable, os.path.join(SCRIPT_DIR, 'import_interpellations.py')],
            capture_output=True,
            text=True,
            timeout=3600
        )
        if result.returncode == 0:
            logger.info("Interpellations Import completed")
        else:
            logger.error(f"Interpellations Import failed: {result.stderr}")
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Interpellations Import error: {e}")
        return False

def run_daily_maintenance():
    """Run daily maintenance tasks"""
    logger.info("="*60)
    logger.info("DAILY MAINTENANCE STARTED")
    logger.info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("="*60)
    
    start_time = time.time()
    
    # 1. Incremental ETL (Sejm Votes & MPs)
    run_incremental_etl()
    
    # 2. Europarl
    run_europarl_etl()
    
    # 3. Interpellations
    run_interpellations_import()
    
    # 4. Generate vote analyses for new votes
    run_vote_analyses()
    
    elapsed = time.time() - start_time
    logger.info(f"Maintenance completed in {elapsed:.1f} seconds")
    logger.info("="*60)
    
    return True


def run_scheduler():
    """Run the scheduler daemon"""
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
    
    # Also run update at 14:00 (after morning sittings)
    scheduler.add_job(
        run_daily_maintenance,
        CronTrigger(hour=14, minute=0),
        id='afternoon_update',
        name='Afternoon Data Update',
        max_instances=1
    )
    
    logger.info("Scheduler started")
    logger.info("Jobs:")
    for job in scheduler.get_jobs():
        logger.info(f"  - {job.name}: {job.trigger}")
    
    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("Scheduler stopped")


def run_simple_scheduler():
    """Simple scheduler fallback without APScheduler"""
    logger.info("Simple scheduler mode (checks every hour)")
    
    last_run_hour = -1
    
    while True:
        now = datetime.now()
        current_hour = now.hour
        
        # Run at 6:00 and 14:00
        if current_hour in [6, 14] and current_hour != last_run_hour:
            run_daily_maintenance()
            last_run_hour = current_hour
        
        # Sleep for 30 minutes
        time.sleep(1800)


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Scheduler for otwartyparlament.pl')
    parser.add_argument('--once', action='store_true', help='Run maintenance once and exit')
    parser.add_argument('--status', action='store_true', help='Show last run status')
    
    args = parser.parse_args()
    
    if args.status:
        log_file = os.path.join(SCRIPT_DIR, 'scheduler.log')
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                lines = f.readlines()
                print("Last 20 log entries:")
                for line in lines[-20:]:
                    print(line.rstrip())
        else:
            print("No scheduler logs found")
        return
    
    if args.once:
        run_daily_maintenance()
    else:
        run_scheduler()


if __name__ == "__main__":
    main()
