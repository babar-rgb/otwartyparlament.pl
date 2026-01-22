from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Text, Float, DateTime
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.core.orm_db import Base

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
    
    # Biography / details
    birth_date = Column(Date, nullable=True)
    birth_location = Column(String, nullable=True)
    profession = Column(String, nullable=True)
    education_level = Column(String, nullable=True)
    education_history = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True) # Stores {twitter, facebook, etc}
    email = Column(String, nullable=True)
    biography = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())

    votes = relationship("VoteResult", back_populates="mp")
    bills = relationship("Bill", back_populates="mp")
    interpellations = relationship("Interpellation", secondary="interpellation_authors", back_populates="authors")

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
    vector_embedding = Column(Vector(384), nullable=True) # 384-dim vector for semantic search
    search_vector = Column(TSVECTOR, nullable=True) # Postgres Full Text Search
    print_number = Column(String, index=True, nullable=True) # Extracted from title or API
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True, index=True)
    
    # SEO Fields (Added Jan 2026)
    street_title = Column(String, nullable=True)
    meta_description = Column(String, nullable=True)
    seo_keywords = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())

    results = relationship("VoteResult", back_populates="vote")
    analysis = relationship("VoteAnalysis", uselist=False, back_populates="vote")
    bill = relationship("Bill", back_populates="votes")

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
    process_id = Column(String, index=True) # e.g. RPS-123
    number = Column(String, index=True) # print number
    title = Column(Text)
    description = Column(Text, nullable=True)
    date = Column(Date)
    status = Column(String)
    type = Column(String, index=True) # poselski, rzadowy
    url = Column(String, nullable=True)
    mp_id = Column(Integer, ForeignKey("mps.id"), nullable=True)
    topic = Column(String, index=True, nullable=True) # AI classified
    importance = Column(Integer, default=0) # AI calculated 1-10
    vector_embedding = Column(Vector(384), nullable=True) # 384-dim vector
    content = Column(Text, nullable=True) # Full text extraction from PDF
    term = Column(Integer, index=True, default=10) # Sejm Term
    created_at = Column(DateTime, server_default=func.now())

    mp = relationship("MP", back_populates="bills")
    analysis = relationship("BillAnalysis", uselist=False, back_populates="bill")
    votes = relationship("Vote", back_populates="bill")

class BillAnalysis(Base):
    __tablename__ = "bill_analyses"

    bill_id = Column(Integer, ForeignKey("bills.id"), primary_key=True)
    summary = Column(Text)
    pros = Column(JSONB) # List of strings
    cons = Column(JSONB) # List of strings
    impact = Column(Text, nullable=True)
    importance = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    bill = relationship("Bill", back_populates="analysis")

class Interpellation(Base):
    __tablename__ = "interpellations"

    id = Column(Integer, primary_key=True, index=True)
    # mp_id removed as it doesn't exist in DB
    title = Column(String)
    sent_date = Column(Date)
    last_modified = Column(DateTime)
    raw_data = Column(JSONB)
    content = Column(Text)
    reply_content = Column(Text)

    authors = relationship("MP", secondary="interpellation_authors", back_populates="interpellations")

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

class CommitteeSitting(Base):
    __tablename__ = "committee_sittings"

    id = Column(Integer, primary_key=True, index=True)
    committee_code = Column(String, ForeignKey("committees.code"), index=True)
    sitting_number = Column(Integer)
    date = Column(Date, index=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    room = Column(String)
    status = Column(String, index=True)
    is_remote = Column(Boolean, default=False)
    is_closed = Column(Boolean, default=False)
    video_url = Column(String)
    agenda = Column(JSONB)
    term = Column(Integer)
    summary = Column(Text, nullable=True) # AI generated narrative summary
    created_at = Column(DateTime, server_default=func.now())

class AssetDeclaration(Base):
    __tablename__ = "asset_declarations"

    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mps.id"))
    year = Column(String)
    pdf_url = Column(String)
    file_path = Column(String)
    parsed_content = Column(JSONB)
    summary = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    name_pl = Column(String)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    level = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())


class VoteAnalysis(Base):
    __tablename__ = "vote_analyses"
    
    vote_id = Column(Integer, ForeignKey("votes.id"), primary_key=True)
    summary = Column(Text) # Simple summary for citizens
    summary_expert = Column(Text, nullable=True) # Detailed summary with citations
    pros = Column(JSONB)
    cons = Column(JSONB)
    analysis_metadata = Column(JSONB, nullable=True) # Confidence score, expert comments, etc.
    mind_map = Column(Text, nullable=True)
    procedural_context = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    vote = relationship("Vote", back_populates="analysis")


class MPRelation(Base):
    __tablename__ = "mp_relations"
    
    id = Column(Integer, primary_key=True, index=True)
    mp_id_a = Column(Integer, ForeignKey("mps.id"))
    mp_id_b = Column(Integer, ForeignKey("mps.id"))
    similarity_score = Column(Float)
    relation_type = Column(String) # 'ideological_alignment'
    created_at = Column(DateTime, server_default=func.now())

