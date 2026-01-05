import json
import urllib.request
import os

# Configuration from postgrest.conf
POSTGREST_URL = "http://localhost:3001"

def fetch_mps():
    # Try fetching from root table endpoint (standard PostgREST)
    url = f"{POSTGREST_URL}/mps?select=name,party,seat_number"
    print(f"Fetching from: {url}")
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"Error fetching MPs: {e}")
        return []

def analyze_seating(mps):
    party_stats = {}
    
    no_seat_count = 0
    total_count = len(mps)
    
    print(f"\nAnalyzing {total_count} MPs...")
    
    for mp in mps:
        party = mp.get('party') or 'Unknown'
        seat = mp.get('seat_number')
        
        if seat is None:
            no_seat_count += 1
            # print(f"Warning: MP {mp.get('name')} ({party}) has no seat number!")
            continue
            
        if party not in party_stats:
            party_stats[party] = {'seats': []}
        
        party_stats[party]['seats'].append(seat)
        
    print(f"MPs without seats: {no_seat_count}\n")
    print(f"{'Party':<60} | {'Min':<5} | {'Max':<5} | {'Avg':<6} | {'Count':<5}")
    print("-" * 95)
    
    results = []
    for party, data in party_stats.items():
        seats = data['seats']
        if not seats:
            continue
        results.append({
            'party': party,
            'min': min(seats),
            'max': max(seats),
            'avg': sum(seats) / len(seats),
            'count': len(seats)
        })
        
    # Sort by Avg Seat location to see the spectrum
    results.sort(key=lambda x: x['avg'])
    
    for r in results:
        print(f"{r['party']:<60} | {r['min']:<5} | {r['max']:<5} | {r['avg']:<6.1f} | {r['count']:<5}")
        
    # Check for strategic ordering
    print("\nSpectrum Layout Check (Left to Right):")
    print("Expected: Lewica -> KO -> TD -> PiS -> Konfederacja")
    print("Actual (by Avg Seat):")
    for r in results:
        print(f" -> {r['party']} ({r['avg']:.1f})")

if __name__ == "__main__":
    mps = fetch_mps()
    if mps:
        analyze_seating(mps)
    else:
        print("No data found or connection failed.")
