from apscheduler.schedulers.blocking import BlockingScheduler
from backend.etl.incremental import IncrementalETL
from backend.core.schema_fixer import ensure_schema_integrity

def run_etl():
    print("⏰ Triggering Scheduled ETL...")
    try:
        etl = IncrementalETL()
        etl.run()
    except Exception as e:
        print(f"❌ ETL Run Failed: {e}")

if __name__ == "__main__":
    scheduler = BlockingScheduler()
    # Schedule: 6:00 and 14:00
    scheduler.add_job(run_etl, 'cron', hour=6, minute=0)
    scheduler.add_job(run_etl, 'cron', hour=6, minute=0)
    scheduler.add_job(run_etl, 'cron', hour=14, minute=0)
    
    print("🚀 Worker started.")
    
    # Run Schema Check
    try:
        ensure_schema_integrity()
    except Exception as e:
        print(f"⚠️ Schema check warning: {e}")

    print("Running initial sync...")
    run_etl() # Run on startup
    
    print("⏳ Waiting for next scheduled run (06:00, 14:00)...")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass
