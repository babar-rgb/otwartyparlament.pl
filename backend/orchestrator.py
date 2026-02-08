# Robust path handling for Docker/VPS
import sys
import os
import logging
import time
import traceback
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from sqlalchemy.orm import Session
from sqlalchemy import create_engine, select, update, func, cast, String

# Absolute imports based on BASE_DIR being in sys.path
try:
    from backend.models import AnalysisRequest, Vote, Bill, Interpellation, SystemHealth, BillAnalysis, LegislativeStage
    from backend.core.db import get_db, SessionLocal
    from backend.services.gemini import gemini_service
    from backend.etl.smart_linker import smart_linker
    from backend.etl.incremental import IncrementalETL
    from backend.etl.pdf_extractor import PDFReplyExtractor
    from backend.etl.generate_embeddings import VectorSyncETL
    from backend.services.telegram import telegram_service
except ImportError:
    # Fallback for environments where 'backend' folder is the root
    from models import AnalysisRequest, Vote, Bill, Interpellation, SystemHealth, BillAnalysis, LegislativeStage
    from core.db import get_db, SessionLocal
    from services.gemini import gemini_service
    from etl.smart_linker import smart_linker
    from etl.incremental import IncrementalETL
    from etl.pdf_extractor import PDFReplyExtractor
    from etl.generate_embeddings import VectorSyncETL
    from services.telegram import telegram_service

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger("orchestrator")

