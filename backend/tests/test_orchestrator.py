

import unittest
import logging
import sys
import os
from datetime import datetime
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))


from unittest.mock import MagicMock, patch
import sqlalchemy # Added this import
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# MOCK CONFIG AND CREATE_ENGINE
# Postgres args like 'max_overflow' crash SQLite. We must strip them.

# MOCK CONFIG AND CREATE_ENGINE
# Postgres args like 'max_overflow' crash SQLite. We must strip them.


# MOCK CONFIG AND CREATE_ENGINE
# Postgres args like 'max_overflow' crash SQLite. We must strip them.

# 1. Capture original create_engine
original_create_engine = sqlalchemy.create_engine

def side_effect_create_engine(url, **kwargs):
    fixed_url = "sqlite:///:memory:"
    kwargs.pop('max_overflow', None)
    kwargs.pop('pool_size', None)
    kwargs.pop('pool_pre_ping', None)
    return original_create_engine(fixed_url, **kwargs)

# 2. Patch Postgres Types for SQLite
import json
from sqlalchemy.types import TypeDecorator, TEXT
class MockJSONB(TypeDecorator):
    impl = TEXT
    cache_ok = True
    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value
    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return json.loads(value)
            except:
                return value
        return value
class MockTSVECTOR(TypeDecorator):
    impl = TEXT

with patch('backend.core.config.config.get_db_uri') as mock_uri, \
     patch('sqlalchemy.create_engine', side_effect=side_effect_create_engine) as mock_create_engine, \
     patch('backend.core.db.Database') as MockDatabase, \
     patch('sqlalchemy.dialects.postgresql.JSONB', MockJSONB), \
     patch('sqlalchemy.dialects.postgresql.TSVECTOR', MockTSVECTOR), \
     patch('pgvector.sqlalchemy.Vector', MockTSVECTOR): # Also mock Vector
    
    # Mock URI
    mock_uri.return_value = "sqlite:///:memory:"

    # Import modules with patched environment
    from backend.core.orm_db import Base
    from backend.models import AnalysisRequest, Vote, Bill, Interpellation
    from backend.orchestrator import AnalysisOrchestrator

# Configure Logging for Tests
logging.basicConfig(level=logging.INFO)

