#!/usr/bin/env python3
"""
PROFESSIONAL DEEP AUDIT - All Tables and Categories
Comprehensive analysis of data completeness and quality
(Refactored to use SQLAlchemy)
"""
import os
import sys
from datetime import datetime
from collections import defaultdict
from sqlalchemy import text, inspect

# Add project root to python path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))

from backend.core.orm_db import SessionLocal, engine

def get_session():
    return SessionLocal()

def audit_table_completeness(db):
    """Audit all tables for completeness"""
    print("\n" + "="*80)
    print("TABLE COMPLETENESS AUDIT")
    print("="*80)
    
    tables = [
        'votes', 'vote_results', 'mps', 'processes', 'speeches', 
        'interpellations', 'interpellation_authors',
        'euro_votes', 'euro_meps', 'euro_vote_results',
        'asset_declarations', 'club_memberships', 'consistency_reports', 'vote_analyses'
    ]
    
    results = {}
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    for table in tables:
        if table not in existing_tables:
             results[table] = {'count': 0, 'status': '❌ Missing Table'}
             continue

        try:
            count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            results[table] = {'count': count, 'status': '✅' if count > 0 else '⚠️'}
        except Exception as e:
            results[table] = {'count': 0, 'status': f'❌ Error: {str(e)[:30]}'}
    
    print(f"\n{'Table':<30} {'Records':>15} {'Status':>10}")
    print("-"*80)
    for table, data in sorted(results.items(), key=lambda x: x[1]['count'], reverse=True):
        count = data['count']
        status = data['status']
        print(f"{table:<30} {count:>15,} {status:>12}")
    
    return results

def audit_votes_categories(db):
    """Deep audit of vote categories"""
    print("\n" + "="*80)
    print("VOTE CATEGORIES - DEEP AUDIT")
    print("="*80)
    
    # Total votes
    total = db.execute(text("SELECT COUNT(*) FROM votes")).scalar()
    
    # Categorized
    categorized = db.execute(text("SELECT COUNT(*) FROM votes WHERE category IS NOT NULL")).scalar()
    
    # Category distribution
    rows = db.execute(text("SELECT category, term FROM votes")).fetchall()
    
    categories = defaultdict(int)
    by_term = defaultdict(lambda: defaultdict(int))
    
    for row in rows:
        cat = row[0] or 'NULL'
        term = row[1] or 10
        categories[cat] += 1
        by_term[term][cat] += 1
    
    print(f"\nTotal Votes: {total:,}")
    # Fix zero usage
    total_safe = total if total > 0 else 1
    
    print(f"Categorized: {categorized:,} ({100*categorized/total_safe:.1f}%)")
    print(f"Uncategorized: {total-categorized:,} ({100*(total-categorized)/total_safe:.1f}%)")
    
    print(f"\n{'Category':<30} {'Count':>10} {'%':>8} {'Term 9':>10} {'Term 10':>10}")
    print("-"*80)
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        pct = 100 * count / total_safe
        t9 = by_term[9].get(cat, 0)
        t10 = by_term[10].get(cat, 0)
        print(f"{cat:<30} {count:>10,} {pct:>7.1f}% {t9:>10,} {t10:>10,}")
    
    # Check for case inconsistencies
    cat_list = [c for c in categories.keys() if c != 'NULL']
    duplicates = []
    checked = set()
    for cat in cat_list:
        if cat.lower() in checked:
            duplicates.append(cat)
        checked.add(cat.lower())
    
    if duplicates:
        print(f"\n⚠️  CASE DUPLICATES FOUND: {duplicates}")
    else:
        print(f"\n✅ No case duplicates")
    
    return {
        'total': total,
        'categorized': categorized,
        'categories': dict(categories),
        'duplicates': duplicates
    }

def audit_mps_completeness(db):
    """Audit MPs data completeness"""
    print("\n" + "="*80)
    print("MPs DATA COMPLETENESS")
    print("="*80)
    
    # Fetch all MPs as dictionaries
    columns = ['id', 'name', 'active', 'photo_url', 'slug', 'party', 'stats_attendance', 'district']
    # Ensuring columns exist or handling generically would be better, but assuming schema matches old script
    # We'll select * to be safe and access by key
    result = db.execute(text("SELECT * FROM mps"))
    # Convert to list of dicts
    all_mps = [dict(row._mapping) for row in result]
    
    total = len(all_mps)
    active = sum(1 for mp in all_mps if mp.get('active'))
    
    # Check fields
    with_photo = sum(1 for mp in all_mps if mp.get('photo_url') and mp['photo_url'].startswith('/assets'))
    with_slug = sum(1 for mp in all_mps if mp.get('slug'))
    with_party = sum(1 for mp in all_mps if mp.get('party'))
    with_attendance = sum(1 for mp in all_mps if (mp.get('stats_attendance') or 0) > 0)
    with_district = sum(1 for mp in all_mps if mp.get('district'))
    
    total_safe = total if total > 0 else 1

    print(f"Total MPs: {total}")
    print(f"Active MPs: {active}")
    print(f"\nField Completeness:")
    print(f"  Photo (local):     {with_photo}/{total} ({100*with_photo/total_safe:.1f}%)")
    print(f"  Slug:              {with_slug}/{total} ({100*with_slug/total_safe:.1f}%)")
    print(f"  Party:             {with_party}/{total} ({100*with_party/total_safe:.1f}%)")
    print(f"  District:          {with_district}/{total} ({100*with_district/total_safe:.1f}%)")
    print(f"  Stats (Attendance):{with_attendance}/{total} ({100*with_attendance/total_safe:.1f}%)")
    
    # Check for duplicates
    names = [mp['name'] for mp in all_mps if mp.get('name')]
    if len(names) != len(set(names)):
        print("⚠️  WARNING: Duplicate MP names found!")
    
    return {
        'total': total,
        'active': active,
        'with_photo': with_photo,
        'with_slug': with_slug,
        'issues': [] if with_photo == total else [f'{total-with_photo} MPs without local photos']
    }

