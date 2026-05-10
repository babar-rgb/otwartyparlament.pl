from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Domyślnie używamy SQLite dla maksymalnej prostoty i braku konfiguracji
# Można to nadpisać zmienną środowiskową DATABASE_URL dla Postgresa
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backend/truth_layer.db")

# Jeśli nie ma Postgresa, używamy SQLite (minimalizm)
if not DATABASE_URL.startswith("postgresql"):
    DATABASE_URL = "sqlite:///./backend/truth_layer.db"

engine = create_engine(
    DATABASE_URL, 
    # check_same_thread potrzebne tylko dla SQLite
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
