from sqlalchemy import Column, String, JSON
from backend.core.database import Base

class PozaKadrem(Base):
    __tablename__ = "poza_kadrem"

    id = Column(String, primary_key=True, index=True) # np. 'kobalt'
    tytul = Column(String)
    podtytul = Column(String)
    okladka = Column(String)
    
    # Cała dynamiczna treść raportu w jednym polu JSON
    # Dzięki temu nie musimy zmieniać bazy przy nowych pomysłach
    struktura_json = Column(JSON) 