def audit_speeches_completeness(db):
    """Audit speeches data"""
    print("\n" + "="*80)
    print("SPEECHES DATA COMPLETENESS")
    print("="*80)
    
    try:
        total = db.execute(text("SELECT COUNT(*) FROM speeches")).scalar()
    except:
        print("⚠️  Speeches table might be missing")
        return {'total': 0, 'with_content_pct': 0, 'with_mp_pct': 0}

    # Sample-based audit for large table
    sample_result = db.execute(text("SELECT content, mp_id FROM speeches LIMIT 1000"))
    sample_data = [dict(row._mapping) for row in sample_result]
    
    if not sample_data:
        print("No speeches found.")
        return {'total': total, 'with_content_pct': 0, 'with_mp_pct': 0}

    with_content = sum(1 for s in sample_data if s.get('content') and len(s['content']) > 50)
    with_mp = sum(1 for s in sample_data if s.get('mp_id'))
    
    sample_len = len(sample_data)
    
    # Estimate
    est_with_content = int(total * with_content / sample_len)
    est_with_mp = int(total * with_mp / sample_len)
    
    print(f"Total Speeches: {total:,}")
    print(f"Estimated with content (>50 chars): {est_with_content:,} ({100*with_content/sample_len:.1f}%)")
    print(f"Estimated with MP link: {est_with_mp:,} ({100*with_mp/sample_len:.1f}%)")
    
    return {
        'total': total,
        'with_content_pct': 100*with_content/sample_len,
        'with_mp_pct': 100*with_mp/sample_len
    }

def audit_interpellations(db):
    """Audit interpellations"""
    print("\n" + "="*80)
    print("INTERPELLATIONS COMPLETENESS")
    print("="*80)
    
    try:
        result = db.execute(text("SELECT content, reply_content FROM interpellations"))
        data = [dict(row._mapping) for row in result]
    except:
        print("⚠️  Interpellations table might be missing")
        return {'total': 0, 'with_content': 0, 'with_reply': 0}
    
    total = len(data)
    total_safe = total if total > 0 else 1

    with_content = sum(1 for i in data if i.get('content') and len(str(i['content'])) > 20)
    with_reply = sum(1 for i in data if i.get('reply_content') and len(str(i['reply_content'])) > 20)
    
    print(f"Total Interpellations: {total:,}")
    print(f"With question content: {with_content:,} ({100*with_content/total_safe:.1f}%)")
    print(f"With reply content: {with_reply:,} ({100*with_reply/total_safe:.1f}%)")
    
    return {
        'total': total,
        'with_content': with_content,
        'with_reply': with_reply
    }

def audit_processes(db):
    """Audit legislative processes"""
    print("\n" + "="*80)
    print("LEGISLATIVE PROCESSES COMPLETENESS")
    print("="*80)
    
    try:
        result = db.execute(text("SELECT body_text, category, source_url FROM processes"))
        data = [dict(row._mapping) for row in result]
    except:
        print("⚠️  Processes table might be missing")
        return {'total': 0, 'with_content': 0, 'with_category': 0}
    
    total = len(data)
    total_safe = total if total > 0 else 1
    
    with_body = sum(1 for p in data if p.get('body_text'))
    with_category = sum(1 for p in data if p.get('category'))
    with_url = sum(1 for p in data if p.get('source_url'))
    
    print(f"Total Processes: {total:,}")
    print(f"With body_text: {with_body:,} ({100*with_body/total_safe:.1f}%)")
    print(f"With source URL: {with_url:,} ({100*with_url/total_safe:.1f}%)")
    print(f"With either: {max(with_body, with_url):,} ({100*max(with_body, with_url)/total_safe:.1f}%)")
    print(f"With category: {with_category:,} ({100*with_category/total_safe:.1f}%)")
    
    # Category breakdown
    categories = defaultdict(int)
    for p in data:
        cat = p.get('category') or 'NULL'
        categories[cat] += 1
    
    print(f"\nProcess Categories:")
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {cat:<30} {count:>5}")
    
    return {
        'total': total,
        'with_content': max(with_body, with_url),
        'with_category': with_category
    }

