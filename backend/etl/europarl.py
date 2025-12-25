"""
Europarl ETL for otwartyparlament.pl
Fetches European Parliament votes for Polish MEPs.
Standardized version using backend.core modules.
"""
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from backend.core.db import db
from backend.core.logger import get_logger
from backend.utils.http import http_session

logger = get_logger("etl.europarl")

TERM_10_START = datetime(2024, 7, 16)
START_DATE = datetime(2024, 1, 1)


class EuroparlETL:
    def __init__(self):
        self.polish_mep_ids = set()
        self.total_votes = 0

    def run(self):
        """Run Europarl ETL."""
        logger.info("Starting Europarl ETL...")
        
        self._load_polish_meps()
        
        end_date = datetime.now()
        dates = list(self._generate_date_range(START_DATE, end_date))
        dates.reverse()  # Recent first
        
        meta_accum = []
        results_accum = []
        
        for current_date in dates:
            term = 10 if current_date >= TERM_10_START else 9
            date_fmt = current_date.strftime("%Y-%m-%d")
            url = f"https://www.europarl.europa.eu/doceo/document/PV-{term}-{date_fmt}-RCV_EN.xml"
            
            try:
                resp = http_session.get(url, timeout=30)
                if resp.status_code == 200:
                    logger.info(f"Found votes for {date_fmt}")
                    votes_data = self._parse_xml(resp.content, date_fmt, term)
                    
                    for v_rec, v_res_list in votes_data:
                        meta_accum.append(v_rec)
                        results_accum.extend(v_res_list)
                    
                    if len(meta_accum) >= 50:
                        self._batch_upsert(meta_accum, results_accum)
                        meta_accum = []
                        results_accum = []
            except Exception as e:
                logger.error(f"Error fetching {date_fmt}: {e}")
        
        # Flush remaining
        if meta_accum:
            self._batch_upsert(meta_accum, results_accum)
        
        logger.info(f"ETL Complete. Total {self.total_votes} votes processed.")

    def _load_polish_meps(self):
        """Load Polish MEP IDs from database."""
        logger.info("Loading Polish MEPs...")
        try:
            with db.get_cursor() as cur:
                cur.execute("SELECT api_id FROM euro_meps WHERE api_id IS NOT NULL")
                rows = cur.fetchall()
                for row in rows:
                    try:
                        self.polish_mep_ids.add(int(row['api_id']))
                    except:
                        pass
            logger.info(f"Loaded {len(self.polish_mep_ids)} Polish MEP IDs")
        except Exception as e:
            logger.error(f"Failed to load MEPs: {e}")

    def _generate_date_range(self, start, end):
        delta = end - start
        for i in range(delta.days + 1):
            yield start + timedelta(days=i)

    def _parse_xml(self, xml_content, date_str, term):
        """Parse votes from XML content."""
        valid_votes = []
        
        try:
            root = ET.fromstring(xml_content)
            for vote_elem in root.findall(".//RollCallVote.Result"):
                vid = vote_elem.get("Identifier")
                if not vid:
                    continue
                
                desc_tag = vote_elem.find("RollCallVote.Description.Text")
                title = (desc_tag.text if desc_tag is not None else "No Description")[:1000]
                
                def process_block(tag_name, vote_type):
                    results = []
                    block = vote_elem.find(tag_name)
                    count = 0
                    if block is not None:
                        count = int(block.get("Number", 0))
                        for mem in block.findall(".//PoliticalGroup.Member.Name"):
                            mep_id = mem.get("PersId")
                            if mep_id:
                                try:
                                    mep_id_int = int(mep_id)
                                    if mep_id_int in self.polish_mep_ids:
                                        results.append({
                                            "vote_id": vid,
                                            "mep_id": mep_id_int,
                                            "vote": vote_type
                                        })
                                except:
                                    pass
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
                self.total_votes += 1
                
        except Exception as e:
            logger.error(f"Failed to parse XML: {e}")
        
        return valid_votes

    def _batch_upsert(self, meta_list, results_list):
        """Batch upsert votes and results."""
        if not meta_list:
            return
        
        try:
            with db.get_cursor(commit=True) as cur:
                # Upsert votes
                from psycopg2.extras import execute_values
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
                
                # Delete old results
                vote_ids = [m[0] for m in meta_list]
                cur.execute("DELETE FROM euro_vote_results WHERE vote_id = ANY(%s)", (vote_ids,))
                
                # Insert new results
                r_tuples = [(r['vote_id'], r['mep_id'], r['vote']) for r in results_list]
                if r_tuples:
                    sql_res = """
                        INSERT INTO euro_vote_results (vote_id, mep_id, vote)
                        VALUES %s
                    """
                    execute_values(cur, sql_res, r_tuples)
                
                logger.info(f"Upserted {len(meta_list)} votes, {len(r_tuples)} results")
                
        except Exception as e:
            logger.error(f"Batch upsert failed: {e}")


if __name__ == "__main__":
    etl = EuroparlETL()
    etl.run()
