#!/usr/bin/env python3
"""
Professional Vote Classification System
========================================
Assigns votes to hierarchical categories using weighted keyword matching.

Features:
- Multi-level scoring (exact > strong > weak matches)
- Multi-tag support (primary + secondary categories)
- Confidence scoring
- Dry-run mode for validation
- Detailed reporting

Run: python scripts/classify_votes.py [--dry-run] [--limit N]
"""

import re
import subprocess
import sys
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

# ============================================================================
# CONFIGURATION
# ============================================================================

# Minimum confidence to assign category
CONFIDENCE_THRESHOLD = 0.15

# Maximum secondary categories per vote
MAX_SECONDARY_CATEGORIES = 3

# Scoring weights
WEIGHTS = {
    'exact': 10,      # Exact phrase match
    'strong': 5,      # Strong keyword match
    'weak': 2,        # Weak/stem match
    'title_bonus': 3, # Bonus if in title (not just body)
}


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class Category:
    id: int
    parent_id: Optional[int]
    slug: str
    name: str
    level: int
    keywords: List[str]


@dataclass
class VoteAssignment:
    vote_id: int
    category_id: int
    confidence: float
    is_primary: bool


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


def normalize_text(text: str) -> str:
    """Normalize text for matching"""
    if not text:
        return ""
    t = text.lower()
    # Remove punctuation except spaces
    t = re.sub(r'[^\w\s]', ' ', t)
    # Normalize whitespace
    t = re.sub(r'\s+', ' ', t).strip()
    return t


# ============================================================================
# LOAD DATA
# ============================================================================

def load_categories() -> Dict[int, Category]:
    """Load all categories from database"""
    output = run_sql("""
    SELECT id, parent_id, slug, name_pl, level, 
           array_to_string(keywords, '|')
    FROM categories
    ORDER BY level, display_order;
    """, return_output=True)
    
    categories = {}
    if output:
        for line in output.split('\n'):
            if '|' in line:
                parts = line.split('|')
                if len(parts) >= 6:
                    cat_id = int(parts[0])
                    parent_id = int(parts[1]) if parts[1] else None
                    keywords_str = parts[5] if len(parts) > 5 else ""
                    keywords = [k.strip() for k in keywords_str.split('|') if k.strip()]
                    
                    categories[cat_id] = Category(
                        id=cat_id,
                        parent_id=parent_id,
                        slug=parts[2],
                        name=parts[3],
                        level=int(parts[4]),
                        keywords=keywords
                    )
    return categories


def load_votes(limit: Optional[int] = None) -> List[Dict]:
    """Load votes that need classification"""
    limit_clause = f"LIMIT {limit}" if limit else ""
    
    output = run_sql(f"""
    SELECT v.id, 
           COALESCE(v.title_clean, v.title_raw, '') as title,
           COALESCE(v.title_short, '') as title_short
    FROM votes v
    LEFT JOIN vote_categories vc ON v.id = vc.vote_id
    WHERE vc.vote_id IS NULL
    ORDER BY v.importance_score DESC NULLS LAST, v.id DESC
    {limit_clause};
    """, return_output=True)
    
    votes = []
    if output:
        for line in output.split('\n'):
            if '|' in line:
                parts = line.split('|', 2)
                if len(parts) >= 2:
                    votes.append({
                        'id': int(parts[0]),
                        'title': parts[1],
                        'title_short': parts[2] if len(parts) > 2 else ""
                    })
    return votes


# ============================================================================
# CLASSIFICATION ALGORITHM
# ============================================================================

def score_category(text: str, category: Category) -> float:
    """
    Score how well a text matches a category.
    Returns score between 0.0 and 1.0
    """
    if not text or not category.keywords:
        return 0.0
    
    text_normalized = normalize_text(text)
    total_score = 0.0
    max_possible = len(category.keywords) * WEIGHTS['exact']
    
    for keyword in category.keywords:
        kw_normalized = normalize_text(keyword)
        
        if not kw_normalized:
            continue
        
        # Exact phrase match
        if kw_normalized in text_normalized:
            if len(kw_normalized) > 10:  # Long phrase = more specific
                total_score += WEIGHTS['exact'] * 1.5
            else:
                total_score += WEIGHTS['exact']
        # Word boundaries match
        elif re.search(r'\b' + re.escape(kw_normalized) + r'\b', text_normalized):
            total_score += WEIGHTS['strong']
        # Partial/stem match (first 4+ chars)
        elif len(kw_normalized) >= 4:
            stem = kw_normalized[:min(6, len(kw_normalized))]
            if stem in text_normalized:
                total_score += WEIGHTS['weak']
    
    # Normalize to 0-1 range
    if max_possible > 0:
        return min(1.0, total_score / max_possible)
    return 0.0


