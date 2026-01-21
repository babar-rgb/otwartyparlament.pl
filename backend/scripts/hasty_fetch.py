
import sys
import os
import requests
import subprocess
import tempfile
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.core.orm_db import SessionLocal
from backend.models import Bill

def force_fetch(number):
    session = SessionLocal()
    bill = session.query(Bill).filter(Bill.number == str(number)).first()
    if not bill:
        print(f"Bill {number} not found!")
        return
        
    print(f"Fetching content for Bill {number}...")
    
    url = f"https://api.sejm.gov.pl/sejm/term10/prints/{number}/{number}.pdf"
    
    try:
        r = requests.get(url, timeout=30)
        if r.status_code == 200:
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tf:
                tf.write(r.content)
                temp_path = tf.name
            
            subprocess.run(['pdftotext', '-layout', temp_path, '/tmp/output.txt'])
            with open('/tmp/output.txt', 'r') as f:
                text = f.read()
            
            # Fallback for empty API PDF
            if len(text.strip()) < 100:
                print("⚠️ API PDF was empty or scanned. Trying Portal Fallback...")
                portal_url = f"https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr={number}"
                r_portal = requests.get(portal_url, timeout=30)
                if r_portal.status_code == 200:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(r_portal.text, 'html.parser')
                    body = soup.find('body')
                    text_portal = body.get_text() if body else soup.get_text()
                    if len(text_portal) > len(text):
                        text = text_portal
                        print(f"✅ Recovered {len(text)} chars from Portal HTML.")
                    else:
                        print("❌ Portal HTML also empty.")

            bill.content = text
            session.commit()
            print(f"✅ Updated Bill {number} with {len(text)} chars.")
            if os.path.exists(temp_path): os.remove(temp_path)
        else:
            print(f"❌ Failed to fetch PDF status: {r.status_code}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    force_fetch(sys.argv[1])
