from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend import models
from backend.core import orm_db as database
from backend.routers import mps, votes, general, processes, alignment

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
app.include_router(processes.router, prefix="/processes", tags=["Processes"])
app.include_router(alignment.router, prefix="/alignment", tags=["Alignment"])
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
