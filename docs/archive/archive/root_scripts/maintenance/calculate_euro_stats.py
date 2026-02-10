import psycopg2
from collections import defaultdict

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def calculate_stats():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("Fetching Vote Results...")
    # Fetch: vote_id, mep_id, vote_option, mep_group (we need to join to get group at that time?
    # Assume euro_meps.eu_group is constant for now (Term 10).
    
    cur.execute("""
        SELECT r.vote_id, r.mep_id, r.vote, m.eu_group
        FROM euro_vote_results r
        JOIN euro_meps m ON r.mep_id = m.api_id
    """)
    rows = cur.fetchall()
    print(f"Loaded {len(rows)} individual votes.")
    
    # Data Structures
    mep_votes = defaultdict(lambda: {"total": 0, "present": 0, "rebel": 0})
    
    # 1. Group Consensus per Vote
    # Map: vote_id -> group -> {For: X, Against: Y, Abstain: Z}
    vote_group_stats = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    
    for vid, mid, vote, group in rows:
        vote = vote.lower() # for, against, abstain, absent
        if not group: group = "Unknown"
        
        # Attendance Logic
        mep_votes[mid]["total"] += 1
        if vote != 'absent':
            mep_votes[mid]["present"] += 1
            
        # Rebellion Logic Preparation
        if vote in ['for', 'against', 'abstain']:
            vote_group_stats[vid][group][vote] += 1
            
    print("Calculated Group Consensus...")
    
    # 2. Determine Group Line
    # Map: vote_id -> group -> 'for'/'against'/'abstain'/None
    group_lines = defaultdict(dict)
    
    for vid, groups in vote_group_stats.items():
        for group, counts in groups.items():
            # Find max
            winner = max(counts, key=counts.get)
            total_group_votes = sum(counts.values())
            
            # If winner has > 50% of group votes -> It is the Line
            if counts[winner] > total_group_votes * 0.5:
                group_lines[vid][group] = winner
            else:
                group_lines[vid][group] = None # No consensus
                
    print("Calculating Rebellion...")
    
    # 3. Check Rebellion
    for vid, mid, vote, group in rows:
        vote = vote.lower()
        if vote == 'absent': continue
        if not group: continue
        
        line = group_lines[vid].get(group)
        if line and vote != line:
            # You Rebel Scum
            mep_votes[mid]["rebel"] += 1
            
    print("Updating Database...")
    
    for mid, stats in mep_votes.items():
        if stats["total"] == 0: continue
        
        att_score = (stats["present"] / stats["total"]) * 100
        
        # Rebellion rate: Rebels / Present Votes
        reb_rate = 0
        if stats["present"] > 0:
            reb_rate = (stats["rebel"] / stats["present"]) * 100
            
        cur.execute("""
            UPDATE euro_meps
            SET attendance_score = %s, rebellion_rate = %s
            WHERE api_id = %s
        """, (att_score, reb_rate, mid))
        
    conn.commit()
    conn.close()
    print("Done!")

if __name__ == "__main__":
    calculate_stats()