class AnalysisOrchestrator:
    """
    The Brain of Automation.
    Manages the lifecycle of analysis requests:
    PENDING -> PROCESSING -> COMPLETED / FAILED / BLOCKED
    """

    def __init__(self, db_session: Session = None, dry_run: bool = False):
        self.db = db_session if db_session else SessionLocal()
        self.dry_run = dry_run
        self.start_time = datetime.now()
        self.metrics = {"tasks_completed": 0, "errors": 0}
        self.last_master_etl = None # Track last ingestion run
        self.last_ocr_run = None # Track last OCR batch
        logger.info(f"🤖 Orchestrator initialized. Dry Run: {self.dry_run}")

    def run_loop(self, interval_seconds: int = 600):
        """
        Main loop. Checks for new tasks and processes them.
        """
        logger.info(f"🎬 Starting Orchestrator Loop (Interval: {interval_seconds}s)...")
        while True:
            try:
                # 1. Periodically run Master ETL (once every 24h or at startup)
                if not self.last_master_etl or (datetime.now() - self.last_master_etl) > timedelta(hours=24):
                    self._run_master_etl()
                    # After new ingestion, send a status report of what happened so far
                    uptime = str(datetime.now() - self.start_time).split('.')[0]
                    telegram_service.notify_daily_report(
                        tasks_done=self.metrics["tasks_completed"],
                        errors=self.metrics["errors"],
                        uptime=uptime
                    )
                
                # 2. Periodically run OCR Processor (once every 6h)
                if not self.last_ocr_run or (datetime.now() - self.last_ocr_run) > timedelta(hours=6):
                    self._run_ocr_processor()

                # 3. Scout for new analysis tasks from what we just fetched
                self.scout_for_new_tasks()
                
                # 4. Process the queue
                self.process_pending_tasks()
                
                # 5. Sync Vector Search (Embeddings)
                self._run_vector_sync()
                
                self._update_heartbeat()
                logger.info(f"💤 Sleeping for {interval_seconds}s...")
                time.sleep(interval_seconds)
            except KeyboardInterrupt:
                logger.info("🛑 Orchestrator stopped manually.")
                break
            except Exception as e:
                logger.error(f"💥 Critical Loop Error: {e}")
                traceback.print_exc()
                self.metrics["errors"] += 1
                self._update_heartbeat(status='DEGRADED')
                telegram_service.notify_critical_error(str(e))
                time.sleep(interval_seconds)

    def process_pending_tasks(self, limit: int = 10):
        """
        Fetches PENDING tasks and processes them based on priority.
        """
        stmt = (
            select(AnalysisRequest)
            .where(AnalysisRequest.status.in_(['PENDING', 'RETRY']))
            .order_by(AnalysisRequest.priority.desc(), AnalysisRequest.created_at.asc())
            .limit(limit)
        )
        tasks = self.db.execute(stmt).scalars().all()

        if not tasks:
            logger.info("✅ No pending tasks.")
            return

        logger.info(f"📋 Found {len(tasks)} tasks to process.")
        for task in tasks:
            self._process_single_task(task)
            self.metrics["tasks_completed"] += 1

    def _update_heartbeat(self, status: str = 'HEALTHY'):
        """
        Updates the system_health table with current status and metrics.
        """
        if self.dry_run: return
        
        try:
            uptime = str(datetime.now() - self.start_time)
            full_metrics = {
                **self.metrics,
                "uptime": uptime,
                "last_run": datetime.now().isoformat()
            }
            
            health = self.db.get(SystemHealth, "orchestrator")
            if not health:
                health = SystemHealth(id="orchestrator")
                self.db.add(health)
            
            health.status = status
            health.last_heartbeat = datetime.now()
            health.metrics = full_metrics
            health.version = "1.2.0"
            
            self.db.commit()
            logger.debug("💓 Heartbeat updated.")
        except Exception as e:
            logger.warning(f"⚠️ Failed to update heartbeat: {e}")
            self.db.rollback()

    def print_status(self):
        """
        Prints current system health to console.
        """
        health = self.db.get(SystemHealth, "orchestrator")
        
        # Also check for pending tasks
        pending_count = self.db.query(func.count(AnalysisRequest.id)).filter(AnalysisRequest.status == 'PENDING').scalar()

        print("\n" + "="*40)
        print("🛠️  ORCHESTRATOR STATUS REPORT")
        print("="*40)
        if health:
            print(f"Status:     {health.status}")
            print(f"Version:    {health.version}")
            print(f"Last Seen:  {health.last_heartbeat}")
            if health.metrics:
                m = health.metrics
                print(f"Uptime:     {m.get('uptime', 'N/A')}")
                print(f"Tasks Done: {m.get('tasks_completed', 0)}")
                print(f"Errors:     {m.get('errors', 0)}")
        else:
            print("Status:     UNKNOWN (Never run)")
            
        print(f"Queue Size: {pending_count} pending tasks")
        print("="*40 + "\n")

    def _process_single_task(self, task: AnalysisRequest):
        """
        Routes the task to the correct worker.
        """
        task_id = task.id
        target_type = task.target_type
        target_id = task.target_id

        logger.info(f"▶️ Processing Task {task_id}: {target_type} #{target_id}")

        if not self.dry_run:
            task.status = 'PROCESSING'
            task.attempts += 1
            task.updated_at = datetime.now()
            self.db.commit()

        try:
            success = False
            result_summary = "No result"

            if target_type == 'vote':
                success, result_summary = self._worker_analyze_vote(target_id)
            elif target_type == 'bill':
                success, result_summary = self._worker_analyze_bill(target_id)
            elif target_type == 'interpellation':
                success, result_summary = self._worker_analyze_interpellation(target_id)
            elif target_type == 'legislative_stage':
                success, result_summary = self._worker_analyze_legislative_stage(target_id)
            else:
                raise ValueError(f"Unknown target_type: {target_type}")

            if success:
                logger.info(f"✅ Task {task_id} COMPLETED. ({result_summary})")
                if not self.dry_run:
                    task.status = 'COMPLETED'
            else:
                logger.warning(f"⚠️ Task {task_id} FAILED/BLOCKED. ({result_summary})")
                if not self.dry_run:
                    if task.attempts < 3:
                        task.status = 'RETRY'
                        task.last_error = f"Attempt {task.attempts}: {result_summary}"
                    else:
                        task.status = 'FAILED'
                        task.last_error = f"Max attempts reached. Last error: {result_summary}"

        except Exception as e:
            logger.error(f"❌ Unhandled Exception in Task {task_id}: {e}")
            if not self.dry_run:
                task.status = 'FAILED'
                task.last_error = str(e)
                self.metrics["errors"] += 1
        finally:
            if not self.dry_run:
                self.db.commit()

    def _run_master_etl(self):
        """
        Triggers the full Incremental ETL process to fetch new data from Sejm API.
        This is the 'Inspiration' phase of the Zero Intervention cycle.
        """
        logger.info("🚀 Initiating Master ETL (Data Ingestion)...")
        if self.dry_run:
            logger.info("   [DRY RUN] Skipping Master ETL.")
            return

        try:
            etl = IncrementalETL(term=10)
            etl.run()
            self.last_master_etl = datetime.now()
            logger.info("✅ Master ETL completed successfully.")
        except Exception as e:
            logger.error(f"❌ Master ETL Failed: {e}")
            self.metrics["errors"] += 1
            # We don't want to crash the whole orchestrator if ETL fails once
            # It will retry in the next cycle (or 24h)

    def _run_ocr_processor(self):
        """
        Triggers the PDF extraction and OCR for interpellations.
        Ensures documents are digitized before AI analysis attempts to read them.
        """
        logger.info("📄 Initiating OCR Processor (PDF Digitization)...")
        if self.dry_run:
            logger.info("   [DRY RUN] Skipping OCR Processor.")
            return

        try:
            extractor = PDFReplyExtractor()
            extractor.run()
            self.last_ocr_run = datetime.now()
            logger.info("✅ OCR Processing batch completed.")
        except Exception as e:
            logger.error(f"❌ OCR Processor Failed: {e}")
            self.metrics["errors"] += 1

    def _run_vector_sync(self):
        """
        Triggers semantic embedding generation for new items.
        Ensures the 'Brain' can search over its own recent analyses.
        """
        logger.info("🧠 Initiating Vector Sync (Semantic Indexing)...")
        if self.dry_run:
            logger.info("   [DRY RUN] Skipping Vector Sync.")
            return

        try:
            etl = VectorSyncETL(db_session=self.db)
            etl.run()
            logger.info("✅ Vector Sync completed.")
        except Exception as e:
            logger.error(f"❌ Vector Sync Failed: {e}")
            self.metrics["errors"] += 1

    def scout_for_new_tasks(self):
        """
        Scout Mechanism: Finds new objects in DB and adds them to analysis_requests.
        """
        logger.info("🔍 Scouting for new objects to analyze...")
        
        # 1. New Votes
        from sqlalchemy import not_, cast, String
        existing_task_ids_stmt = select(AnalysisRequest.target_id).where(AnalysisRequest.target_type == 'vote')
        new_votes_stmt = select(Vote).where(not_(cast(Vote.id, String).in_(existing_task_ids_stmt)))
        new_votes = self.db.execute(new_votes_stmt).scalars().all()
        for v in new_votes:
            self._enqueue_task('vote', v.id, priority=5)

        # 2. New Bills
        existing_bill_ids_stmt = select(AnalysisRequest.target_id).where(AnalysisRequest.target_type == 'bill')
        new_bills_stmt = select(Bill).where(not_(cast(Bill.id, String).in_(existing_bill_ids_stmt)))
        new_bills = self.db.execute(new_bills_stmt).scalars().all()
        for b in new_bills:
            self._enqueue_task('bill', b.id, priority=7)

        # 3. New Interpellations
        existing_interp_ids_stmt = select(AnalysisRequest.target_id).where(AnalysisRequest.target_type == 'interpellation')
        new_interp_stmt = select(Interpellation).where(not_(cast(Interpellation.id, String).in_(existing_interp_ids_stmt)))
        new_interps = self.db.execute(new_interp_stmt).scalars().all()
        for i in new_interps:
            self._enqueue_task('interpellation', i.id, priority=3)

        # 4. New Legislative Stages (Explain what's happening)
        new_stages_stmt = select(LegislativeStage).where(LegislativeStage.description == None)
        new_stages = self.db.execute(new_stages_stmt).scalars().all()
        for s in new_stages:
            self._enqueue_task('legislative_stage', s.id, priority=2)

    def scout_for_updates(self):
        """
        Force-Scout: Finds items that were already processed but are missing NEW analytics 
        (like personas or expert summaries).
        """
        logger.info("🔄 Scouting for items missing advanced analytics...")
        
        # 1. Votes missing personas or expert_summary
        stmt = select(Vote).where(
            (Vote.is_procedural == False) & 
            ((Vote.personas == None) | (Vote.expert_summary == None))
        )
        items = self.db.execute(stmt).scalars().all()
        for v in items:
            self._enqueue_task('vote', v.id, priority=1) # Lower priority for backfill

        # 2. Interpellations missing personas
        stmt = select(Interpellation).where(Interpellation.personas == None)
        items = self.db.execute(stmt).scalars().all()
        for i in items:
            self._enqueue_task('interpellation', i.id, priority=1)

        if not self.dry_run:
            self.db.commit()

    def _enqueue_task(self, target_type: str, target_id: Any, priority: int = 5):
        """Helper to add a task to the queue."""
        task_id_uuid = str(uuid.uuid4())
        logger.info(f"🆕 Enqueuing {target_type} #{target_id}")
        
        new_task = AnalysisRequest(
            id=task_id_uuid,
            target_type=target_type,
            target_id=str(target_id),
            status='PENDING',
            priority=priority,
            created_at=datetime.now()
        )
        if not self.dry_run:
            self.db.add(new_task)

    def _worker_analyze_vote(self, vote_id: str) -> (bool, str):
        vote = self.db.get(Vote, vote_id)
        if not vote: return False, "Vote not found"

        if not gemini_service._is_valuable_vote(vote.title_clean or vote.title_raw):
             if not self.dry_run:
                 vote.ai_summary = "Głosowanie proceduralne."
             return True, "Skipped by Pre-Filter"

        linked_bill_id = smart_linker.link_vote(vote.id, db=self.db)
        bill_text = None
        if linked_bill_id:
            bill = self.db.get(Bill, linked_bill_id)
            if bill:
                bill_text = bill.content
                logger.info(f"📎 Attached bill context for vote {vote_id}")

        if self.dry_run: return True, "Simulated Vote"

        analysis = gemini_service.analyze_expert(
            title=vote.title_clean or vote.title_raw,
            description=vote.topic or "",
            bill_text=bill_text,
            doc_type="vote"
        )
        if not analysis: return False, "Gemini Fail"

        vote.ai_summary = analysis.get('summary_citizen')
        vote.expert_summary = analysis.get('summary_expert')
        vote.street_title = analysis.get('street_title')
        vote.importance = analysis.get('importance_score', 0)
        vote.topic = analysis.get('category')
        vote.personas = analysis.get('personas')
        vote.pros = analysis.get('pros')
        vote.cons = analysis.get('cons')
        vote.ai_tags = analysis.get('tags')
        vote.meta_description = analysis.get('meta_description')
        vote.seo_keywords = analysis.get('keywords')
        return True, "Vote Analyzed"

    def _worker_analyze_bill(self, bill_id: str) -> (bool, str):
        bill = self.db.get(Bill, bill_id)
        if not bill: return False, "Bill not found"
        if not bill.content: return False, "Content missing"

        if self.dry_run: return True, "Simulated Bill"

        analysis = gemini_service.analyze_expert(
            title=bill.title,
            description=bill.description or "",
            bill_text=bill.content,
            doc_type="bill"
        )
        if not analysis: return False, "Gemini Fail"
            
        analysis_record = self.db.get(BillAnalysis, bill.id)
        if not analysis_record:
            analysis_record = BillAnalysis(bill_id=bill.id)
            self.db.add(analysis_record)
            
        analysis_record.summary = analysis.get('summary_citizen')
        analysis_record.summary_expert = analysis.get('summary_expert')
        analysis_record.importance = analysis.get('importance_score', 0)
        analysis_record.pros = analysis.get('pros') 
        analysis_record.cons = analysis.get('cons')
        analysis_record.personas = analysis.get('personas')
        analysis_record.ai_tags = [analysis.get('category')] if analysis.get('category') else []

        bill.street_title = analysis.get('street_title')
        bill.importance = analysis.get('importance_score', 0)
        bill.topic = analysis.get('category')

        return True, "Bill Analyzed"

    def _worker_analyze_interpellation(self, interpellation_id: str) -> (bool, str):
        interpellation = self.db.get(Interpellation, interpellation_id)
        if not interpellation: return False, "Not found"
        if not interpellation.content: return False, "Content missing"
            
        if self.dry_run: return True, "Simulated Interpellation"
            
        analysis = gemini_service.analyze_expert(
            title=interpellation.title,
            description=f"Od: {interpellation.mp_name}, Do: {interpellation.recipient}",
            bill_text=interpellation.content,
            doc_type="interpellation"
        )
        if not analysis: return False, "Gemini Fail"
            
        interpellation.ai_summary = analysis.get('summary_citizen')
        interpellation.expert_summary = analysis.get('summary_expert')
        interpellation.importance = analysis.get('importance_score', 0)
        interpellation.personas = analysis.get('personas')
        interpellation.pros = analysis.get('pros')
        interpellation.cons = analysis.get('cons')
        interpellation.street_title = analysis.get('street_title')
        interpellation.ai_tags = analysis.get('tags')
        interpellation.meta_description = analysis.get('meta_description')
        interpellation.seo_keywords = analysis.get('keywords')
        return True, "Interpellation Analyzed"

    def _worker_analyze_legislative_stage(self, stage_id: str) -> (bool, str):
        stage = self.db.get(LegislativeStage, stage_id)
        if not stage: return False, "Stage not found"

        if self.dry_run: return True, "Simulated Stage"

        # Get context from historical stages of this process
        prev_stages = self.db.execute(
            select(LegislativeStage)
            .where(LegislativeStage.process_id == stage.process_id)
            .order_by(LegislativeStage.date)
        ).scalars().all()
        
        history_text = "\\n".join([f"- {s.date}: {s.title}" for s in prev_stages])

        analysis = gemini_service.analyze_expert(
            title=stage.title,
            description=stage.description or "",
            bill_text=f"Historia procesu:\\n{history_text}",
            doc_type="process_context"
        )
        if not analysis: return False, "Gemini Fail"

        stage.procedural_context = analysis.get('procedural_context')
        stage.legal_consequence = analysis.get('legal_consequence')
        return True, "Stage Context Generated"

    def simulate_day(self):
        """Single pass simulation."""
        self.dry_run = True
        logger.info("🧪 STARTING SIMULATION 🧪")
        self.scout_for_new_tasks()
        self.process_pending_tasks(limit=5)
        logger.info("🧪 SIMULATION ENDED 🧪")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Analysis Orchestrator v2.1")
    parser.add_argument("--interval", type=int, default=600, help="Wait time between loops (seconds)")
    parser.add_argument("--dry-run", action="store_true", help="Don't save results to DB")
    parser.add_argument("--simulate", action="store_true", help="Run a single simulation pass")
    parser.add_argument("--scout", action="store_true", help="Only run Scout mechanism once and exit")
    parser.add_argument("--re-analyze", action="store_true", help="Enqueue everything missing new analysis fields")
    parser.add_argument("--status", action="store_true", help="Print current system health and exit")
    
    args = parser.parse_args()
    
    orchestrator = AnalysisOrchestrator(dry_run=args.dry_run)
    
    if args.status:
        orchestrator.print_status()
        sys.exit(0)
    elif args.scout:
        orchestrator.scout_for_new_tasks()
        sys.exit(0)
    elif args.re_analyze:
        orchestrator.scout_for_updates()
        print("✅ Re-analysis tasks enqueued. Run the orchestrator normally to process them.")
        sys.exit(0)
    elif args.simulate:
        orchestrator.simulate_day()
        sys.exit(0)
    else:
        orchestrator.run_loop(interval_seconds=args.interval)
