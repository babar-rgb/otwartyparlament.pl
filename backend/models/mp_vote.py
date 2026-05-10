from sqlalchemy import Column, Integer, String, ForeignKey
from backend.core.database import Base

class MPVote(Base):
    __tablename__ = "mp_votes"

    id = Column(String, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mps.id"), index=True)
    vote_id = Column(Integer, ForeignKey("votes.id"), index=True)
    choice = Column(String) # ZA, PRZECIW, WSTRZYMAŁ SIĘ, NIEOBECNY

    def __repr__(self):
        return f"<MPVote(mp_id={self.mp_id}, vote_id={self.vote_id}, choice='{self.choice}')>"
