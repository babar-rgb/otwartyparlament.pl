import os
import re
from supabase import create_client, Client

# --- CONFIGURATION ---
# Manually load .env
try:
    env_paths = ['.env', '../.env']
    for path in env_paths:
        if os.path.exists(path):
            with open(path) as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
            break
except Exception:
    print("Warning: .env file not found, relying on system envs.")

# --- CONFIGURATION ---
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def calculate_importance(title, yes_count, no_count):
    score = 0
    title_lower = (title or "").lower()
    
    # HIGH IMPACT keywords (+50 points each)
    HIGH_IMPACT = ['podatek', 'vat', 'budżet', 'aborcja', 'konstytucja', 
                   'trybunał', 'sąd najwyższy', 'obronność', 'pieniądz', 
                   'składk', 'zus', 'in vitro', 'ustawa budżetowa', 'uchwała', 'wotum zaufania']
    
    # LOW IMPACT keywords (-20 points each)
    LOW_IMPACT = ['upamiętnienie', 'patron', 'dzień', 'zmiana nazwy', 
                  'regulamin', 'sprawozdanie', 'wybór', 'powołanie', 'odwołanie']
    
    # Keyword scoring
    for keyword in HIGH_IMPACT:
        if keyword in title_lower:
            score += 50
            break  # Only count once
    
    for keyword in LOW_IMPACT:
        if keyword in title_lower:
            score -= 20
            break
    
    # Controversy scoring (based on vote split)
    total_votes = yes_count + no_count
    if total_votes > 0:
        diff = abs(yes_count - no_count)
        
        if diff < 10:  # Extremely close (within 10 votes)
            score += 40
        elif diff < 30:  # Very close (within 30 votes)
            score += 20
        elif diff > 400:  # Unanimous (boring)
            score -= 10
    
    # Normalize to 0-100
    score = max(0, min(100, score))
    return score

def recalc_importance():
    print("Fetching all votes...")
    # Fetch in chunks if needed, but for ~3000 votes it's fine
    votes_resp = supabase.table('votes').select('*').execute()
    votes = votes_resp.data
    print(f"Found {len(votes)} votes.")
    
    updates = []
    
    for vote in votes:
        details = vote.get('details_json') or {}
        yes = details.get('yes', 0)
        no = details.get('no', 0)
        
        score = calculate_importance(vote.get('title_clean') or vote.get('title_raw'), yes, no)
        is_key = score >= 50 # Lowered threshold slightly to catch more
        
        if score > 0:
            updates.append({
                'id': vote['id'],
                'importance_score': score,
                'is_key_vote': is_key
            })
            
    print(f"Updating {len(updates)} votes with new scores...")
    
    # Batch update
    # Using individual updates to avoid not-null constraint issues with partial upsert
    print(f"Updating {len(updates)} votes...")
    for i, update_data in enumerate(updates):
        try:
            supabase.table('votes').update({
                'importance_score': update_data['importance_score'],
                'is_key_vote': update_data['is_key_vote']
            }).eq('id', update_data['id']).execute()
            
            if i % 50 == 0:
                print(f"Updated {i}/{len(updates)} votes...")
        except Exception as e:
            print(f"Error updating vote {update_data['id']}: {e}")
        
    print("Recalculation complete.")

if __name__ == "__main__":
    recalc_importance()
