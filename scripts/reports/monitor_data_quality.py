#!/usr/bin/env python3
"""
Data Quality Monitor - Day 1 Professional Grade
Automated checks for categories and club data integrity
"""
import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_category_quality():
    """Verify category normalization"""
    print("\n=== Category Quality Check ===")
    
    # Check for remaining case inconsistencies
    res = supabase.rpc('execute_sql', {
        'query': """
        SELECT category, COUNT(*) 
        FROM votes 
        WHERE category ~ '[a-z]' AND category != category::text
        GROUP BY category
        """
    }).execute()
    
    if res.data and len(res.data) > 0:
        print(f"⚠️  Found {len(res.data)} categories with case issues")
    else:
        print("✅ No case inconsistencies")
    
    # Check category distribution
    res = supabase.table('votes').select('category', count='exact').execute()
    total = res.count
    
    res2 = supabase.table('votes').select('category', count='exact').is_('category', 'null').execute()
    null_count = res2.count
    
    print(f"✅ Total votes: {total}")
    print(f"✅ Categorized: {total - null_count} ({100*(total-null_count)/total:.1f}%)")
    print(f"⚠️  Uncategorized: {null_count}")
    
    # Top categories
    res3 = supabase.rpc('execute_sql', {
        'query': """
        SELECT category, COUNT(*) as count 
        FROM votes 
        WHERE category IS NOT NULL
        GROUP BY category 
        ORDER BY count DESC 
        LIMIT 5
        """
    }).execute()
    
    print("\nTop 5 Categories:")
    for row in res3.data:
        print(f"  {row['category']}: {row['count']}")
    
    return True

def check_club_quality():
    """Verify club memberships integrity"""
    print("\n=== Club Memberships Quality Check ===")
    
    # Check all active MPs have clubs
    res = supabase.rpc('execute_sql', {
        'query': """
        SELECT COUNT(*) as count
        FROM mps m
        LEFT JOIN club_memberships cm ON m.id = cm.mp_id AND cm.to_date IS NULL
        WHERE m.active = true AND cm.id IS NULL
        """
    }).execute()
    
    orphaned = res.data[0]['count'] if res.data else 0
    
    if orphaned == 0:
        print("✅ All active MPs have club memberships")
    else:
        print(f"⚠️  {orphaned} active MPs without club")
    
    # Check for overlapping memberships
    res2 = supabase.rpc('execute_sql', {
        'query': """
        SELECT mp_id, COUNT(*) as club_count
        FROM club_memberships
        WHERE to_date IS NULL
        GROUP BY mp_id
        HAVING COUNT(*) > 1
        """
    }).execute()
    
    overlaps = len(res2.data) if res2.data else 0
    
    if overlaps == 0:
        print("✅ No overlapping club memberships")
    else:
        print(f"⚠️  {overlaps} MPs in multiple clubs simultaneously!")
    
    # Club size distribution
    res3 = supabase.rpc('execute_sql', {
        'query': """
        SELECT club_code, COUNT(*) as members
        FROM club_memberships
        WHERE to_date IS NULL
        GROUP BY club_code
        ORDER BY members DESC
        """
    }).execute()
    
    print("\nClub Sizes:")
    for row in res3.data:
        print(f"  {row['club_code']}: {row['members']} members")
    
    return orphaned == 0 and overlaps == 0

def check_indexes():
    """Verify critical indexes exist"""
    print("\n=== Index Health Check ===")
    
    indexes = [
        ('votes', 'idx_votes_category'),
        ('votes', 'idx_votes_category_term'),
        ('club_memberships', 'idx_club_memberships_mp'),
        ('club_memberships', 'idx_club_memberships_unique_current'),
    ]
    
    all_exist = True
    for table, index in indexes:
        res = supabase.rpc('execute_sql', {
            'query': f"""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = '{table}' AND indexname = '{index}'
            """
        }).execute()
        
        if res.data and len(res.data) > 0:
            print(f"✅ {index} exists")
        else:
            print(f"❌ {index} MISSING!")
            all_exist = False
    
    return all_exist

def main():
    print("=" * 60)
    print("DATA QUALITY MONITOR - Day 1 Professional Grade")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    results = {
        'categories': check_category_quality(),
        'clubs': check_club_quality(),
        'indexes': check_indexes()
    }
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if all(results.values()):
        print("✅ ALL CHECKS PASSED - Data quality excellent!")
        return 0
    else:
        print("⚠️  SOME CHECKS FAILED - Review above")
        failed = [k for k, v in results.items() if not v]
        print(f"Failed: {', '.join(failed)}")
        return 1

if __name__ == "__main__":
    exit(main())