class TestOrchestratorIntegration(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Use in-memory SQLite for speed and isolation
        cls.engine = create_engine('sqlite:///:memory:')
        Base.metadata.create_all(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    def setUp(self):
        self.session = self.Session()
        self.orchestrator = AnalysisOrchestrator(db_session=self.session, dry_run=False)
        
        # CLEAR DB
        self.session.query(AnalysisRequest).delete()
        self.session.query(Vote).delete()
        self.session.query(Bill).delete()
        self.session.query(Interpellation).delete()
        self.session.commit()

    def tearDown(self):
        self.session.close()

    @patch('backend.services.gemini.gemini_service.analyze_expert')
    def test_vote_analysis_flow(self, mock_gemini):
        """
        Scenario: Normal Vote Analysis
        1. Create Vote in DB.
        2. Create AnalysisRequest (PENDING).
        3. Run Orchestrator.
        4. Assert Status -> COMPLETED and Vote has AI summary.
        """
        # A. Setup Data
        vote = Vote(id=101, title_clean="Głosowanie nad ustawą o AI", topic="Regulacje", date=datetime.now())
        self.session.add(vote)
        
        task = AnalysisRequest(id="task-1", target_type="vote", target_id="101", status="PENDING")
        self.session.add(task)
        self.session.commit()
        
        # B. Mock AI Response
        mock_gemini.return_value = {
            "summary_citizen": "AI to przyszłość.",
            "street_title": "Ustawa o AI",
            "importance_score": 8
        }
        
        # C. Run
        self.orchestrator.process_pending_tasks()
        
        # D. Assertions
        updated_task = self.session.get(AnalysisRequest, "task-1")
        updated_vote = self.session.get(Vote, 101)
        
        self.assertEqual(updated_task.status, 'COMPLETED', msg=f"Task failed with error: {updated_task.last_error}")
        self.assertEqual(updated_vote.ai_summary, "AI to przyszłość.")
        print("\n✅ Test Vote Flow: PASSED")

    def test_procedural_vote_skipping(self):
        """
        Scenario: Procedural Vote (Cost Saving)
        1. Create "Wniosek o przerwę" Vote.
        2. Run Orchestrator.
        3. Assert Gemini was NOT called, but Task -> COMPLETED.
        """
        vote = Vote(id=102, title_clean="Głosowanie w sprawie przerwy w obradach", date=datetime.now())
        self.session.add(vote)
        task = AnalysisRequest(id="task-2", target_type="vote", target_id="102", status="PENDING")
        self.session.add(task)
        self.session.commit()
        
        # spy on gemini service pre-filter
        with patch('backend.services.gemini.gemini_service.analyze_expert') as mock_gemini:
            self.orchestrator.process_pending_tasks()
            mock_gemini.assert_not_called()
            
        updated_task = self.session.get(AnalysisRequest, "task-2")
        self.assertEqual(updated_task.status, 'COMPLETED', msg=f"Task failed with error: {updated_task.last_error}") # Should be completed (skipped)
        print("\n✅ Test Procedural Skip: PASSED")

    @patch('backend.services.gemini.gemini_service.analyze_expert')
    def test_interpellation_with_missing_content(self, mock_gemini):
        """
        Scenario: Interpellation has no text content (needs OCR).
        1. Create Interpellation (content=None).
        2. Run Orchestrator.
        3. Assert Task -> FAILED (or custom status) with error message.
        """
        interpellation = Interpellation(id=201, title="Pytanie o drogi", content=None)
        self.session.add(interpellation)
        task = AnalysisRequest(id="task-3", target_type="interpellation", target_id="201", status="PENDING")
        self.session.add(task)
        self.session.commit()
        
        self.orchestrator.process_pending_tasks()
        
        updated_task = self.session.get(AnalysisRequest, "task-3")
        self.assertIn("RETRY", updated_task.status, msg=f"Expected RETRY, got {updated_task.status}. Error: {updated_task.last_error}") # Should retry or fail
        self.assertIn("Content missing", updated_task.last_error)
        print("\n✅ Test Missing Content: PASSED")

    @patch('backend.services.gemini.gemini_service.analyze_expert')
    def test_bill_analysis(self, mock_gemini):
        """
        Scenario: Bill Analysis
        """
        bill = Bill(id=301, title="Ustawa budżetowa", content="Treść ustawy...")
        self.session.add(bill)
        task = AnalysisRequest(id="task-4", target_type="bill", target_id="301", status="PENDING")
        self.session.add(task)
        self.session.commit()
        
        mock_gemini.return_value = {
            "summary_citizen": "Budżet na rok 2026.",
            "summary_expert": "Deficyt 5%.",
            "street_title": "Budżet 2026",
            "importance_score": 8,
            "category": "Finanse"
        }
        
        self.orchestrator.process_pending_tasks()
        
        updated_bill = self.session.get(Bill, 301)
        # Check task completion first to see errors
        updated_task = self.session.get(AnalysisRequest, "task-4")
        self.assertEqual(updated_task.status, 'COMPLETED', msg=f"Bill Analysis failed: {updated_task.last_error}")
        
        from backend.models import BillAnalysis
        analysis_record = self.session.get(BillAnalysis, 301)
        self.assertIsNotNone(analysis_record)
        self.assertEqual(analysis_record.importance, 8) # Wait, mocked value was None in previous mock, let's check it
        self.assertEqual(updated_bill.street_title, "Budżet 2026")
        print("\n✅ Test Bill Analysis: PASSED")

    @patch('backend.services.gemini.gemini_service.analyze_expert')
    def test_vote_analysis_with_implicit_link(self, mock_gemini):
        """
        Scenario: Vote has no bill_id, but title contains 'druk 500'.
        SmartLinker should find Bill #500 and provide context to Gemini.
        """
        from datetime import date
        mock_gemini.return_value = {"summary_citizen": "Analiza z kontekstem druku."}
        
        # 1. Setup Bill
        bill = Bill(id=500, number="500", title="Ustawa o dronach", content="TREŚĆ USTAWY O DRONACH", date=date.today())
        self.session.add(bill)
        
        # 2. Setup Vote with NO bill_id but with Druk number in title
        vote = Vote(id=105, title_raw="Głosowanie nad projektem (druk nr 500)", title_clean="Ustawa o dronach", date=date.today())
        self.session.add(vote)
        
        task = AnalysisRequest(id="task-implicit", target_type="vote", target_id="105", status="PENDING")
        self.session.add(task)
        self.session.commit()

        # 3. Run Orchestrator
        self.orchestrator.process_pending_tasks()

        # 4. Verify
        updated_vote = self.session.get(Vote, 105)
        self.assertEqual(updated_vote.bill_id, 500) # Linked!
        
        # Verify Gemini was called with bill_text
        args, kwargs = mock_gemini.call_args
        self.assertIn("TREŚĆ USTAWY O DRONACH", kwargs.get('bill_text', ""))
        
        print("\n✅ Test Implicit Linking: PASSED")

if __name__ == '__main__':
    unittest.main()
