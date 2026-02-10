
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from backend.core.orm_db import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    result = db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'interpellations';"))
    for row in result:
        print(row)
finally:
    db.close()
