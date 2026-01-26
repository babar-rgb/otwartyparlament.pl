"""
Wealth Rankings API
Returns aggregated asset declaration data for MPs
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.core import orm_db as database

router = APIRouter()

@router.get("/api/wealth-rankings")
def get_wealth_rankings(db: Session = Depends(database.get_db)):
    """
    Get wealth rankings from parsed asset declarations
    """
    
    query = text("""
        SELECT 
            m.id as mp_id,
            m.first_name,
            m.last_name,
            m.club,
            m.photo_url,
            ad.year,
            COALESCE((ad.parsed_content->>'income')::numeric, 0) as income,
            COALESCE((ad.parsed_content->>'savings')::numeric, 0) as savings,
            COALESCE(jsonb_array_length(ad.parsed_content->'real_estate'), 0) as real_estate_count,
            COALESCE(jsonb_array_length(ad.parsed_content->'car'), 0) as vehicles_count,
            COALESCE((ad.parsed_content->>'net_worth')::numeric, 
                     (ad.parsed_content->>'income')::numeric, 0) as net_worth
        FROM mps m
        JOIN asset_declarations ad ON ad.mp_id = m.id
        WHERE ad.parsed_content IS NOT NULL
        AND ad.year = '2024'
        ORDER BY net_worth DESC NULLS LAST
        LIMIT 100
    """)
    
    result = db.execute(query)
    
    rankings = []
    for row in result:
        rankings.append({
            'mp_id': row[0],
            'first_name': row[1],
            'last_name': row[2],
            'club': row[3],
            'photo_url': row[4],
            'year': row[5],
            'income': float(row[6]) if row[6] else 0,
            'savings': float(row[7]) if row[7] else 0,
            'real_estate_count': int(row[8]) if row[8] else 0,
            'vehicles_count': int(row[9]) if row[9] else 0,
            'net_worth': float(row[10]) if row[10] else 0,
        })
    
    return rankings