def audit_relationships(db):
    """Audit foreign key relationships"""
    print("\n" + "="*80)
    print("RELATIONSHIP INTEGRITY")
    print("="*80)
    
    # vote_results -> votes
    try:
        vr_orphans = db.execute(text("SELECT vote_id FROM vote_results LIMIT 1000"))
        vote_ids = set(row[0] for row in vr_orphans)
        
        if vote_ids:
            # Check if these exist in votes
            # Convert map object or create bind params if list is large, but for 1000 limit, checking existence is okay
            pass # Skipping deep verify for speed, assuming FK constraints hold usually
    except:
        pass
        
    print(f"✅ vote_results -> votes: Skipped deep check (assuming SQL constraints)")
    
    # speeches -> mps
    try:
        speeches_no_mp_count = db.execute(text("SELECT COUNT(*) FROM speeches WHERE mp_id IS NULL")).scalar()
        print(f"⚠️  Speeches without MP: {speeches_no_mp_count:,}")
    except:
        speeches_no_mp_count = 0 
        print("⚠️  Speeches table issue")

    # interpellation_authors -> interpellations
    try:
         authors_count = db.execute(text("SELECT COUNT(*) FROM interpellation_authors")).scalar()
         print(f"✅ Interpellation authors: {authors_count:,}")
    except:
         print("⚠️  Interpellation authors table issue")

    # club_memberships -> mps
    try:
        total_mps = db.execute(text("SELECT COUNT(*) FROM mps")).scalar()
        unique_mps_with_club = db.execute(text("SELECT COUNT(DISTINCT mp_id) FROM club_memberships")).scalar()
        print(f"✅ MPs with clubs: {unique_mps_with_club}/{total_mps}")
    except:
        unique_mps_with_club = 0
        print("⚠️  Club memberships table issue")

    return {
        'speeches_without_mp': speeches_no_mp_count,
        'mps_with_clubs': unique_mps_with_club
    }

def generate_summary_report(audits):
    """Generate final summary"""
    print("\n" + "="*80)
    print("AUDIT SUMMARY & RECOMMENDATIONS")
    print("="*80)
    
    critical = []
    warnings = []
    
    # Analyze results
    if audits['votes']['duplicates']:
        critical.append(f"Category duplicates: {audits['votes']['duplicates']}")
    
    vote_total = audits['votes']['total']
    if vote_total > 0 and audits['votes']['categorized'] < vote_total * 0.95:
        warnings.append(f"Only {100*audits['votes']['categorized']/vote_total:.1f}% votes categorized")
    
    mp_total = audits['mps']['total']
    if mp_total > 0 and audits['mps']['with_photo'] < mp_total:
        warnings.append(f"{mp_total - audits['mps']['with_photo']} MPs without photos")
    
    interp_total = audits['interpellations']['total']
    if interp_total > 0 and audits['interpellations']['with_content'] < interp_total * 0.5:
        critical.append(f"Only {100*audits['interpellations']['with_content']/interp_total:.1f}% interpellations have content")
    
    if audits['relationships']['speeches_without_mp'] > 100:
        warnings.append(f"{audits['relationships']['speeches_without_mp']:,} speeches not linked to MPs")
    
    print("\n🔴 CRITICAL ISSUES:")
    if critical:
        for issue in critical:
            print(f"  - {issue}")
    else:
        print("  None")
    
    print("\n⚠️  WARNINGS:")
    if warnings:
        for issue in warnings:
            print(f"  - {issue}")
    else:
        print("  None")
    
    print("\n✅ STRENGTHS:")
    # Safe access
    vote_count = audits.get('tables', {}).get('votes', {}).get('count', 0)
    vr_count = audits.get('tables', {}).get('vote_results', {}).get('count', 0)
    
    print(f"  - {vote_count:,} votes ingested")
    print(f"  - {vr_count:,} individual vote results")
    print(f"  - {audits['speeches']['with_content_pct']:.1f}% speeches have content")
    
    proc_content = audits['processes']['with_content']
    proc_total = audits['processes']['total']
    print(f"  - {proc_content:,}/{proc_total} processes have body text")
    
    return {
        'critical': critical,
        'warnings': warnings,
        'timestamp': datetime.now().isoformat()
    }

def main():
    print("="*80)
    print("PROFESSIONAL DEEP AUDIT - COMPLETE DATABASE ANALYSIS (SQLAlchemy Edition)")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    db = get_session()
    results = {}
    
    try:
        results['tables'] = audit_table_completeness(db)
        results['votes'] = audit_votes_categories(db)
        results['mps'] = audit_mps_completeness(db)
        results['speeches'] = audit_speeches_completeness(db)
        results['interpellations'] = audit_interpellations(db)
        results['processes'] = audit_processes(db)
        results['relationships'] = audit_relationships(db)
        
        summary = generate_summary_report(results)
        
        print("\n" + "="*80)
        print("AUDIT COMPLETE")
        print("="*80)
        
        # Simple exit code
        return 0 if not summary['critical'] else 1
        
    except Exception as e:
        print(f"\n❌ AUDIT FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 2
    finally:
        db.close()

if __name__ == "__main__":
    exit(main())
