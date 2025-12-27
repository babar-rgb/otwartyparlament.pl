import time
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from .config import config
from .logger import get_logger

logger = get_logger("db")

class Database:
    def __init__(self):
        self.conn_params = {
            "dbname": config.DB_NAME,
            "user": config.DB_USER,
            "password": config.DB_PASSWORD,
            "host": config.DB_HOST,
            "port": config.DB_PORT
        }
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
                    **self.conn_params
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

db = Database()
