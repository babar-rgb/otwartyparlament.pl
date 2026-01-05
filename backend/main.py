from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend import models
from backend.core import orm_db as database
from backend.routers import mps, votes, euro, general, processes

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Sejm Open Parliament API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(mps.router, prefix="/mps", tags=["mps"])
app.include_router(votes.router, prefix="/votes", tags=["votes"])
app.include_router(euro.router, prefix="/euro", tags=["euro"])
app.include_router(processes.router, prefix="/processes", tags=["processes"])
app.include_router(general.router, tags=["general"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Sejm API"}
