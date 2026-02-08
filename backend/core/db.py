import time
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from backend.core.config import config
from backend.core.logger import get_logger

logger = get_logger("db")

class Database:
    def __init__(self):
        self.dsn = config.get_db_uri()
        self.pool = None
        self._init_pool()

    def _init_pool(self):
        """Initialize the connection pool with retries."""
        max_retries = 15
        
        for i in range(max_retries):
            try:
                self.pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=20,
                    dsn=self.dsn
                )
                logger.info("Database connection pool initialized")
                return
            except Exception as e:
                wait_time = 2
                logger.warning(f"⚠️ Access check failed (Attempt {i+1}/{max_retries}). Retrying in {wait_time}s... Error: {e}")
                time.sleep(wait_time)

        logger.error("❌ Critical: Could not connect to database after multiple retries.")
        raise Exception("Database connection failed after retries")

    @contextmanager
    def get_cursor(self, commit=False):
        """
        Context manager for database cursor using connection pool.
        """
        conn = None
        try:
            conn = self.pool.getconn()
            if commit:
                conn.autocommit = False
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            yield cur
            
            if commit:
                conn.commit()
                
        except Exception as e:
            if conn and commit:
                conn.rollback()
            logger.error(f"Database error: {e}")
            raise e
        finally:
            if conn:
                # Reset autocommit/transaction state before returning
                # This is good practice for pooled connections
                try:
                    conn.rollback() 
                except:
                    pass
                self.pool.putconn(conn)


    def close(self):
        """Close the connection pool."""
        if self.pool:
            self.pool.closeall()
            logger.info("Database connection pool closed")

    def execute(self, query, params=None):
        """Execute a query (INSERT, UPDATE, DELETE)."""
        with self.get_cursor(commit=True) as cur:
            cur.execute(query, params)

    def fetch_all(self, query, params=None):
        """Fetch all results from a query."""
        with self.get_cursor() as cur:
            cur.execute(query, params)
            return cur.fetchall()

    def fetch_one(self, query, params=None):
        """Fetch a single result from a query."""
        with self.get_cursor() as cur:
            cur.execute(query, params)
            return cur.fetchone()


# SQLAlchemy Setup (Added for Automatyzacja 2.0)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Create SQLAlchemy engine
# Note: Re-using the same connection string logic
sqlalchemy_database_url = config.get_db_uri().replace("postgresql://", "postgresql+psycopg2://")
engine = create_engine(
    sqlalchemy_database_url, 
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=0
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base() # Removed to avoid conflict with backend.core.orm_db

def get_db():
    """Dependency for obtaining a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Global DB Instance
# In testing, we don't want this to connect immediately.
import os
if os.getenv("TESTING") != "true":
    db = Database()
else:
    db = None
