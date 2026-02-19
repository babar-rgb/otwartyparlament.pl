from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from backend import models
from backend.core import orm_db as database
from backend.routers import (
    mps, votes, general, processes, alignment, euro, personas, 
    legislative_processes, sitemap, wealth, semantic_search, recommendations
)

# Load environment variables
load_dotenv()

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
# Include Routers
app.include_router(mps.router, prefix="/api/mps", tags=["MPs"])
app.include_router(votes.router, prefix="/api/votes", tags=["Votes"])
app.include_router(processes.router, prefix="/api/processes", tags=["Processes"])
app.include_router(legislative_processes.router, prefix="/api/legislative_processes", tags=["Legislative Processes"])
app.include_router(sitemap.router, tags=["Sitemap"]) # Root level for sitemap.xml
app.include_router(alignment.router, prefix="/api/alignment", tags=["Alignment"])
app.include_router(euro.router, prefix="/api/euro", tags=["Euro"])
app.include_router(personas.router, prefix="/api/personas", tags=["Personas"])
app.include_router(wealth.router, prefix="/api", tags=["Wealth"])
app.include_router(semantic_search.router, prefix="/api", tags=["Semantic Search"])
app.include_router(recommendations.router, prefix="/api", tags=["Personalization"])
app.include_router(general.router, prefix="/api", tags=["General"])

@app.get("/health")
def health_check():
    """
    Basic health check for the backend and database.
    
    Returns:
        dict: {"status": "ok", "database": "connected"} or error details.
    """
    from backend.core import orm_db as database
    from sqlalchemy import text
    try:
        # Check DB connectivity
        with database.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}, 503

@app.get("/health/ml")
def check_ml_health():
    """
    Check the status of the Machine Learning service/embeddings.
    
    Returns:
        dict: Status of the ML model loading.
    """
    from backend.services.embedding import embedding_service
    return {
        "status": "up" if embedding_service.is_available else "down",
        "model": embedding_service.MODEL_NAME,
        "lazy_loading": True
    }

@app.get("/api/sittings/latest/summary")
def get_latest_sitting_summary(term: int = 10):
    """Get the AI-generated summary for the latest sitting of a specific term."""
    from backend.core.db import db
    
    # Get latest summary for the specific term
    query = """
        SELECT term, sitting_number, summary_md, updated_at, top_votes
        FROM sitting_summaries 
        WHERE term = %s
        ORDER BY sitting_number DESC 
        LIMIT 1
    """
    summary = db.fetch_one(query, (term,))
    
    if not summary:
        return {"summary": None}
        
    return summary

@app.get("/api/sittings/summaries")
def get_all_sitting_summaries(term: int = 10):
    """Get all sitting summaries for a term."""
    from backend.core.db import db
    
    query = """
        SELECT id, term, sitting_number, summary_md, updated_at, top_votes 
        FROM sitting_summaries 
        WHERE term = %s
        ORDER BY sitting_number DESC
    """
    return db.fetch_all(query, (term,))
