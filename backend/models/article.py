# article.py — Model SQLAlchemy dla artykułów/analiz portalu.
# Wzorzec identyczny jak mp.py i vote.py.

from sqlalchemy import Column, Integer, String, Text, JSON
from backend.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)  # np. 'border-law', 'manifesto'
    category = Column(String, index=True)            # np. 'MISJA', 'BEZPIECZEŃSTWO'
    date = Column(String)                            # np. '10 MAJA 2026'
    title = Column(String, nullable=False)
    excerpt = Column(Text)
    image = Column(String)                           # URL obrazka
    votes_yes = Column(Integer, default=0)
    votes_no = Column(Integer, default=0)
    verdict = Column(String)                         # np. 'PRZYJĘTO', 'ODRZUCONO', 'W TOKU'
    results_json = Column(JSON)                      # Dane głosów klubowych (jak w Vote)

    def __repr__(self):
        return f"<Article(slug='{self.slug}', category='{self.category}')>"
