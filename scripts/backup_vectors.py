import json
import os
from datetime import datetime
from sqlalchemy import text
from backend.core.orm_db import engine

BACKUP_DIR = "backups"
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")

def backup_table(table_name, id_col="id"):
    print(f"Backing up {table_name}...")
    with engine.connect() as conn:
        # Fetch ID and current vector_embedding (JSONB)
        query = text(f"SELECT {id_col}, vector_embedding FROM {table_name} WHERE vector_embedding IS NOT NULL")
        results = conn.execute(query).fetchall()
        
        data = []
        for row in results:
            data.append({
                "id": str(row[0]),
                "vector": row[1]
            })
            
        filename = f"{BACKUP_DIR}/{table_name}_vectors_{TIMESTAMP}.json"
        with open(filename, "w") as f:
            json.dump(data, f)
        
        print(f"Saved {len(data)} records to {filename}")

if __name__ == "__main__":
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        
    try:
        backup_table("votes")
        backup_table("bills")
        # backup_table("euro_votes") # checking if exists
        print("Backup complete.")
    except Exception as e:
        print(f"Backup failed: {e}")
