import requests
import xml.etree.ElementTree as ET
import os
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta
from etl_eu_logger import Logger, RateLimiter

# CONFIG
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

# TERM DATES
TERM_10_START = datetime(2024, 7, 16)
START_DATE = datetime(2024, 1, 1) 
END_DATE = datetime.now()

rate_limiter = RateLimiter(min_delay=0.5)
POLISH_MEP_IDS = set()

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False # We manage transactions
        return conn
    except Exception as e:
        Logger.error("DB", "Connection Failed", e)
        exit(1)

def get_polish_mep_ids(conn):
    Logger.info("DB", "Fetching Polish MEPs...")
    try:
        cur = conn.cursor()
        # Ensure column name is correct (api_id). Check if it's string or int in DB?
        # Assuming integer compatible or casting.
        cur.execute("SELECT api_id FROM euro_meps WHERE api_id IS NOT NULL")
        rows = cur.fetchall()
        # api_id in DB is text? casting to int for XML matching
        ids = set()
        for r in rows:
            try: ids.add(int(r[0]))
            except: pass
        
        Logger.success("DB", f"Loaded {len(ids)} Polish MEP IDs")
        cur.close()
        return ids
    except Exception as e:
        Logger.error("DB", "Failed to fetch MEPs", e)
        return set()

def determine_term(date_obj):
    if date_obj >= TERM_10_START: return 10
    return 9

def generate_date_range(start, end):
    delta = end - start
    for i in range(delta.days + 1):
        yield start + timedelta(days=i)

def fetch_xml(url):
    rate_limiter.wait()
    try:
        r = requests.get(url, timeout=30)
        if r.status_code == 200:
            return r.content
        return None
    except Exception as e:
        Logger.warning("Net", f"Error fetching {url}: {e}")
        return None

def parse_votes_from_xml(xml_content, date_str, term):
    valid_votes = []
    
    try:
        root = ET.fromstring(xml_content)
        # Namespace agnostic
        for vote_elem in root.findall(".//RollCallVote.Result"):
            vid = vote_elem.get("Identifier")
            if not vid: continue
            
            # Using XML identifier directly
            
            desc_tag = vote_elem.find("RollCallVote.Description.Text")
            title = desc_tag.text if desc_tag is not None else "No Description"
            title = (title or "")[:1000]
            
            def process_block(tag_name, vote_type):
                count = 0
                results = []
                block = vote_elem.find(tag_name)
                if block is not None:
                     count = int(block.get("Number", 0))
                     for mem in block.findall(".//PoliticalGroup.Member.Name"):
                         mep_id = mem.get("PersId") # Use PersId to match DB api_id
                         if mep_id:
                             try:
                                 mep_id_int = int(mep_id)
                                 if mep_id_int in POLISH_MEP_IDS:
                                     results.append({
                                         "vote_id": vid,
                                         "mep_id": mep_id_int, # Assuming DB stores API ID as int or mapped
                                         "vote": vote_type
                                     })
                             except: pass
                return count, results

            votes_for, r_for = process_block("Result.For", "For")
            votes_against, r_against = process_block("Result.Against", "Against")
            votes_abstain, r_abstain = process_block("Result.Abstention", "Abstain")
            
            all_results = r_for + r_against + r_abstain
            
            importance_score = 0
            total = votes_for + votes_against + votes_abstain
            if total > 50:
                ratio = abs(votes_for - votes_against) / total
                importance_score = int((1 - ratio) * 100)
            
            vote_record = (
                vid, title, date_str, 
                votes_for, votes_against, votes_abstain, 
                importance_score, importance_score > 60, term
            )
            
            valid_votes.append((vote_record, all_results))
            
    except Exception as e:
        Logger.error("XML", f"Failed to parse XML for {date_str}", e)
        
    return valid_votes

def batch_upsert(conn, meta_list, results_list):
    if not meta_list: return
    
    cur = conn.cursor()
    try:
        # 1. Upsert Votes
        # Table keys: id, title, date, votes_for, votes_against, votes_abstain, importance_score, is_key_vote, term
        sql = """
            INSERT INTO euro_votes (id, title, date, votes_for, votes_against, votes_abstain, importance_score, is_key_vote, term)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                votes_for = EXCLUDED.votes_for,
                votes_against = EXCLUDED.votes_against,
                votes_abstain = EXCLUDED.votes_abstain,
                importance_score = EXCLUDED.importance_score,
                is_key_vote = EXCLUDED.is_key_vote,
                term = EXCLUDED.term;
        """
        execute_values(cur, sql, meta_list)
        
        # 2. Upsert Results
        # First delete old results for these votes
        vote_ids = [m[0] for m in meta_list]
        cur.execute("DELETE FROM euro_vote_results WHERE vote_id = ANY(%s)", (vote_ids,))
        
        # Prepare Result Tuples (mep_id must be API ID? or DB uuid?)
        # euro_meps table has (id [uuid], api_id [text/int], ...)
        # euro_vote_results has (vote_id [text], mep_id [int referencing api_id? OR uuid referencing id?])
        
        # CHECK SCHEMA of euro_vote_results:
        # Previously we inserted { "vote_id": vid, "mep_id": pid, "vote": "For" } via Supabase.
        # This implies `mep_id` column accepts `pid` which is the API ID (Integer).
        # We'll assume yes.
        
        r_tuples = [(r['vote_id'], r['mep_id'], r['vote']) for r in results_list]
        
        if r_tuples:
            sql_res = """
                INSERT INTO euro_vote_results (vote_id, mep_id, vote)
                VALUES %s
            """
            execute_values(cur, sql_res, r_tuples)
            
        conn.commit()
        Logger.success("DB", f"Upserted {len(meta_list)} Votes & {len(r_tuples)} Results")
        
    except Exception as e:
        conn.rollback()
        Logger.error("DB", "Transaction Failed", e)
    finally:
        cur.close()

def run_etl():
    Logger.info("ETL", "Starting Europarl DIRECT POSTGRES ETL")
    
    conn = get_db_connection()
    global POLISH_MEP_IDS
    POLISH_MEP_IDS = get_polish_mep_ids(conn)
    
    found_days = 0
    total_votes = 0
    
    dates = list(generate_date_range(START_DATE, END_DATE))
    dates.reverse()
    
    meta_accum = []
    results_accum = []
    
    # Batch size
    BATCH_LIMIT = 50
    
    for current_date in dates:
        term = determine_term(current_date)
        date_fmt = current_date.strftime("%Y-%m-%d")
        url = f"https://www.europarl.europa.eu/doceo/document/PV-{term}-{date_fmt}-RCV_EN.xml"
        
        content = fetch_xml(url)
        if content:
            Logger.info("Hit", f"Found Votes for {date_fmt}!")
            found_days += 1
            
            votes_data = parse_votes_from_xml(content, date_fmt, term)
            total_votes += len(votes_data)
            
            for v_rec, v_res_list in votes_data:
                meta_accum.append(v_rec)
                results_accum.extend(v_res_list)
            
            if len(meta_accum) >= BATCH_LIMIT:
                batch_upsert(conn, meta_accum, results_accum)
                meta_accum = []
                results_accum = []
    
    # Flush remaining
    if meta_accum:
        batch_upsert(conn, meta_accum, results_accum)
        
    conn.close()
    Logger.success("ETL", f"Complete. Found {found_days} days. Total {total_votes} votes.")

if __name__ == "__main__":
    run_etl()
