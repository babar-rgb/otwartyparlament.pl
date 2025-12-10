import requests
import xml.etree.ElementTree as ET
from datetime import datetime

# Target URL (The "Hidden API")
DATE = "2025-11-27"
URL = f"https://www.europarl.europa.eu/doceo/document/PV-10-{DATE}-RCV_EN.xml"

def test_fetch_and_parse():
    print(f"🔗 Fetching: {URL}")
    response = requests.get(URL)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        return

    print("✅ Download successful. Parsing XML...")
    
    try:
        root = ET.fromstring(response.content)
        
        # Namespace map (XML has namespaces)
        # However, ElementTree usually requires explicit namespace handling or stripping.
        # Let's see if we can just find 'RollCallVote.Result' by tag name ignoring NS for simplicity in PoC
        
        vote_count = 0
        
        # Iterating through all elements to find RollCallVote.Result (namespace agnostic approach for PoC)
        for vote in root.findall(".//RollCallVote.Result"):
            vote_count += 1
            vid = vote.get("Identifier")
            date = vote.get("Date")
            desc_tag = vote.find("RollCallVote.Description.Text")
            desc = desc_tag.text if desc_tag is not None else "No Description"
            
            print(f"\n🗳️  Vote ID: {vid}")
            print(f"📅 Date: {date}")
            print(f"📝 Desc: {desc}")
            
            # Count voters
            for_count = 0
            against_count = 0
            
            # Helper to count
            for result in vote.findall("Result.For"):
                 for_count = int(result.get("Number", 0))
            for result in vote.findall("Result.Against"):
                 against_count = int(result.get("Number", 0))
                 
            print(f"📊 For: {for_count}, Against: {against_count}")
            
            if vote_count >= 3:
                print("\n... (Stopping after 3 examples)")
                break
                
        if vote_count == 0:
            # Maybe namespace issue?
            print("⚠️ No votes found via simple findall. Trying namespace unaware iteration...")
            for elem in root.iter():
                if "RollCallVote.Result" in elem.tag:
                    print(f"Found tag: {elem.tag}")
                    
    except Exception as e:
        print(f"❌ Parse Error: {e}")

if __name__ == "__main__":
    test_fetch_and_parse()
