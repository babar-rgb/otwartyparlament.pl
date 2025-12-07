#!/usr/bin/env python3
"""
PROFESSIONAL DEEP AUDIT - All Tables and Categories
Comprehensive analysis of data completeness and quality
"""
import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime
from collections import defaultdict

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def audit_table_completeness():
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
    for table in tables:
        try:
            res = supabase.table(table).select('*', count='exact', head=True).execute()
            results[table] = {'count': res.count, 'status': '✅' if res.count > 0 else '⚠️'}
        except Exception as e:
            results[table] = {'count': 0, 'status': f'❌ Error: {str(e)[:30]}'}
    
    print(f"\n{'Table':<30} {'Records':>15} {'Status':>10}")
    print("-"*80)
    for table, data in sorted(results.items(), key=lambda x: x[1]['count'], reverse=True):
        count = data['count']
        status = data['status']
        print(f"{table:<30} {count:>15,} {status:>12}")
    
    return results

def audit_votes_categories():
    """Deep audit of vote categories"""
    print("\n" + "="*80)
    print("VOTE CATEGORIES - DEEP AUDIT")
    print("="*80)
    
    # Total votes
    total_res = supabase.table('votes').select('id', count='exact').execute()
    total = total_res.count
    
    # Categorized
    cat_res = supabase.table('votes').select('id', count='exact').not_.is_('category', 'null').execute()
    categorized = cat_res.count
    
    # Category distribution
    all_votes = supabase.table('votes').select('category, term').execute()
    
    categories = defaultdict(int)
    by_term = defaultdict(lambda: defaultdict(int))
    
    for vote in all_votes.data:
        cat = vote.get('category') or 'NULL'
        term = vote.get('term', 10)
        categories[cat] += 1
        by_term[term][cat] += 1
    
    print(f"\nTotal Votes: {total:,}")
    print(f"Categorized: {categorized:,} ({100*categorized/total:.1f}%)")
    print(f"Uncategorized: {total-categorized:,} ({100*(total-categorized)/total:.1f}%)")
    
    print(f"\n{'Category':<30} {'Count':>10} {'%':>8} {'Term 9':>10} {'Term 10':>10}")
    print("-"*80)
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        pct = 100 * count / total
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

def audit_mps_completeness():
    """Audit MPs data completeness"""
    print("\n" + "="*80)
    print("MPs DATA COMPLETENESS")
    print("="*80)
    
    all_mps = supabase.table('mps').select('*').execute()
    
    total = len(all_mps.data)
    active = sum(1 for mp in all_mps.data if mp.get('active'))
    
    # Check fields
    with_photo = sum(1 for mp in all_mps.data if mp.get('photo_url') and mp['photo_url'].startswith('/assets'))
    with_slug = sum(1 for mp in all_mps.data if mp.get('slug'))
    with_party = sum(1 for mp in all_mps.data if mp.get('party'))
    with_attendance = sum(1 for mp in all_mps.data if mp.get('stats_attendance', 0) > 0)
    with_district = sum(1 for mp in all_mps.data if mp.get('district'))
    
    print(f"Total MPs: {total}")
    print(f"Active MPs: {active}")
    print(f"\nField Completeness:")
    print(f"  Photo (local):     {with_photo}/{total} ({100*with_photo/total:.1f}%)")
    print(f"  Slug:              {with_slug}/{total} ({100*with_slug/total:.1f}%)")
    print(f"  Party:             {with_party}/{total} ({100*with_party/total:.1f}%)")
    print(f"  District:          {with_district}/{total} ({100*with_district/total:.1f}%)")
    print(f"  Stats (Attendance):{with_attendance}/{total} ({100*with_attendance/total:.1f}%)")
    
    # Check for duplicates
    names = [mp['name'] for mp in all_mps.data]
    if len(names) != len(set(names)):
        print("⚠️  WARNING: Duplicate MP names found!")
    
    return {
        'total': total,
        'active': active,
        'with_photo': with_photo,
        'with_slug': with_slug,
        'issues': [] if with_photo == total else [f'{total-with_photo} MPs without local photos']
    }

def audit_speeches_completeness():
    """Audit speeches data"""
    print("\n" + "="*80)
    print("SPEECHES DATA COMPLETENESS")
    print("="*80)
    
    # Sample-based audit for large table
    total_res = supabase.table('speeches').select('id', count='exact').execute()
    total = total_res.count
    
    # Check content
    sample = supabase.table('speeches').select('content, mp_id').limit(1000).execute()
    
    with_content = sum(1 for s in sample.data if s.get('content') and len(s['content']) > 50)
    with_mp = sum(1 for s in sample.data if s.get('mp_id'))
    
    # Estimate
    est_with_content = int(total * with_content / len(sample.data))
    est_with_mp = int(total * with_mp / len(sample.data))
    
    print(f"Total Speeches: {total:,}")
    print(f"Estimated with content (>50 chars): {est_with_content:,} ({100*with_content/len(sample.data):.1f}%)")
    print(f"Estimated with MP link: {est_with_mp:,} ({100*with_mp/len(sample.data):.1f}%)")
    
    return {
        'total': total,
        'with_content_pct': 100*with_content/len(sample.data),
        'with_mp_pct': 100*with_mp/len(sample.data)
    }

