import subprocess
import sys

def run_query(query):
    # Using the psql path I found earlier: /opt/homebrew/opt/postgresql@17/bin/psql
    # Or just 'psql' if in path. I'll use the full path to be safe based on history.
    psql_cmd = ["/opt/homebrew/opt/postgresql@17/bin/psql", "-d", "otwarty_parlament", "-t", "-A", "-c", query]
    try:
        result = subprocess.run(psql_cmd, capture_output=True, text=True, check=True)
        return result.stdout.strip().split('\n')
    except subprocess.CalledProcessError as e:
        print(f"Error running query: {e}")
        return []

def main():
    print("--- Database Inventory Audit ---")
    
    # 1. Get List of Tables
    sql_tables = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    tables = run_query(sql_tables)
    
    tables = [t for t in tables if t] # Filter empty strings
    
    if not tables:
        print("No tables found in public schema.")
        return

    # 2. Count records for each
    for table in tables:
        # Safety check to avoid injection if table names were weird, but they come from schema
        sql_count = f'SELECT count(*) FROM "{table}";'
        try:
            counts = run_query(sql_count)
            count = counts[0] if counts else "Error"
            print(f"[TABELA] {table} -> {count}")
        except:
            print(f"[TABELA] {table} -> Error reading")
            
    print("--- End of Report ---")

if __name__ == "__main__":
    main()
