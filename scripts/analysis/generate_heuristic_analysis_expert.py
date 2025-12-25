import psycopg2
from psycopg2.extras import execute_values
import re
import json

# DB Config
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def load_expert_arguments():
    """
    Loads arguments from the database instead of hardcoded dictionary.
    This allows for dynamic updates via CMS/SQL without code deployment.
    """
    print("🧠 Loading Expert Knowledge from DB (topic_arguments table)...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT keyword, pros, cons FROM topic_arguments")
        rows = cur.fetchall()
        conn.close()

        arguments = {}
        # Fallbacks in case DB is empty (should not happen after migration)
        default_pros = ["**Porządkowanie prawa:** Nowelizacja usuwa luki i błędy w dotychczasowych przepisach.", "**Dostosowanie do rzeczywistości:** Prawo musi nadążać za zmianami społecznymi i technologicznymi.", "**Realizacja obietnic:** Ustawa jest elementem programu, na który umówili się rządzący z wyborcami."]
        default_cons = ["**Inflacja prawa:** Zbyt częste zmiany przepisów wprowadzają chaos i niepewność.", "**Wątpliwości ekspertów:** Biuro Analiz Sejmowych zgłaszało zastrzeżenia do jakości legislacji.", "**Brak konsultacji:** Zarzut, że ustawa była procedowana zbyt szybko, bez wysłuchania głosu obywateli."]

        for keyword, pros, cons in rows:
            if keyword == '__default__':
                default_pros = pros
                default_cons = cons
            else:
                arguments[keyword] = {"pros": pros, "cons": cons}
        
        print(f"✅ Loaded {len(arguments)} topics from DB.")
        return arguments, default_pros, default_cons
        
    except Exception as e:
        print(f"❌ Error loading arguments from DB: {e}. Using empty defaults.")
        return {}, [], []

# Load Global State
KEYWORD_ARGUMENTS, DEFAULT_PROS, DEFAULT_CONS = load_expert_arguments()

def clean_title(title):
    # Aggressive cleaning to extract the core subject
    subject = re.sub(r'^Pkt \d+\.?\s*(porz\. dzien\.)?\s*', '', title, flags=re.IGNORECASE)
    subject = re.sub(r'^Sprawozdanie Komisji o\s+', '', subject, flags=re.IGNORECASE)
    subject = re.sub(r'^rządowym projekcie ustawy', 'rządowym projekcie', subject, flags=re.IGNORECASE)
    subject = re.sub(r'^poselskim projekcie ustawy', 'poselskim projekcie', subject, flags=re.IGNORECASE)
    subject = re.sub(r'\(druki?.*?\)', '', subject, flags=re.IGNORECASE)
    return subject.strip()

def create_expert_summary(title, category, verdict):
    """
    Creates a JOURNALISTIC style summary.
    Instead of passive "Sejm przyjął", provides context and consequence.
    """
    title_lower = title.lower()
    subject = clean_title(title)
    if len(subject) > 250: subject = subject[:247] + "..."

    # Detect Type
    vote_type = "Standard"
    if "uchwale senatu" in title_lower: vote_type = "Senat"
    elif "trzecie czytanie" in title_lower or "głosowanie nad całością" in title_lower: vote_type = "Final"
    elif "wotum nieufności" in title_lower: vote_type = "Wotum"
    elif "odrzucenie" in title_lower: vote_type = "Rejection"

    # Journalistic Templates
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

def generate_heuristic_analysis_expert():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("🎓 Starting EXPERT Analysis Engine (Journalist/Lawyer Mode)...")
    
    cur.execute("SELECT id, title_clean, verdict, category FROM votes ORDER BY date DESC")
    votes = cur.fetchall()
    
    total = len(votes)
    print(f"📊 Analyzing {total} votes with EXPERT logic...")
    
    batch_data = []
    
    for idx, row in enumerate(votes):
        vote_id, title, verdict, category = row
        title_lower = title.lower()
        
        # 1. Generate EXPERT Summary
        summary = create_expert_summary(title, category, verdict)
        
        # 2. Generate Context-Aware Pros/Cons (MULTI-CONTEXT + DEDUPLICATION)
        pros = []
        cons = []
        detected_topics = []
        
        # Scan for ALL matching keywords
        for kw, data in KEYWORD_ARGUMENTS.items():
            if kw in title_lower:
                detected_topics.append(kw)
                pros.extend(data["pros"])
                cons.extend(data["cons"])
        
        # DEDUPLICATE and PRIORITIZE
        if detected_topics:
            # Remove duplicates while preserving order
            pros = list(dict.fromkeys(pros))
            cons = list(dict.fromkeys(cons))
            
            # Format tags nicely
            tags = [t.capitalize() for t in detected_topics]
            tags_display = list(dict.fromkeys(tags))[:5]
            summary += f"\n\n🏷️ **Kluczowe konteksty:** {', '.join(tags_display)}."
        else:
            # Fallback
            if "odrzucenie" in title_lower and "wotum nieufności" in KEYWORD_ARGUMENTS:
                 pros = KEYWORD_ARGUMENTS["wotum nieufności"]["pros"] # reusing generic political control pros
                 cons = ["**Ryzyko błędu:** Odrzucenie projektu na tak wczesnym etapie uniemożliwia jego poprawę w komisjach."]
            else:
                 pros = DEFAULT_PROS
                 cons = DEFAULT_CONS

        # Limit to top 4 bullets to avoid walls of text
        pros = pros[:4]
        cons = cons[:4]

        # CLEANUP: Remove Markdown bold syntax '**' as per user request (UI doesn't support it)
        try:
            summary = summary.replace("**", "")
            pros = [p.replace("**", "") for p in pros]
            cons = [c.replace("**", "") for c in cons]
        except Exception as e:
             pass

        # JSON formatting
        pros_json = json.dumps(pros, ensure_ascii=False)
        cons_json = json.dumps(cons, ensure_ascii=False)
        
        batch_data.append((vote_id, summary, pros_json, cons_json))
        
        if len(batch_data) >= 500:
            upsert_query = """
            INSERT INTO vote_analyses (vote_id, summary, pros, cons, created_at)
            VALUES %s
            ON CONFLICT (vote_id) DO UPDATE SET
                summary = EXCLUDED.summary,
                pros = EXCLUDED.pros,
                cons = EXCLUDED.cons,
                created_at = NOW();
            """
            execute_values(cur, upsert_query, batch_data, template="(%s, %s, %s::jsonb, %s::jsonb, NOW())")
            conn.commit()
            print(f"  Processed {idx+1}/{total}")
            batch_data = []

    if batch_data:
        upsert_query = """
        INSERT INTO vote_analyses (vote_id, summary, pros, cons, created_at)
        VALUES %s
        ON CONFLICT (vote_id) DO UPDATE SET
            summary = EXCLUDED.summary,
            pros = EXCLUDED.pros,
            cons = EXCLUDED.cons,
            created_at = NOW();
        """
        execute_values(cur, upsert_query, batch_data, template="(%s, %s, %s::jsonb, %s::jsonb, NOW())")
        conn.commit()
    
    print("\n✅ EXPERT Analysis Complete!")
    conn.close()

if __name__ == "__main__":
    generate_heuristic_analysis_expert()
