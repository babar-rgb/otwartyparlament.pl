
import unittest
from datetime import date
import json
from sqlalchemy.types import TypeDecorator, TEXT
from unittest.mock import patch

# --- PATCHING START ---
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

# We must patch BEFORE importing models
patchers = [
    patch('sqlalchemy.dialects.postgresql.JSONB', MockJSONB),
    patch('sqlalchemy.dialects.postgresql.TSVECTOR', MockTSVECTOR)
]
for p in patchers: p.start()
# --- PATCHING END ---

from backend.models import Base, Vote, Bill
from backend.etl.smart_linker import SmartLinker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class TestSmartLinker(unittest.TestCase):
    def setUp(self):
        # In-memory SQLite for speed
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()
        self.linker = SmartLinker(db=self.session)

    def tearDown(self):
        self.session.close()

    @classmethod
    def tearDownClass(cls):
        for p in patchers: p.stop()

    def test_extract_print_number(self):
        titles = [
            ("Głosowanie nad drukiem nr 123", "123"),
            ("Pkt 5. Ustawa o czymś (druk 456)", "456"),
            ("Zmiana w druku 789 i innych", "789"),
            ("Brak druku tutaj", None)
        ]
        for title, expected in titles:
            result = self.linker._extract_print_number(title)
            self.assertEqual(result, expected, f"Failed for title: {title}")

    def test_link_by_exact_number(self):
        # Setup
        bill = Bill(id=1, number="100", title="Ustawa o testach", date=date(2026, 1, 1))
        vote = Vote(id=1, title_raw="Głosowanie nad drukiem 100", date=date(2026, 1, 10))
        self.session.add(bill)
        self.session.add(vote)
        self.session.commit()

        # Run
        result = self.linker.link_vote(1)
        self.assertEqual(result, 1)
        self.assertEqual(vote.bill_id, 1)

    def test_link_by_fuzzy_title(self):
        # Setup
        bill = Bill(id=2, number="200", title="Ustawa o ochronie planety Ziemia", date=date(2026, 1, 1))
        # Vote title is similar but not exactly the same
        vote = Vote(id=2, title_clean="Pkt 1. Ochrona planety Ziemia - głosowanie", date=date(2026, 1, 5))
        self.session.add(bill)
        self.session.add(vote)
        self.session.commit()

        # Run
        result = self.linker.link_vote(2)
        self.assertEqual(result, 2)
        self.assertEqual(vote.bill_id, 2)

    def test_fuzzy_match_out_of_window(self):
        # Setup
        # Bill is too old
        bill = Bill(id=3, number="300", title="Dawna ustawa", date=date(2025, 1, 1))
        vote = Vote(id=3, title_clean="Dawna ustawa - powrót", date=date(2026, 1, 1))
        self.session.add(bill)
        self.session.add(vote)
        self.session.commit()

        # Run
        result = self.linker.link_vote(3)
        self.assertIsNone(result)

if __name__ == "__main__":
    unittest.main()
