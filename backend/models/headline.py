from sqlalchemy import Column, Integer, String, Date
from backend.core.database import Base

class Headline(Base):
    __tablename__ = "headlines"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    portal = Column(String, index=True)
    url = Column(String, unique=True, index=True)
    published_at = Column(Date, index=True)

    def __repr__(self):
        return f"<Headline(title='{self.title[:30]}...', portal='{self.portal}')>"
