#!/usr/bin/env python3
"""
Professional Vote Clustering System
====================================
Groups related votes (same bill, amendments, readings) into clusters.

Features:
- Title similarity analysis using fuzzy matching
- Same-session grouping
- Amendment detection
- Reading stage detection
- Cluster prioritization (most important vote as primary)

Run: python scripts/cluster_votes.py
"""

import re
import subprocess
from collections import defaultdict
from typing import List, Dict, Tuple, Optional
from difflib import SequenceMatcher

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

# ============================================================================
# CLUSTERING CONFIGURATION
# ============================================================================

# Minimum similarity ratio for grouping (0.0 - 1.0)
SIMILARITY_THRESHOLD = 0.65

# Words to ignore when comparing titles
STOP_WORDS = {
    'sprawozdanie', 'komisji', 'komisja', 'uchwale', 'senatu', 'ustawy',
    'ustawie', 'ustawa', 'projekt', 'projekcie', 'rządowym', 'poselskim',
    'senackim', 'obywatelskim', 'zmianie', 'oraz', 'innych', 'ustaw',
    'druk', 'druki', 'porz', 'dzien', 'pkt', 'sprawie', 'nad', 'głosowanie',
    'poprawka', 'poprawki', 'wniosek', 'odrzucenie', 'przyjęcie'
}

# Patterns that indicate amendments (poprawki)
AMENDMENT_PATTERNS = [
    r'poprawka\s+(?:nr\s+)?(\d+)',
    r'poprawek\s+(?:nr\s+)?(\d+)',
    r'wniosek\s+o\s+odrzucenie',
    r'wniosek\s+mniejszości',
]

# Reading stages
READING_PATTERNS = [
    (r'trzecie\s+czytanie', 'third'),
    (r'drugie\s+czytanie', 'second'),
    (r'pierwsze\s+czytanie', 'first'),
]


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def run_sql(query: str, return_output: bool = False) -> Optional[str]:
    """Execute SQL query"""
    cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-A", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr[:200]}")
        return None
    return result.stdout.strip() if return_output else True


def normalize_title(title: str) -> str:
    """Normalize title for comparison"""
    # Lowercase
    t = title.lower()
    
    # Remove print numbers
    t = re.sub(r'\(druki?\s+nr[^)]+\)', '', t)
    t = re.sub(r'\(druk[^)]+\)', '', t)
    
    # Remove amendment numbers
    t = re.sub(r'poprawka\s+(?:nr\s+)?\d+', 'poprawka', t)
    t = re.sub(r'poprawek\s+(?:nr\s+)?[\d\s,\-i]+', 'poprawek', t)
    
    # Remove dates
    t = re.sub(r'\d+\s+\w+\s+\d{4}\s*r?\.?', '', t)
    
    # Normalize whitespace
    t = re.sub(r'\s+', ' ', t).strip()
    
    return t


def extract_core_topic(title: str) -> str:
    """Extract the core bill/topic from a title"""
    t = normalize_title(title)
    
    # Remove procedural prefixes
    prefixes = [
        r'^pkt\s+\d+[a-z]?\.\s*porz\s+dzien\s+',
        r'^sprawozdanie\s+komisji\s+o\s+',
        r'^uchwale\s+senatu\s+w\s+sprawie\s+',
        r'^głosowanie\s+nad\s+',
        r'^wniosek\s+o\s+',
        r'^odrzucenie\s+',
    ]
    for p in prefixes:
        t = re.sub(p, '', t, flags=re.IGNORECASE)
    
    # Extract first significant phrase (up to 50 chars)
    words = [w for w in t.split() if w not in STOP_WORDS and len(w) > 2]
    return ' '.join(words[:8])


def similarity_ratio(s1: str, s2: str) -> float:
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, s1, s2).ratio()


def is_amendment(title: str) -> bool:
    """Check if vote is an amendment"""
    t = title.lower()
    return any(re.search(p, t) for p in AMENDMENT_PATTERNS)


def get_reading_stage(title: str) -> Optional[str]:
    """Get reading stage if present"""
    t = title.lower()
    for pattern, stage in READING_PATTERNS:
        if re.search(pattern, t):
            return stage
    return None


# ============================================================================
# CLUSTERING ALGORITHM
# ============================================================================

def cluster_session_votes(votes: List[Dict]) -> List[List[Dict]]:
    """
    Cluster votes from a single session based on similarity.
    Returns list of clusters (each cluster is a list of votes).
    """
    if len(votes) <= 1:
        return [[v] for v in votes]
    
    clusters = []
    used = set()
    
    # Sort by voting_number to process in order
    votes_sorted = sorted(votes, key=lambda x: x['voting_number'])
    
    for i, v1 in enumerate(votes_sorted):
        if v1['id'] in used:
            continue
        
        # Start new cluster
        cluster = [v1]
        used.add(v1['id'])
        
        core1 = extract_core_topic(v1['title'])
        
        # Look for similar votes
        for j, v2 in enumerate(votes_sorted[i+1:], i+1):
            if v2['id'] in used:
                continue
            
            core2 = extract_core_topic(v2['title'])
            
            # Check similarity
            sim = similarity_ratio(core1, core2)
            
            # Also check if both are amendments or readings of same bill
            both_amendments = is_amendment(v1['title']) and is_amendment(v2['title'])
            same_topic = sim >= SIMILARITY_THRESHOLD
            
            if same_topic or (both_amendments and sim >= 0.5):
                cluster.append(v2)
                used.add(v2['id'])
        
        clusters.append(cluster)
    
    return clusters


