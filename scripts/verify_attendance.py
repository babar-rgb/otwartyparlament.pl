import logging
from dotenv import load_dotenv

load_dotenv("/Users/kajtek/sejm/git/parlament/.env")

from backend.core.orm_db import SessionLocal
from backend.models import MP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_attendance")

def verify_attendance():
    db = SessionLocal()
    try:
        targets = [
            ("Małgorzata Pępek", 1.0), # Expect ~100%
            ("Zbigniew Ziobro", 0.2),  # Expect ~18-20%
            ("Donald Tusk", 0.5),      # Expect <50%
            ("Marcin Romanowski", 0.5) # Expect <50%
        ]
        
        logger.info("🔍 Verifying Attendance Stats per 'Skrót Polityczny' benchmarks...")
        
        for name, benchmark in targets:
            # Handle name splitting for query
            first, last = name.split(" ", 1)
            mp = db.query(MP).filter(MP.first_name == first, MP.last_name == last, MP.term == 10).first()
            
            if mp:
                logger.info(f"   👤 {name}:")
                logger.info(f"      - DB Stored: {mp.stats_attendance * 100:.2f}%")
                logger.info(f"      - Benchmark: ~{benchmark * 100:.0f}%")
                
                diff = abs(mp.stats_attendance - benchmark)
                if diff > 0.1: # 10% tolerance
                    logger.warning(f"      ⚠️ Large discrepancy! ({diff*100:.1f}%)")
                else:
                    logger.info("      ✅ Matches benchmark.")
            else:
                logger.error(f"   ❌ MP {name} not found in DB!")
                
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_attendance()
