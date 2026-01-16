from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend import models
from backend.core import orm_db as database
from backend.routers import mps, votes, general, processes, alignment, euro, personas, legislative_processes

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Sejm API", description="Otwarty Parlament Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(mps.router, prefix="/mps", tags=["MPs"])
app.include_router(votes.router, prefix="/votes", tags=["Votes"])
app.include_router(processes.router, prefix="/processes", tags=["Processes"]) # Existing processes (bills?)
app.include_router(legislative_processes.router, prefix="/legislative_processes", tags=["Legislative Processes"]) # New!
app.include_router(alignment.router, prefix="/alignment", tags=["Alignment"])
app.include_router(euro.router, prefix="/euro", tags=["Euro"])
app.include_router(personas.router, prefix="/personas", tags=["Personas"])
app.include_router(general.router, tags=["General"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Sejm API"}


@app.get("/health/ml")
def check_ml_health():
    from backend.services.embedding import embedding_service
    return {
        "status": "up" if embedding_service.is_available else "down",
        "model": embedding_service.MODEL_NAME,
        "lazy_loading": True
    }

@app.get("/sittings/latest/summary")
def get_latest_sitting_summary(term: int = 10):
    """Get the AI-generated summary for the latest sitting of a specific term."""
    from backend.core.db import db
    
    # Get latest summary for the specific term
    query = """
        SELECT term, sitting_number, summary_md, updated_at 
        FROM sitting_summaries 
        WHERE term = %s
        ORDER BY sitting_number DESC 
        LIMIT 1
    """
    summary = db.fetch_one(query, (term,))
    
    if not summary:
        return {"summary": None}
        
    return summary

@app.get("/sittings/summaries")
def get_all_sitting_summaries(term: int = 10):
    """Get all sitting summaries for a term."""
    from backend.core.db import db
    
    query = """
        SELECT id, term, sitting_number, summary_md, updated_at 
        FROM sitting_summaries 
        WHERE term = %s
        ORDER BY sitting_number DESC
    """
    return db.fetch_all(query, (term,))
