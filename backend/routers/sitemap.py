from fastapi import APIRouter, Response
from typing import List
from backend.models import Vote, MP, LegislativeProcess
import logging
from datetime import datetime

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
        <sitemap>
            <loc>{DOMAIN}/sitemap-processes.xml</loc>
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
            lastmod = v.date.strftime('%Y-%m-%d') if v.date else ''
            url = f"""
    <url>
        <loc>{DOMAIN}/glosowania/{v.term}/{v.sitting}/{v.voting_number}</loc>
        <lastmod>{lastmod}</lastmod>
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
            url = f"""
    <url>
        <loc>{DOMAIN}/poslowie/{mp.id}</loc>
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

@router.get("/sitemap-processes.xml", response_class=Response)
def get_sitemap_processes():
    """
    Returns sitemap for Legislative Processes.
    """
    session = SessionLocal()
    try:
        processes = session.query(LegislativeProcess.id, LegislativeProcess.updated_at).all()
        
        urls = []
        for p in processes:
            lastmod = p.updated_at.strftime('%Y-%m-%d') if p.updated_at else ''
            url = f"""
    <url>
        <loc>{DOMAIN}/procesy/{p.id}</loc>
        {f'<lastmod>{lastmod}</lastmod>' if lastmod else ''}
        <changefreq>daily</changefreq>
    </url>"""
            urls.append(url)
            
        xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    {''.join(urls)}
</urlset>"""
        return Response(content=xml_content, media_type="application/xml")
    finally:
        session.close()

@router.get("/sitemap-static.xml", response_class=Response)
def get_sitemap_static():
    """
    Returns sitemap for static pages.
    """
    static_pages = [
        "/", "/poslowie", "/partie", "/glosowania", "/rankingi", 
        "/majatek", "/wypowiedzi", "/interpelacje", "/projekty", 
        "/kategorie", "/metodologia", "/kontakt", "/porownywarka", "/o-projekcie"
    ]
    
    urls = []
    for path in static_pages:
        url = f"""
    <url>
        <loc>{DOMAIN}{path}</loc>
        <changefreq>daily</changefreq>
        <priority>{"0.8" if path == "/" else "0.7"}</priority>
    </url>"""
        urls.append(url)
        
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    {''.join(urls)}
</urlset>"""
    return Response(content=xml_content, media_type="application/xml")
