from sqlalchemy import Column, Integer, String, Boolean
from backend.core.database import Base

class MP(Base):
    __tablename__ = "mps"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    name = Column(String, index=True) # Pełne imię i nazwisko (zasilane automatycznie)
    club = Column(String, index=True)
    photo_url = Column(String)
    active = Column(Boolean, default=True)
    
    # Rozszerzalność: Tu możemy w przyszłości dodać:
    # email = Column(String)
    # twitter_handle = Column(String)
    # attendance_rate = Column(Float)

    def __repr__(self):
        return f"<MP(name='{self.name}', club='{self.club}')>"
