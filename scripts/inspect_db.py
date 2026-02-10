from sqlalchemy import inspect
from backend.core.orm_db import engine

inspector = inspect(engine)
print("Table 'vote_results' columns:")
for col in inspector.get_columns("vote_results"):
    print(col)