def classify_vote(vote: Dict, categories: Dict[int, Category]) -> List[VoteAssignment]:
    """
    Classify a single vote into categories.
    Returns list of assignments ordered by confidence.
    """
    # Combine title sources for matching
    full_text = f"{vote['title']} {vote['title_short']}"
    
    # Score all categories
    scores: Dict[int, float] = {}
    for cat_id, category in categories.items():
        score = score_category(full_text, category)
        if score >= CONFIDENCE_THRESHOLD:
            scores[cat_id] = score
    
    if not scores:
        return []
    
    # Sort by score descending
    sorted_scores = sorted(scores.items(), key=lambda x: -x[1])
    
    # Build assignments
    assignments = []
    domains_used = set()
    
    for i, (cat_id, confidence) in enumerate(sorted_scores):
        category = categories[cat_id]
        
        # Get domain (level 1 parent)
        domain_id = cat_id
        if category.level == 2:
            domain_id = category.parent_id
        
        # Primary = first assignment
        is_primary = (i == 0)
        
        # Skip if we already have a category from this domain (avoid duplicates)
        if not is_primary and domain_id in domains_used:
            continue
        
        assignments.append(VoteAssignment(
            vote_id=vote['id'],
            category_id=cat_id,
            confidence=round(confidence, 2),
            is_primary=is_primary
        ))
        
        domains_used.add(domain_id)
        
        # Limit secondary categories
        if len(assignments) > MAX_SECONDARY_CATEGORIES + 1:
            break
    
    return assignments


# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

def save_assignments(assignments: List[VoteAssignment], dry_run: bool = False) -> int:
    """Save assignments to database"""
    if not assignments:
        return 0
    
    if dry_run:
        return len(assignments)
    
    # Batch insert for performance
    values = []
    for a in assignments:
        values.append(f"({a.vote_id}, {a.category_id}, {a.confidence}, {str(a.is_primary).upper()}, 'rule')")
    
    if values:
        # Insert in batches of 1000
        batch_size = 1000
        for i in range(0, len(values), batch_size):
            batch = values[i:i+batch_size]
            query = f"""
            INSERT INTO vote_categories (vote_id, category_id, confidence, is_primary, assigned_by)
            VALUES {','.join(batch)}
            ON CONFLICT (vote_id, category_id) DO UPDATE SET
                confidence = EXCLUDED.confidence,
                is_primary = EXCLUDED.is_primary;
            """
            run_sql(query)
    
    return len(assignments)


# ============================================================================
# REPORTING
# ============================================================================

def generate_report(categories: Dict[int, Category]) -> str:
    """Generate classification report"""
    output = run_sql("""
    SELECT c.slug, c.name_pl, c.level, COUNT(vc.vote_id) as vote_count
    FROM categories c
    LEFT JOIN vote_categories vc ON c.id = vc.category_id
    GROUP BY c.id, c.slug, c.name_pl, c.level
    ORDER BY c.level, vote_count DESC;
    """, return_output=True)
    
    report = []
    report.append("\n" + "=" * 60)
    report.append("  CLASSIFICATION REPORT")
    report.append("=" * 60)
    
    if output:
        current_level = 0
        for line in output.split('\n'):
            if '|' in line:
                parts = line.split('|')
                level = int(parts[2])
                if level != current_level:
                    report.append(f"\n  Level {level}:")
                    current_level = level
                report.append(f"    {parts[1]}: {parts[3]} votes")
    
    return '\n'.join(report)


# ============================================================================
# MAIN
# ============================================================================

def main():
    # Parse arguments
    dry_run = '--dry-run' in sys.argv
    limit = None
    for i, arg in enumerate(sys.argv):
        if arg == '--limit' and i + 1 < len(sys.argv):
            limit = int(sys.argv[i + 1])
    
    print("=" * 70)
    print("  PROFESSIONAL VOTE CLASSIFICATION SYSTEM")
    print("=" * 70)
    
    if dry_run:
        print("  MODE: DRY-RUN (no changes will be saved)")
    
    # Load categories
    print("\n[1/4] Loading categories...")
    categories = load_categories()
    print(f"  Found {len(categories)} categories")
    
    domains = [c for c in categories.values() if c.level == 1]
    areas = [c for c in categories.values() if c.level == 2]
    print(f"  Domains: {len(domains)}, Areas: {len(areas)}")
    
    # Load votes
    print("\n[2/4] Loading votes...")
    votes = load_votes(limit)
    print(f"  Found {len(votes)} votes to classify")
    
    if not votes:
        print("  All votes already classified!")
        print(generate_report(categories))
        return
    
    # Classify
    print("\n[3/4] Classifying votes...")
    all_assignments = []
    unclassified = 0
    
    for i, vote in enumerate(votes):
        assignments = classify_vote(vote, categories)
        
        if assignments:
            all_assignments.extend(assignments)
        else:
            unclassified += 1
        
        # Progress
        if (i + 1) % 1000 == 0:
            print(f"  Processed {i+1}/{len(votes)} votes...")
    
    print(f"\n  Total assignments: {len(all_assignments)}")
    print(f"  Unclassified votes: {unclassified}")
    
    # Save
    print("\n[4/4] Saving assignments...")
    saved = save_assignments(all_assignments, dry_run)
    print(f"  Saved {saved} assignments" + (" (DRY-RUN)" if dry_run else ""))
    
    # Report
    if not dry_run:
        print(generate_report(categories))
    
    # Verification
    if not dry_run:
        result = run_sql("""
        SELECT 
            COUNT(DISTINCT vote_id) as classified_votes,
            COUNT(*) as total_assignments,
            ROUND(AVG(confidence)::numeric, 2) as avg_confidence
        FROM vote_categories;
        """, return_output=True)
        
        if result:
            parts = result.split('|')
            print("\n" + "=" * 60)
            print("  VERIFICATION")
            print("=" * 60)
            print(f"  Classified votes: {parts[0]}")
            print(f"  Total assignments: {parts[1]}")
            print(f"  Average confidence: {parts[2]}")
    
    print("\n" + "=" * 70)
    print("  CLASSIFICATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
