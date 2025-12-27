from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Text, Float, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
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
    term = Column(Integer, index=True)
    created_at = Column(DateTime, server_default=func.now())

    votes = relationship("VoteResult", back_populates="mp")
    bills = relationship("Bill", back_populates="mp")
    interpellations = relationship("Interpellation", back_populates="mp")

class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    sitting = Column(Integer, index=True)
    term = Column(Integer, index=True)
    voting_number = Column(Integer)
    date = Column(Date, index=True)
    title_raw = Column(String)
    title_clean = Column(String)
    verdict = Column(String)
    details_json = Column(JSONB)
    description = Column(Text, nullable=True)
    topic = Column(String, index=True, nullable=True) # AI classified
    importance = Column(Integer, default=0) # AI calculated 1-10
    kind = Column(String, nullable=True) # e.g., 'ustawa', 'uchwała'
    created_at = Column(DateTime, server_default=func.now())

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
    created_at = Column(DateTime, server_default=func.now())

    mp = relationship("MP", back_populates="bills")

class Interpellation(Base):
    __tablename__ = "interpellations"

    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mps.id"))
    title = Column(String)
    sent_date = Column(Date)
    last_modified = Column(DateTime)
    raw_data = Column(JSONB)
    status = Column(String)
    created_at = Column(DateTime, server_default=func.now())

    mp = relationship("MP", back_populates="interpellations")

class InterpellationAuthor(Base):
    __tablename__ = "interpellation_authors"

    interpellation_id = Column(Integer, ForeignKey("interpellations.id"), primary_key=True)
    mp_id = Column(Integer, ForeignKey("mps.id"), primary_key=True)

class Committee(Base):
    __tablename__ = "committees"

    code = Column(String, primary_key=True)
    name = Column(String)
    name_genitive = Column(String)
    committee_type = Column(String)
    phone = Column(String)
    term = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())

class CommitteeMember(Base):
    __tablename__ = "committee_members"

    id = Column(Integer, primary_key=True, index=True) # Auto-increment
    committee_code = Column(String, ForeignKey("committees.code"))
    mp_id = Column(Integer, ForeignKey("mps.id"))
    function = Column(String, nullable=True)
    from_date = Column(Date, nullable=True)
    to_date = Column(Date, nullable=True)
    term = Column(Integer)

class AssetDeclaration(Base):
    __tablename__ = "asset_declarations"

    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mps.id"))
    year = Column(String)
    type = Column(String)
    pdf_url = Column(String)
    raw_data = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())

class EuroMEP(Base):
    __tablename__ = "euro_meps"
    
    id = Column(Integer, primary_key=True, index=True)
    api_id = Column(Integer, unique=True)
    name = Column(String)
    party = Column(String)

class EuroVote(Base):
    __tablename__ = "euro_votes"

    id = Column(String, primary_key=True) # XML Identifier
    title = Column(Text)
    date = Column(Date)
    votes_for = Column(Integer)
    votes_against = Column(Integer)
    votes_abstain = Column(Integer)
    importance_score = Column(Integer)
    is_key_vote = Column(Boolean)
    term = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())

class EuroVoteResult(Base):
    __tablename__ = "euro_vote_results"

    id = Column(Integer, primary_key=True, index=True)
    vote_id = Column(String, ForeignKey("euro_votes.id"))
    mep_id = Column(Integer) # Linked to EuroMEP.api_id technically, but strict FK might fail if not synced
    vote = Column(String)