def select_primary_vote(cluster: List[Dict]) -> Dict:
    """Select the most important vote in a cluster as primary"""
    if len(cluster) == 1:
        return cluster[0]
    
    # Prioritize:
    # 1. Final reading (third > second > first)
    # 2. Non-amendment votes
    # 3. Highest importance_score
    # 4. Highest voting_number (usually final vote)
    
    def vote_priority(v):
        score = 0
        title = v['title'].lower()
        
        # Reading stage bonus
        if 'trzecie czytanie' in title:
            score += 100
        elif 'drugie czytanie' in title:
            score += 50
        elif 'pierwsze czytanie' in title:
            score += 25
        
        # Non-amendment bonus
        if not is_amendment(v['title']):
            score += 30
        
        # Importance score
        score += (v.get('importance_score') or 0) * 10
        
        # Voting number as tiebreaker
        score += v['voting_number'] * 0.01
        
        return score
    
    return max(cluster, key=vote_priority)


# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

def get_votes_by_session(term: int = 10) -> Dict[Tuple[int, str], List[Dict]]:
    """Get all votes grouped by session (sitting + date)"""
    output = run_sql(f"""
    SELECT id, sitting, date::date as day, voting_number, 
           COALESCE(title_clean, title_raw) as title,
           importance_score
    FROM votes 
    WHERE term = {term}
    ORDER BY sitting, date, voting_number;
    """, return_output=True)
    
    if not output:
        return {}
    
    sessions = defaultdict(list)
    for line in output.split('\n'):
        if '|' in line:
            parts = line.split('|')
            if len(parts) >= 5:
                try:
                    vote = {
                        'id': int(parts[0]),
                        'sitting': int(parts[1]),
                        'date': parts[2],
                        'voting_number': int(parts[3]),
                        'title': parts[4],
                        'importance_score': int(parts[5]) if parts[5] else 0
                    }
                    key = (vote['sitting'], vote['date'])
                    sessions[key].append(vote)
                except (ValueError, IndexError):
                    continue
    
    return sessions


def save_clusters(clusters_data: List[Tuple[int, List[Dict]]]):
    """Save cluster assignments to database"""
    for cluster_id, cluster in clusters_data:
        primary = select_primary_vote(cluster)
        
        for vote in cluster:
            is_primary = vote['id'] == primary['id']
            run_sql(f"""
            UPDATE votes 
            SET cluster_id = {cluster_id}, 
                is_cluster_primary = {str(is_primary).upper()}
            WHERE id = {vote['id']};
            """)


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 70)
    print("  PROFESSIONAL VOTE CLUSTERING SYSTEM")
    print("  Groups related votes into logical clusters")
    print("=" * 70)
    
    # Reset existing clusters
    run_sql("UPDATE votes SET cluster_id = NULL, is_cluster_primary = FALSE;")
    
    cluster_id = 1
    all_clusters = []
    
    for term in [10, 9]:
        print(f"\n{'='*60}")
        print(f"  PROCESSING TERM {term}")
        print(f"{'='*60}")
        
        print(f"\n  Loading votes by session...")
        sessions = get_votes_by_session(term=term)
        print(f"  Found {len(sessions)} sessions")
        
        total_votes = sum(len(v) for v in sessions.values())
        print(f"  Total votes: {total_votes}")
        
        print(f"  Clustering...")
        multi_count = 0
        single_count = 0
        
        for (sitting, date), votes in sorted(sessions.items()):
            clusters = cluster_session_votes(votes)
            
            for cluster in clusters:
                if len(cluster) > 1:
                    all_clusters.append((cluster_id, cluster))
                    multi_count += 1
                else:
                    all_clusters.append((cluster_id, cluster))
                    single_count += 1
                cluster_id += 1
        
        print(f"  Multi-vote clusters: {multi_count}")
        print(f"  Single-vote clusters: {single_count}")
    
    print(f"\n  Total clusters across all terms: {cluster_id - 1}")
    
    # Stats on cluster sizes
    sizes = [len(c[1]) for c in all_clusters if len(c[1]) > 1]
    if sizes:
        print(f"\n  Multi-vote cluster sizes:")
        print(f"    Average: {sum(sizes)/len(sizes):.1f}")
        print(f"    Max: {max(sizes)}")
        print(f"    Median: {sorted(sizes)[len(sizes)//2]}")
    
    print("\n  Saving clusters to database...")
    save_clusters(all_clusters)
    
    # Verify
    result = run_sql("""
    SELECT 
        COUNT(DISTINCT cluster_id) as total_clusters,
        COUNT(*) FILTER (WHERE is_cluster_primary) as primary_votes,
        COUNT(*) FILTER (WHERE NOT is_cluster_primary AND cluster_id IS NOT NULL) as secondary_votes
    FROM votes;
    """, return_output=True)
    
    if result:
        parts = result.split('|')
        print(f"\n  Final Results:")
        print(f"    Total clusters: {parts[0]}")
        print(f"    Primary votes (shown): {parts[1]}")
        print(f"    Secondary votes (hidden): {parts[2]}")
    
    print("\n" + "=" * 70)
    print("  CLUSTERING COMPLETE")
    print("=" * 70)
    
    # Show example clusters
    print("\n📋 Example multi-vote clusters:")
    examples = run_sql("""
    SELECT cluster_id, COUNT(*) as size, 
           MIN(title_short) as example_title
    FROM votes 
    WHERE cluster_id IS NOT NULL
    GROUP BY cluster_id
    HAVING COUNT(*) > 5
    ORDER BY COUNT(*) DESC
    LIMIT 5;
    """, return_output=True)
    
    if examples:
        for line in examples.split('\n'):
            if '|' in line:
                parts = line.split('|')
                print(f"  • Cluster {parts[0]}: {parts[1]} votes - \"{parts[2][:50]}...\"")


if __name__ == "__main__":
    main()

