import psycopg2
import requests
import xml.etree.ElementTree as ET

# CONFIG
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

URL = "https://www.europarl.europa.eu/doceo/document/PV-10-2025-11-27-RCV_EN.xml"

def debug_mapping():
    print("🔍 Debugging MEP IDs...")
    
    # 1. DB IDs
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT * FROM euro_meps LIMIT 1")
        col_names = [desc[0] for desc in cur.description]
        print(f"Columns: {col_names}")
        
        # Heuristic for name
        name_col = "name"
        if "first_name" in col_names and "last_name" in col_names:
            cur.execute(f"SELECT first_name, last_name, api_id FROM euro_meps LIMIT 10")
            rows = cur.fetchall()
            print("\n📊 DB Sample:")
            db_ids = set()
            for r in rows:
                print(f" - {r[0]} {r[1]}: {r[2]}")
                if r[2]: db_ids.add(int(r[2]))
        elif "full_name" in col_names:
            cur.execute(f"SELECT full_name, api_id FROM euro_meps LIMIT 10")
            rows = cur.fetchall()
            print("\n📊 DB Sample:")
            db_ids = set()
            for r in rows:
                print(f" - {r[0]}: {r[1]}")
                if r[1]: db_ids.add(int(r[1]))
        else:
             # Just grab api_id
             cur.execute("SELECT api_id FROM euro_meps LIMIT 10")
             rows = cur.fetchall()
             print("\n📊 DB Sample (IDs only):")
             db_ids = set()
             for r in rows:
                 print(f" - {r[0]}")
                 if r[0]: db_ids.add(int(r[0]))
        
        # Get ALL IDs
        cur.execute("SELECT api_id FROM euro_meps")
        all_rows = cur.fetchall()
        for r in all_rows:
            if r[0]:
                try: db_ids.add(int(r[0]))
                except: pass
        print(f"Total DB Polish IDs: {len(db_ids)}")
        conn.close()
    except Exception as e:
        print(f"❌ DB Error: {e}")
        return

    # 2. XML IDs
    print(f"\n🌍 Fetching XML: {URL}")
    try:
        r = requests.get(URL)
        if r.status_code != 200:
            print("❌ Failed fetch")
            return
            
        root = ET.fromstring(r.content)
        
        xml_ids = set()
        sample_xml = []
        
        # Scan some votes
        count = 0
        pers_ids_xml = set()
        
        for mem in root.findall(".//PoliticalGroup.Member.Name"):
            mid = mem.get("MepId")
            pid = mem.get("PersId") # Capture PersId
            name = mem.text
            
            if pid:
                pers_ids_xml.add(int(pid))
                
            if mid:
                xml_ids.add(int(mid))
                if count < 10:
                    sample_xml.append(f"{name}: MepId={mid}, PersId={pid}")
                    count += 1
                    
        print("\n📄 XML Sample (IDs):")
        for s in sample_xml:
            print(f" - {s}")
            
        print(f"Total XML Unique MEPs (MepId): {len(xml_ids)}")
        print(f"Total XML Unique MEPs (PersId): {len(pers_ids_xml)}")
        
        # 3. Intersection
        common_mep = db_ids.intersection(xml_ids)
        common_pers = db_ids.intersection(pers_ids_xml)
        
        print(f"\n🔗 Intersection (MepId): {len(common_mep)}")
        print(f"🔗 Intersection (PersId): {len(common_pers)}")
        
        if len(common_pers) > 0:
            print("✅ FOUND MATCH ON PERS_ID!")
        else:
            print("❌ Still No Match.")
            
    except Exception as e:
        print(f"❌ XML Error: {e}")

if __name__ == "__main__":
    debug_mapping()
