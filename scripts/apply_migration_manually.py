from backend.core.orm_db import engine, Base
from backend.models import LegislativeProcess, LegislativeStage, LegislativeLink

def apply_migrations():
    print("🚀 Creating new tables for Legislative Process...")
    # This will only create tables that don't exist
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created (LegislativeProcess, LegislativeStage, LegislativeLink).")

if __name__ == "__main__":
    apply_migrations()