class MPStat(Base):
    __tablename__ = "mp_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mps.id"))
    stat_key = Column(String, index=True)
    stat_value = Column(String)
    updated_at = Column(DateTime, server_default=func.now())

class Speech(Base):
    __tablename__ = "speeches"
    
    id = Column(Integer, primary_key=True, index=True)
    mp_id = Column(Integer, ForeignKey("mps.id"))
    sitting = Column(Integer)
    date = Column(Date)
    speaker_name = Column(String)
    content = Column(Text)
    topic = Column(String, nullable=True)
    statement_num = Column(Integer)
    term = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    
    mp = relationship("MP")





class EuroMEP(Base):
    __tablename__ = "euro_meps"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    api_id = Column(Integer, unique=True)
    full_name = Column(String)
    country = Column(String)
    national_party = Column(String)
    eu_group = Column(String)
    photo_url = Column(String)
    email = Column(String)
    active = Column(Boolean, default=True)
    term = Column(Integer)
    rebellion_rate = Column(Float, default=0.0)
    attendance_score = Column(Float, default=0.0)

class EuroVote(Base):
    __tablename__ = "euro_votes"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    date = Column(DateTime)
    votes_for = Column(Integer)
    votes_against = Column(Integer)
    votes_abstain = Column(Integer)
    importance_score = Column(Integer)
    is_key_vote = Column(Boolean, default=False)
    vector_embedding = Column(Vector(384), nullable=True) # 384-dim vector
    term = Column(Integer)
    topic_tag = Column(String)

class EuroVoteResult(Base):
    __tablename__ = "euro_vote_results"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    vote_id = Column(String, ForeignKey("euro_votes.id"))
    mep_id = Column(Integer, ForeignKey("euro_meps.id"))
    vote = Column(String)


class SejmPrint(Base):
    __tablename__ = "sejm_prints"
    
    # number is the actual Primary Key in the legacy DB
    number = Column(String, primary_key=True, index=True) 
    title = Column(Text)
    summary = Column(Text, nullable=True)
    process_id = Column(String, nullable=True) # Linked process
    document_type = Column(String, nullable=True)
    attachments = Column(JSONB, nullable=True) # List of PDFs/HTMLs
    created_at = Column(DateTime, server_default=func.now())

class LegislativeProcess(Base):
    """
    Represents a unified Legislative Process (e.g. 'Budget 2026')
    that groups multiple physical Bills (Prints) and Votes together.
    Root ID Strategy.
    """
    __tablename__ = "legislative_processes"

    id = Column(String, primary_key=True) # UUID
    term = Column(Integer, index=True, default=10) # Sejm Term
    base_number = Column(String, index=True, nullable=True) # Primary print number
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String) # IN_PROGRESS, SIGNED, REJECTED, VETO
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    stages = relationship("LegislativeStage", back_populates="process", order_by="LegislativeStage.date")

class LegislativeStage(Base):
    """
    Represents a single step in the process (The Metro Station).
    e.g. 'Senate Resolution', 'Expose', 'First Reading'.
    """
    __tablename__ = "legislative_stages"

    id = Column(String, primary_key=True) # UUID
    process_id = Column(String, ForeignKey("legislative_processes.id"), index=True)
    stage_type = Column(String) # SUBMISSION, READING_1, READING_2, SENATE, VOTE, SIGNATURE
    title = Column(String) # Human readable title
    description = Column(Text, nullable=True)
    date = Column(Date, index=True)
    
    # Optional links to physical entities
    bill_number = Column(String, nullable=True) # Linked Bill/Print
    vote_id = Column(Integer, ForeignKey("votes.id"), nullable=True)

    process = relationship("LegislativeProcess", back_populates="stages")


class LegislativeLink(Base):
    """
    Represents a graph edge between two documents (The Graph Logic).
    Used for specific traceability (e.g. this Amendment modifies that Bill).
    """
    __tablename__ = "legislative_links"
    
    id = Column(Integer, primary_key=True, index=True)
    source_bill = Column(String, index=True) # Print Number
    target_bill = Column(String, index=True) # Print Number
    relation_type = Column(String) # AMENDS, REPORTS_ON, MERGES_INTO
    created_at = Column(DateTime, server_default=func.now())

class SittingAgenda(Base):
    __tablename__ = "sitting_agendas"
    
    id = Column(Integer, primary_key=True, index=True)
    sitting_number = Column(Integer, index=True)
    point_number = Column(Integer)
    title = Column(Text)
    description = Column(Text, nullable=True)
    print_number = Column(String, nullable=True)
    date = Column(Date, index=True)
    term = Column(Integer, default=10)
    created_at = Column(DateTime, server_default=func.now())

class SittingSummary(Base):
    __tablename__ = "sitting_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    term = Column(Integer)
    sitting_number = Column(Integer, unique=True)
    summary_md = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
