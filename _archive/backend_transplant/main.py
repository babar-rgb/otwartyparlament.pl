import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Dodajemy folder główny do ścieżki, żeby importy 'backend.xxx' działały
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.routers import trending, editor, mps, votes, legislative_processes, wealth

app = FastAPI(title="Truth Layer API - Dzial Zagraniczny")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trending.router, prefix="/api/trending", tags=["Trending"])
app.include_router(editor.router, prefix="/api/editor", tags=["Editorial"])
app.include_router(mps.router, prefix="/api/mps", tags=["MPs"])
app.include_router(votes.router, prefix="/api/votes", tags=["Votes"])
app.include_router(legislative_processes.router, prefix="/api/legislative_processes", tags=["Legislation"])
app.include_router(wealth.router, prefix="/api/wealth", tags=["Wealth"])

@app.get("/")
def read_root():
    return {"status": "Truth Layer API is fully operational"}
