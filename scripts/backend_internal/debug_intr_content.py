
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from backend.core.orm_db import SessionLocal
from backend.models import Interpellation
from sqlalchemy import text, func

db = SessionLocal()
total = db.query(Interpellation).count()
null_content = db.query(Interpellation).filter(Interpellation.content.is_(None)).count()
empty_content = db.query(Interpellation).filter(Interpellation.content == '').count()
replies = db.query(Interpellation).filter(Interpellation.reply_content.isnot(None)).count()

print(f"Total: {total}")
print(f"NULL Content: {null_content}")
print(f"Empty Content: {empty_content}")
print(f"With Replies: {replies}")

# Check one
placeholders = db.query(Interpellation).filter(Interpellation.content.like('Treść dostępna%')).count()
print(f"Placeholders remaining: {placeholders}")
print(f"Content: {first.content}")
print(f"Reply: {first.reply_content}")
db.close()
