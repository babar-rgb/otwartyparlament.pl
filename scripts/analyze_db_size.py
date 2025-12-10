import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "host": "localhost",
    "port": 5432
}

def analyze_size():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query for total DB size
        cur.execute("SELECT pg_size_pretty(pg_database_size('otwarty_parlament')) as total_size;")
        total = cur.fetchone()['total_size']
        print(f"📦 Total Database Size: {total}")
        print("-" * 40)
        
        # Query for Table sizes
        sql = """
            SELECT
                nspname || '.' || relname AS relation,
                pg_size_pretty(pg_total_relation_size(C.oid)) AS total_size,
                pg_total_relation_size(C.oid) AS size_bytes,
                reltuples::bigint AS row_estimate
            FROM pg_class C
            LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
            WHERE nspname NOT IN ('pg_catalog', 'information_schema')
              AND C.relkind = 'r'
              AND nspname !~ '^pg_toast'
            ORDER BY pg_total_relation_size(C.oid) DESC
            LIMIT 10;
        """
        cur.execute(sql)
        rows = cur.fetchall()
        
        print(f"{'Table':<40} | {'Rows':<8} | {'Size'}")
        print("-" * 60)
        for r in rows:
            print(f"{r['relation']:<40} | {r['row_estimate']:<8} | {r['total_size']}")
            
        print("-" * 60)
        print(f"📦 FINAL TOTAL DB SIZE: {total}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_size()
