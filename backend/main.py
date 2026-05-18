from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.database import engine, Base

# Importujemy modele, aby Base.metadata je widziało
from backend.models.mp import MP
from backend.models.vote import Vote
from backend.models.headline import Headline
from backend.models.mp_vote import MPVote
from backend.models.article import Article
from backend.models.poza_kadrem import PozaKadrem  # Domknięcie długu: tabela raportów

# Tworzymy tabele w bazie danych (jeśli nie istnieją)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Truth Layer API",
    version="2.0.0",
    description="Profesjonalny backend dla projektu Dział Zagraniczny"
)

# Konfiguracja CORS - kluczowa dla rozmowy z frontendem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.api import mps, votes, articles, poza_kadrem

app.include_router(mps.router, prefix="/api/mps", tags=["MPs"])
app.include_router(votes.router, prefix="/api/votes", tags=["Votes"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(poza_kadrem.router, prefix="/api/poza-kadrem", tags=["PozaKadrem"])

@app.get("/")
def health_check():
    return {"status": "online", "version": "2.0.0", "engine": "SQLite"}
