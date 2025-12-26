from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Text, Float
from sqlalchemy.orm import relationship
from .core.orm_db import Base

class MP(Base):
    __tablename__ = "mps"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    club = Column(String, index=True)
    district = Column(String)
    photo_url = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    stats_attendance = Column(Float, default=0.0)
    stats_rebellion = Column(Integer, default=0)

    votes = relationship("VoteResult", back_populates="mp")
    bills = relationship("Bill", back_populates="mp")
    interpellations = relationship("Interpellation", back_populates="mp")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    topic = Column(String, index=True, nullable=True) # AI classified
    importance = Column(Integer, default=0) # AI calculated 1-10
    kind = Column(String, nullable=True) # e.g., 'ustawa', 'uchwała'

    results = relationship("VoteResult", back_populates="vote")

class VoteResult(Base):
    __tablename__ = "vote_results"

    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mps.id"))
    vote_id = Column(Integer, ForeignKey("votes.id"))
    result = Column(String) # 'Za', 'Przeciw', 'Wstrzymał się', 'Nieobecny'

    mp = relationship("MP", back_populates="votes")
    vote = relationship("Vote", back_populates="results")

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(String, unique=True, index=True) # e.g. RPS-123
    number = Column(String, index=True) # print number
    title = Column(Text)
    description = Column(Text, nullable=True)
    date = Column(Date)
    status = Column(String)
    type = Column(String, index=True) # poselski, rzadowy
    url = Column(String, nullable=True)
    mp_id = Column(Integer, ForeignKey("mps.id"), nullable=True)

    mp = relationship("MP", back_populates="bills")

class Interpellation(Base):
    __tablename__ = "interpellations"

    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mps.id"))
    title = Column(String)
    date = Column(Date)
    status = Column(String)

    mp = relationship("MP", back_populates="interpellations")
