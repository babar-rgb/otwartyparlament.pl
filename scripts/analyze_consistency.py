import os
import time
import json
from supabase import create_client, Client
import google.generativeai as genai
from typing import List, Dict

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    print("Error: Credentials required (Supabase & Gemini).")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-2.0-flash')

def analyze_topic(topic: str, keywords: List[str], vote_keywords: List[str]):
    print(f"\n--- Analyzing Consistency for Topic: {topic} ---")
    
    # 1. Find relevant speeches
    print("Fetching relevant speeches...")
    # Naive search: fetch all and filter in python or use ilike if possible
    # For better performance we should use FTS, but for now ilike loop
    
    # Let's just fetch recent speeches for now to test
    # In production we'd need a better search strategy
    
    # Fetch all MPs to iterate
    mps_response = supabase.table('mps').select('id, name').execute()
    mps = mps_response.data
    
    for mp in mps:
        mp_id = mp['id']
        mp_name = mp['name']
        
        # Check if we already have a report for this MP and Topic
        existing = supabase.table('consistency_reports').select('id').eq('mp_id', mp_id).eq('topic', topic).execute()
        if existing.data:
            # print(f"Skipping {mp_name} (already analyzed)")
            continue

        # 1. Get Speeches on topic
        # We construct a query for any of the keywords
        or_query = ','.join([f"content.ilike.%{k}%" for k in keywords])
        speeches_response = supabase.table('speeches').select('content, date').eq('mp_id', mp_id).or_(or_query).limit(3).execute()
        speeches = speeches_response.data
        
        if not speeches:
            continue
            
        # 2. Get Votes on topic
        # We need to find bills/votes related to the topic
        # This is tricky without a tagged vote database. 
        # We'll search for votes with titles matching keywords
        
        # First find relevant vote_ids
        # This part is computationally expensive to do per MP. 
        # Ideally we find the "Key Vote" for the topic once.
        
        # Let's assume we want to check against a specific "Key Vote" if we knew it.
        # For now, let's search for *any* vote where the MP voted.
        
        # Optimization: Find relevant votes GLOBALLY first
        # (Doing this inside the loop is bad, but for MVP script it's ok-ish if we limit)
        
        # Let's try to find ONE representative vote for the topic to compare against
        # e.g. for "Aborcja" find a vote with "ciąż" or "życi" in title
        
        # For this script, let's simplify:
        # We will feed Gemini the speeches and ask it to infer the stance.
        # Then we feed it the voting history (titles + vote) and ask for consistency.
        
        # Fetch last 10 votes for this MP
        # Fetch last 20 votes for this MP
        votes_response = supabase.table('vote_results').select('vote, vote_id').eq('mp_id', mp_id).limit(20).execute()
        mp_votes = votes_response.data
        
        if not mp_votes:
            continue

        # Fetch details for these votes
        vote_ids = [v['vote_id'] for v in mp_votes]
        votes_details_response = supabase.table('votes').select('id, title_clean, date').in_('id', vote_ids).execute()
        votes_details = {v['id']: v for v in votes_details_response.data}
        
        # Filter votes relevant to topic
        relevant_votes = []
        for v in mp_votes:
            vote_detail = votes_details.get(v['vote_id'])
            if not vote_detail: continue
            
            title = (vote_detail.get('title_clean') or '').lower()
            if any(k in title for k in vote_keywords):
                relevant_votes.append(f"- Bill: {vote_detail.get('title_clean')} (Date: {vote_detail['date']}) -> Voted: {v['vote']}")
        
        if not relevant_votes:
            continue
            
        print(f"Analyzing {mp_name} ({len(speeches)} speeches, {len(relevant_votes)} votes)...")
        
        # Prepare Prompt
        speech_texts = "\n".join([f"- \"{s['content'][:500]}...\" ({s['date']})" for s in speeches])
        vote_texts = "\n".join(relevant_votes)
        
        prompt = f"""
        Analyze the consistency of MP {mp_name} regarding the topic "{topic}".
        
        Speeches:
        {speech_texts}
        
        Voting Record:
        {vote_texts}
        
        Task:
        1. Determine their stance based on speeches.
        2. Determine their stance based on votes.
        3. Check if they are consistent.
        
        Return JSON:
        {{
            "speech_quote": "Short relevant quote from speech",
            "vote_result": "Summary of how they voted (e.g. 'Against liberalization')",
            "verdict": "Spójny" or "Niespójny" or "Niejednoznaczny",
            "analysis": "One sentence explanation."
        }}
        """
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up JSON
            if result_text.startswith('```json'):
                result_text = result_text[7:-3]
            
            data = json.loads(result_text)
            
            # Save to DB
            supabase.table('consistency_reports').insert({
                'mp_id': mp_id,
                'topic': topic,
                'speech_quote': data.get('speech_quote'),
                'vote_result': data.get('vote_result'),
                'verdict': data.get('verdict'),
                'analysis': data.get('analysis')
            }).execute()
            
            print(f"  -> Verdict: {data.get('verdict')}")
            time.sleep(1) # Rate limit
            
        except Exception as e:
            print(f"  Error analyzing {mp_name}: {e}")

if __name__ == "__main__":
    # Example Topic: Aborcja / Życie poczęte
    analyze_topic(
        topic="Aborcja", 
        keywords=["aborcj", "ciąż", "płod", "kobiet", "życi"],
        vote_keywords=["aborcj", "ciąż", "życi", "kodeks karny"]
    )
    
    # Example Topic: Wiatraki / Energetyka
    analyze_topic(
        topic="Wiatraki", 
        keywords=["wiatrak", "energi", "prąd", "odległość"],
        vote_keywords=["wiatrow", "energi", "elektrycz"]
    )
