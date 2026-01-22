from fastapi import APIRouter, Response
from typing import List
from backend.core.orm_db import SessionLocal
from backend.models import Vote, MP
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

DOMAIN = "https://otwartyparlament.pl"  # Update with production domain

@router.get("/sitemap.xml", response_class=Response)
def get_sitemap_index():
    """
    Returns the Sitemap Index.
    """
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap>
            <loc>{DOMAIN}/sitemap-votes.xml</loc>
        </sitemap>
        <sitemap>
            <loc>{DOMAIN}/sitemap-mps.xml</loc>
        </sitemap>
        <sitemap>
            <loc>{DOMAIN}/sitemap-static.xml</loc>
        </sitemap>
    </sitemapindex>
    """
    return Response(content=xml_content, media_type="application/xml")

@router.get("/sitemap-votes.xml", response_class=Response)
def get_sitemap_votes():
    """
    Returns sitemap for all Votes.
    Strategy: Tier 1 (Important) vs Tier 2 (Procedural).
    """
    session = SessionLocal()
    try:
        # Get all votes (limit for safety if needed, but sitemaps can handle 50k URLs)
        votes = session.query(Vote.term, Vote.sitting, Vote.voting_number, Vote.date).all()
        
        urls = []
        for v in votes:
            # TODO: Add priority based on 'importance' logic in future
            url = f"""
    <url>
        <loc>{DOMAIN}/glosowania/{v.term}/{v.sitting}/{v.voting_number}</loc>
        <lastmod>{v.date}</lastmod>
        <changefreq>never</changefreq>
    </url>"""
            urls.append(url)
            
        xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    {''.join(urls)}
</urlset>"""
        return Response(content=xml_content, media_type="application/xml")
    finally:
        session.close()

@router.get("/sitemap-mps.xml", response_class=Response)
def get_sitemap_mps():
    """
    Returns sitemap for all MPs.
    """
    session = SessionLocal()
    try:
        mps = session.query(MP.id, MP.first_name, MP.last_name).filter(MP.active == True).all()
        
        urls = []
        for mp in mps:
            # Slugify name if frontend uses slugs, fallback to ID
            # Assuming /posel/ID structure for now, need to verify frontend routing
            url = f"""
    <url>
        <loc>{DOMAIN}/posel/{mp.id}</loc>
        <changefreq>weekly</changefreq>
    </url>"""
            urls.append(url)
            
        xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    {''.join(urls)}
</urlset>"""
        return Response(content=xml_content, media_type="application/xml")
    finally:
        session.close()
