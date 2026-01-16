from backend.core.orm_db import get_db
from backend import models
db = next(get_db())
print('Term 10 Votes:', db.query(models.Vote).filter(models.Vote.term == 10).count())
print('Term 9 Votes:', db.query(models.Vote).filter(models.Vote.term == 9).count())
print('Term 10 Bills (Date):', db.query(models.Bill).filter(models.Bill.date >= '2023-11-13').count())
print('Total Semantic Votes:', db.query(models.Vote).filter(models.Vote.vector_embedding != None).count())
