from sqlalchemy import Column, Integer, String, Date, Boolean, JSON
from backend.core.database import Base

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    verdict = Column(String) # np. PRZYJĘTO, ODRZUCONO
    is_procedural = Column(Boolean, default=False)
    
    # Przechowujemy surowe wyniki w JSON, żeby nie komplikować tabeli, 
    # a jednocześnie mieć dostęp do wszystkiego (np. ile głosów ZA w każdym klubie)
    results_json = Column(JSON) 

    def __repr__(self):
        return f"<Vote(title='{self.title[:30]}...', verdict='{self.verdict}')>"
