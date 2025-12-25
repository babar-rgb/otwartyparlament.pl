import psycopg2
import os

def fix_encoding():
    try:
        conn = psycopg2.connect("dbname=otwarty_parlament user=kajtek")
        cur = conn.cursor()
        
        # Fetch all summaries
        cur.execute("SELECT print_number, ai_summary FROM bill_insights WHERE ai_summary LIKE '%ġ%';")
        rows = cur.fetchall()
        
        print(f"Found {len(rows)} rows to fix.")
        
        for print_number, summary in rows:
            if not summary:
                continue
            # Fix 'ġ' -> 'ł' and 'wagów' -> 'wałów'
            new_summary = summary.replace('ġ', 'ł').replace('wagów', 'wałów')
            
            cur.execute(
                "UPDATE bill_insights SET ai_summary = %s WHERE print_number = %s;",
                (new_summary, print_number)
            )
        
        conn.commit()
        print("Database updated successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_encoding()
