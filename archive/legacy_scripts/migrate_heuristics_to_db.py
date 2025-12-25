import psycopg2
import json
import os
import sys

# Add scripts dir to path to find the module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from generate_heuristic_analysis_expert import KEYWORD_ARGUMENTS, DEFAULT_PROS, DEFAULT_CONS, DB_CONFIG
except ImportError:
    # Fallback if imports fail (e.g. if I broke the file, but I haven't touched it yet)
    print("❌ Could not import KEYWORD_ARGUMENTS. Make sure generate_heuristic_analysis_expert.py is in the same folder.")
    sys.exit(1)

def migrate():
    print("🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print(f"🚀 Migrating {len(KEYWORD_ARGUMENTS)} Expert Topics to DB...")
        
        count = 0
        
        # 1. Migrate Keywords
        for keyword, data in KEYWORD_ARGUMENTS.items():
            pros_json = json.dumps(data.get('pros', []), ensure_ascii=False)
            cons_json = json.dumps(data.get('cons', []), ensure_ascii=False)
            
            sql = """
                INSERT INTO topic_arguments (keyword, pros, cons)
                VALUES (%s, %s, %s)
                ON CONFLICT (keyword) DO UPDATE SET
                    pros = EXCLUDED.pros,
                    cons = EXCLUDED.cons,
                    updated_at = NOW();
            """
            cur.execute(sql, (keyword, pros_json, cons_json))
            count += 1
            
        # 2. Migrate Defaults
        defaults_pros_json = json.dumps(DEFAULT_PROS, ensure_ascii=False)
        defaults_cons_json = json.dumps(DEFAULT_CONS, ensure_ascii=False)
        
        sql = """
            INSERT INTO topic_arguments (keyword, pros, cons)
            VALUES ('__default__', %s, %s)
            ON CONFLICT (keyword) DO UPDATE SET
                pros = EXCLUDED.pros,
                cons = EXCLUDED.cons,
                updated_at = NOW();
        """
        cur.execute(sql, (defaults_pros_json, defaults_cons_json))
        count += 1
        
        conn.commit()
        conn.close()
        print(f"✅ Migrated {count} items (topics + defaults) successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate()
