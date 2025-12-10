import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
from etl_eu_logger import Logger
# Import Keywords
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from keyword_map import CATEGORY_KEYWORDS

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    Logger.error("Config", "Missing Supabase Credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def normalize_text(text):
    return text.lower().replace(",", "").replace(".", "")

def update_taxonomy():
    Logger.info("Taxonomy", "Starting Taxonomy Update...")
    # Fetch untagged votes
    try:
        # Fetch in batches if many
        res = supabase.table('euro_votes') \
            .select('id, title') \
            .is_('topic_tag', 'null') \
            .limit(1000) \
            .execute()
        
        votes = res.data
        Logger.info("Taxonomy", f"Found {len(votes)} untagged votes")
        
        updates = []
        for v in votes:
            title = normalize_text(v['title'])
            assigned_tag = "Inne"
            
            # Key Logic using keyword_map
            for category, keywords in CATEGORY_KEYWORDS.items():
                if any(k in title for k in keywords):
                    assigned_tag = category.title() # e.g. "Zdrowie"
                    break
            
            if assigned_tag != "Inne":
                updates.append({"id": v['id'], "topic_tag": assigned_tag})
                
        if updates:
            # Batch update? Supabase doesn't support bulk update with different values easily in one call unless upsert.
            # We can upsert with just ID and tag? Yes, partial update works if other cols nullable/default?
            # euro_votes: other cols are NOT NULL usually.
            # We might need to fetch full record or be careful.
            # Upsert requires all non-nullable columns usually OR we rely on existing values?
            # Suapbase/PostgREST upsert updates columns provided.
            # CHECK if title/date is required.
            # Safer to iterate or check definition.
            # Let's try upserting just ID and topic_tag. PostgREST usually supports PATCH on ID.
            # But upsert is PUT/POST.
            
            # Efficient way: Loop updates or use CASE statement?
            # Let's loop for safety now (batches of 100?).
            count = 0
            for update in updates:
                supabase.table('euro_votes').update({'topic_tag': update['topic_tag']}).eq('id', update['id']).execute()
                count += 1
                if count % 50 == 0: print(".", end="", flush=True)
            print()
            Logger.success("Taxonomy", f"Tagged {len(updates)} votes")
    except Exception as e:
        Logger.error("Taxonomy", "Error updating tags", e)

def update_loyalty():
    Logger.info("Loyalty", "Starting Loyalty Metrics Calculation...")
    try:
        # 1. Fetch all votes in Term 10 with results
        # We need raw SQL or heavy fetching.
        # Let's fetch all results for Term 10. Might be large.
        # Optimization: Calculate per MEP?
        
        # Get active MEPs
        meps_res = supabase.table('euro_meps').select('api_id').eq('active', True).execute()
        mep_ids = [m['api_id'] for m in meps_res.data]
        Logger.info("Loyalty", f"Calculating for {len(mep_ids)} MEPs")
        
        # We need "Consensus" for each vote.
        # Fetch all results grouped by vote?
        # Supabase doesn't do GROUP BY easily.
        # We'll use RPC or fetch raw. 
        # Or iterate votes? (Slow if thousands).
        
        # Let's attempt to fetch all results (limit 50000?).
        # If too big, page it.
        
        # Fetch all votes IDs for Term 10
        votes_res = supabase.table('euro_votes').select('id').eq('term', 10).execute()
        vote_ids = [v['id'] for v in votes_res.data]
        
        # For each vote, calculate "Consensus Vote" (Majority)
        # Store in dict: vote_id -> 'For'/'Against'/'Abstain'
        consensus_map = {}
        
        # Fetch results for these votes
        # chunking vote_ids
        chunk_size = 100
        all_results = [] # list of {vote_id, mep_id, vote}
        
        for i in range(0, len(vote_ids), chunk_size):
            chunk = vote_ids[i:i+chunk_size]
            r = supabase.table('euro_vote_results').select('vote_id, mep_id, vote').in_('vote_id', chunk).execute()
            all_results.extend(r.data)
            
        # Build Consensus
        vote_tally = {} # vote_id -> {For: 0, Against: 0...}
        mep_votes = {} # mep_id -> {vote_id: vote_val}
        
        for res in all_results:
            vid = res['vote_id']
            val = res['vote']
            mid = res['mep_id']
            
            if vid not in vote_tally: vote_tally[vid] = {'For': 0, 'Against': 0, 'Abstain': 0, 'Absent': 0}
            if val in vote_tally[vid]: vote_tally[vid][val] += 1
            
            if mid not in mep_votes: mep_votes[mid] = {}
            mep_votes[mid][vid] = val
            
        # Determine consensus
        for vid, counts in vote_tally.items():
            # Find max
            winner = max(counts, key=counts.get)
            consensus_map[vid] = winner
            
        # Calculate MEP Stats
        total_term_votes = len(vote_ids)
        if total_term_votes == 0: return

        mep_updates = []
        for mid in mep_ids:
            my_votes = mep_votes.get(mid, {})
            
            present_count = len([v for v in my_votes.values() if v != 'Absent'])
            # Assuming 'Absent' is logged? If no record, it's absent?
            # Our ETL inserts 'Absent'? 
            # Check `etl_europarl_votes.py`: It inserts For/Against/Abstain.
            # Absent is NOT inserted?
            # So `len(my_votes)` is participation count.
            
            participation = len(my_votes)
            attendance = (participation / total_term_votes) * 100 if total_term_votes > 0 else 0
            
            # Rebellion
            rebel_count = 0
            for vid, my_val in my_votes.items():
                if vid in consensus_map:
                    group_val = consensus_map[vid]
                    if my_val != group_val:
                        rebel_count += 1
            
            rebellion_rate = (rebel_count / participation) * 100 if participation > 0 else 0
            
            mep_updates.append({
                "api_id": mid,
                "attendance_score": round(attendance, 1),
                "rebellion_rate": round(rebellion_rate, 1),
                "total_votes": participation
            })
            
        # Update MEPs
        count = 0
        for upd in mep_updates:
            supabase.table('euro_meps').update(upd).eq('api_id', upd['api_id']).execute()
            count += 1
            if count % 10 == 0: print(".", end="", flush=True)
            
        Logger.success("Loyalty", f"Updated stats for {len(mep_updates)} MEPs")

    except Exception as e:
        Logger.error("Loyalty", "Error calculating metrics", e)

if __name__ == "__main__":
    update_taxonomy()
    update_loyalty()