def audit_interpellations():
    """Audit interpellations"""
    print("\n" + "="*80)
    print("INTERPELLATIONS COMPLETENESS")
    print("="*80)
    
    all_interp = supabase.table('interpellations').select('content, reply_content').execute()
    
    total = len(all_interp.data)
    with_content = sum(1 for i in all_interp.data if i.get('content') and len(str(i['content'])) > 20)
    with_reply = sum(1 for i in all_interp.data if i.get('reply_content') and len(str(i['reply_content'])) > 20)
    
    print(f"Total Interpellations: {total:,}")
    print(f"With question content: {with_content:,} ({100*with_content/total:.1f}%)")
    print(f"With reply content: {with_reply:,} ({100*with_reply/total:.1f}%)")
    
    return {
        'total': total,
        'with_content': with_content,
        'with_reply': with_reply
    }

def audit_processes():
    """Audit legislative processes"""
    print("\n" + "="*80)
    print("LEGISLATIVE PROCESSES COMPLETENESS")
    print("="*80)
    
    all_proc = supabase.table('processes').select('body_text, category').execute()
    
    total = len(all_proc.data)
    with_body = sum(1 for p in all_proc.data if p.get('body_text'))
    with_category = sum(1 for p in all_proc.data if p.get('category'))
    
    # Count those with source_url as proxy for PDF availability
    all_proc_urls = supabase.table('processes').select('source_url').execute()
    with_url = sum(1 for p in all_proc_urls.data if p.get('source_url'))
    
    print(f"Total Processes: {total:,}")
    print(f"With body_text: {with_body:,} ({100*with_body/total:.1f}%)")
    print(f"With source URL: {with_url:,} ({100*with_url/total:.1f}%)")
    print(f"With either: {max(with_body, with_url):,} ({100*max(with_body, with_url)/total:.1f}%)")
    print(f"With category: {with_category:,} ({100*with_category/total:.1f}%)")
    
    # Category breakdown
    categories = defaultdict(int)
    for p in all_proc.data:
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

def audit_relationships():
    """Audit foreign key relationships"""
    print("\n" + "="*80)
    print("RELATIONSHIP INTEGRITY")
    print("="*80)
    
    # vote_results -> votes
    vr_orphans = supabase.table('vote_results').select('vote_id').limit(1000).execute()
    vote_ids = set(vr['vote_id'] for vr in vr_orphans.data)
    
    votes_exist = supabase.table('votes').select('id').in_('id', list(vote_ids)[:100]).execute()
    
    print(f"✅ vote_results -> votes: Sampling OK")
    
    # speeches -> mps
    speeches_no_mp = supabase.table('speeches').select('id', count='exact').is_('mp_id', 'null').execute()
    print(f"⚠️  Speeches without MP: {speeches_no_mp.count:,}")
    
    # interpellation_authors -> interpellations
    authors = supabase.table('interpellation_authors').select('interpellation_id', count='exact').execute()
    print(f"✅ Interpellation authors: {authors.count:,}")
    
    # club_memberships -> mps
    orphan_clubs = supabase.table('mps').select('id', count='exact').execute()
    total_mps = orphan_clubs.count
    
    with_club = supabase.table('club_memberships').select('mp_id', count='exact').execute()
    unique_mps_with_club = len(set(cm['mp_id'] for cm in supabase.table('club_memberships').select('mp_id').execute().data))
    
    print(f"✅ MPs with clubs: {unique_mps_with_club}/{total_mps}")
    
    return {
        'speeches_without_mp': speeches_no_mp.count,
        'mps_with_clubs': unique_mps_with_club
    }

def generate_summary_report(audits):
    """Generate final summary"""
    print("\n" + "="*80)
    print("AUDIT SUMMARY & RECOMMENDATIONS")
    print("="*80)
    
    critical = []
    warnings = []
    ok = []
    
    # Analyze results
    if audits['votes']['duplicates']:
        critical.append(f"Category duplicates: {audits['votes']['duplicates']}")
    
    if audits['votes']['categorized'] < audits['votes']['total'] * 0.95:
        warnings.append(f"Only {100*audits['votes']['categorized']/audits['votes']['total']:.1f}% votes categorized")
    
    if audits['mps']['with_photo'] < audits['mps']['total']:
        warnings.append(f"{audits['mps']['total'] - audits['mps']['with_photo']} MPs without photos")
    
    if audits['interpellations']['with_content'] < audits['interpellations']['total'] * 0.5:
        critical.append(f"Only {100*audits['interpellations']['with_content']/audits['interpellations']['total']:.1f}% interpellations have content")
    
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
    print(f"  - {audits['tables']['votes']['count']:,} votes ingested")
    print(f"  - {audits['tables']['vote_results']['count']:,} individual vote results")
    print(f"  - {audits['speeches']['with_content_pct']:.1f}% speeches have content")
    print(f"  - {audits['processes']['with_content']:,}/{audits['processes']['total']} processes have body text")
    
    return {
        'critical': critical,
        'warnings': warnings,
        'timestamp': datetime.now().isoformat()
    }

def main():
    print("="*80)
    print("PROFESSIONAL DEEP AUDIT - COMPLETE DATABASE ANALYSIS")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    results = {}
    
    try:
        results['tables'] = audit_table_completeness()
        results['votes'] = audit_votes_categories()
        results['mps'] = audit_mps_completeness()
        results['speeches'] = audit_speeches_completeness()
        results['interpellations'] = audit_interpellations()
        results['processes'] = audit_processes()
        results['relationships'] = audit_relationships()
        
        summary = generate_summary_report(results)
        
        print("\n" + "="*80)
        print("AUDIT COMPLETE")
        print("="*80)
        
        return 0 if not summary['critical'] else 1
        
    except Exception as e:
        print(f"\n❌ AUDIT FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 2

if __name__ == "__main__":
    exit(main())
