import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.core.orm_db import Base, get_db
import os
import sys

# Ensure backend modules are found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Use a test database (in-memory SQLite or separate Postgres)
# For simplicity in this environment, we might use the existing DB connection but strictly read-only types of tests, 
# or mock it. Ideally, we use SQLite for fast unit tests.
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from pgvector.sqlalchemy import Vector
import sqlalchemy.types as types

# --- SQLite Compatibility Implementations ---

@compiles(JSONB, 'sqlite')
def compile_jsonb(type_, compiler, **kw):
    return "TEXT"

@compiles(TSVECTOR, 'sqlite')
def compile_tsvector(type_, compiler, **kw):
    return "TEXT"

@compiles(Vector, 'sqlite')
def compile_vector(type_, compiler, **kw):
    # Retrieve the dimension (e.g. 384) if needed, but for SQLite schema we just need a type name
    return "TEXT"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def client():
    # Override Dependency
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    with TestClient(app) as c:
        yield c
        
    # Drop tables
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test.db"):
        os.remove("./test.db")
