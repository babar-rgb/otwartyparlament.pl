import json
import re
from psycopg2.extras import execute_values
from backend.core.db import db
from backend.core.logger import get_logger

logger = get_logger("etl.heuristics")

class ExpertHeuristicsETL:
    def __init__(self):
        self.arguments = {}
        self.default_pros = []
        self.default_cons = []
        self.load_knowledge_base()

    def load_knowledge_base(self):
        """Loads expert arguments from DB."""
        logger.info("loading expert knowledge from db...")
        try:
            with db.get_cursor() as cur:
                cur.execute("SELECT keyword, pros, cons FROM topic_arguments")
                rows = cur.fetchall()
                
                for row in rows:
                    if row['keyword'] == '__default__':
                        self.default_pros = row['pros']
                        self.default_cons = row['cons']
                    else:
                        self.arguments[row['keyword']] = {
                            "pros": row['pros'],
                            "cons": row['cons']
                        }
            logger.info(f"Loaded {len(self.arguments)} topics.")
        except Exception as e:
            logger.error(f"Failed to load knowledge base: {e}")

    def clean_title(self, title):
        subject = re.sub(r'^Pkt \d+\.?\s*(porz\. dzien\.)?\s*', '', title, flags=re.IGNORECASE)
        subject = re.sub(r'^Sprawozdanie Komisji o\s+', '', subject, flags=re.IGNORECASE)
        subject = re.sub(r'^rządowym projekcie ustawy', 'rządowym projekcie', subject, flags=re.IGNORECASE)
        subject = re.sub(r'^poselskim projekcie ustawy', 'poselskim projekcie', subject, flags=re.IGNORECASE)
        subject = re.sub(r'\(druki?.*?\)', '', subject, flags=re.IGNORECASE)
        return subject.strip()

    def create_expert_summary(self, title, category, verdict):
        title_lower = title.lower()
        subject = self.clean_title(title)
        if len(subject) > 250: subject = subject[:247] + "..."

        vote_type = "Standard"
        if "uchwale senatu" in title_lower: vote_type = "Senat"
        elif "trzecie czytanie" in title_lower or "głosowanie nad całością" in title_lower: vote_type = "Final"
        elif "wotum nieufności" in title_lower: vote_type = "Wotum"
        elif "odrzucenie" in title_lower: vote_type = "Rejection"

        summary = ""
        if verdict == "PRZYJĘTO":
            if vote_type == "Final":
                summary = f"🏛️ Decyzja zapadła. Sejm ostatecznie uchwalił ustawę. Projekt: {subject}. Teraz dokument trafi na biurko Prezydenta (lub do Senatu)."
            elif vote_type == "Senat":
                summary = f"⚖️ Sejm rozstrzygnął. Posłowie zagłosowali w sprawie poprawek Senatu do ustawy: {subject}. Stanowisko izby niższej jest wiążące."
            elif vote_type == "Wotum":
                summary = f"🚨 Wotum nieufności uchwalone! Sejm wycofał poparcie dla ministra/rządu. To rzadka sytuacja, oznaczająca dymisję. Temat: {subject}."
            elif vote_type == "Rejection":
                summary = f"🗑️ Projekt do kosza. Sejm zdecydował o odrzuceniu projektu już na tym etapie: {subject}."
            else:
                summary = f"✅ Wniosek przyjęty. Sejm zgodził się na propozycję w głosowaniu: {subject}."
        elif verdict == "ODRZUCONO":
            if vote_type == "Rejection":
                summary = f"🛡️ Projekt obroniony. Sejm nie zgodził się na odrzucenie projektu: {subject}. Prace nad ustawą będą kontynuowane."
            elif vote_type == "Wotum":
                summary = f"🔒 Minister bezpieczny. Opozycji nie udało się zebrać większości do odwołania członka rządu. Wniosek: {subject} upadł."
            else:
                summary = f"❌ Sprzeciw Sejmu. Większość poselska zagłosowała przeciwko. Temat głosowania: {subject}."
        
        return summary

    def run(self):
        logger.info("Starting Expert Heuristics ETL...")
        
        with db.get_cursor(commit=True) as cur:
            # 1. Fetch Candidates
            cur.execute("SELECT id, title_clean, verdict, category FROM votes ORDER BY date DESC")
            votes = cur.fetchall()
            logger.info(f"Analyzing {len(votes)} votes...")

            batch_data = []
            
            for idx, row in enumerate(votes):
                vote_id = row['id']
                title = row['title_clean']
                verdict = row['verdict']
                category = row['category']
                title_lower = title.lower()

                # Logic
                summary = self.create_expert_summary(title, category, verdict)
                pros = []
                cons = []
                detected = []

                for kw, data in self.arguments.items():
                    if kw in title_lower:
                        detected.append(kw)
                        pros.extend(data['pros'])
                        cons.extend(data['cons'])

                if detected:
                    # Deduplicate
                    pros = list(dict.fromkeys(pros))
                    cons = list(dict.fromkeys(cons))
                    tags = list(dict.fromkeys([t.capitalize() for t in detected]))[:5]
                    summary += f"\n\n🏷️ **Kluczowe konteksty:** {', '.join(tags)}."
                else:
                    if "odrzucenie" in title_lower and "wotum nieufności" in self.arguments:
                        pros = self.arguments["wotum nieufności"]["pros"]
                        cons = ["**Ryzyko błędu:** Odrzucenie projektu na tak wczesnym etapie uniemożliwia jego poprawę w komisjach."]
                    else:
                        pros = self.default_pros
                        cons = self.default_cons

                # Cleanup
                pros = [p.replace("**", "") for p in pros[:4]]
                cons = [c.replace("**", "") for c in cons[:4]]
                summary = summary.replace("**", "")

                batch_data.append((vote_id, summary, json.dumps(pros, ensure_ascii=False), json.dumps(cons, ensure_ascii=False)))
                
                if len(batch_data) >= 500:
                    self._upsert_batch(cur, batch_data)
                    batch_data = []
                    logger.info(f"Processed {idx+1}/{len(votes)}")

            if batch_data:
                self._upsert_batch(cur, batch_data)

        logger.info("ETL Complete.")

    def _upsert_batch(self, cur, batch):
        upsert_query = """
            INSERT INTO vote_analyses (vote_id, summary, pros, cons, created_at)
            VALUES %s
            ON CONFLICT (vote_id) DO UPDATE SET
                summary = EXCLUDED.summary,
                pros = EXCLUDED.pros,
                cons = EXCLUDED.cons,
                created_at = NOW();
        """
        execute_values(cur, upsert_query, batch, template="(%s, %s, %s::jsonb, %s::jsonb, NOW())")

if __name__ == "__main__":
    etl = ExpertHeuristicsETL()
    etl.run()
