#!/usr/bin/env python3
"""
Master Data Audit System - System Health Monitor
Orchestrates: AUDIT -> DIAGNOSE -> REPAIR
"""
import os
import sys
import subprocess
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ANSI Colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"

class DataPillar:
    def __init__(self, name, total_query, gap_query, repair_script=None, min_threshold=95):
        self.name = name
        self.total_query = total_query
        self.gap_query = gap_query
        self.repair_script = repair_script
        self.min_threshold = min_threshold  # % completion required
        self.total = 0
        self.gaps = 0
        self.complete = 0
        self.percent = 0
        
    def audit(self):
        """Run SQL audit queries"""
        try:
            # Get total
            res = supabase.rpc('execute_sql', {'query': self.total_query}).execute()
            self.total = res.data if isinstance(res.data, int) else (res.data[0]['count'] if res.data else 0)
            
            # Get gaps
            res2 = supabase.rpc('execute_sql', {'query': self.gap_query}).execute()
            self.gaps = res2.data if isinstance(res2.data, int) else (res2.data[0]['count'] if res2.data else 0)
            
            self.complete = self.total - self.gaps
            self.percent = (self.complete / self.total * 100) if self.total > 0 else 100
            
        except Exception as e:
            # Fallback: direct table queries
            try:
                if "mps" in self.gap_query:
                    total_res = supabase.table('mps').select('id', count='exact').execute()
                    self.total = total_res.count
                    gap_res = supabase.table('mps').select('id', count='exact').not_.like('photo_url', '/assets/%').execute()
                    self.gaps = gap_res.count
                elif "processes" in self.gap_query:
                    total_res = supabase.table('processes').select('id', count='exact').execute()
                    self.total = total_res.count
                    gap_res = supabase.table('processes').select('id', count='exact').is_('body_text', 'null').execute()
                    self.gaps = gap_res.count
                elif "interpellations" in self.gap_query:
                    total_res = supabase.table('interpellations').select('id', count='exact').execute()
                    self.total = total_res.count
                    # Complex: need length check via filter
                    all_res = supabase.table('interpellations').select('content').execute()
                    self.gaps = sum(1 for r in all_res.data if not r.get('content') or len(r['content']) < 20)
                elif "speeches" in self.gap_query:
                    total_res = supabase.table('speeches').select('id', count='exact').execute()
                    self.total = total_res.count
                    all_res = supabase.table('speeches').select('content').limit(1000).execute()
                    # Sample-based estimate
                    sample_gaps = sum(1 for r in all_res.data if not r.get('content') or len(r['content']) < 50)
                    self.gaps = int(sample_gaps / len(all_res.data) * self.total) if all_res.data else 0
                elif "votes" in self.gap_query:
                    total_res = supabase.table('votes').select('id', count='exact').execute()
                    self.total = total_res.count
                    gap_res = supabase.table('votes').select('id', count='exact').is_('importance_score', 'null').execute()
                    self.gaps = gap_res.count
                    
                self.complete = self.total - self.gaps
                self.percent = (self.complete / self.total * 100) if self.total > 0 else 100
            except Exception as e2:
                print(f"{RED}Error auditing {self.name}: {e2}{RESET}")
                self.total = 0
                self.gaps = 0
                
    def status_icon(self):
        """Get status icon based on completion"""
        if self.percent >= self.min_threshold:
            return f"{GREEN}✅{RESET}"
        elif self.percent >= 50:
            return f"{YELLOW}🔄{RESET}"
        else:
            return f"{RED}❌{RESET}"
            
    def needs_repair(self):
        """Check if repair is needed"""
        return self.gaps > 0 and self.percent < self.min_threshold

def print_header():
    """Print system header"""
    print(f"\n{BOLD}{BLUE}{'='*80}{RESET}")
    print(f"{BOLD}{BLUE}  🏗️  MASTER DATA AUDIT - System Health Monitor{RESET}")
    print(f"{BOLD}{BLUE}  Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
    print(f"{BOLD}{BLUE}{'='*80}{RESET}\n")

def print_table(pillars):
    """Print beautiful status table"""
    print(f"\n{BOLD}📊 System Health Dashboard{RESET}")
    print("─" * 100)
    print(f"{'KATEGORIA':<25} {'TOTAL':>10} {'PEŁNE':>10} {'BR AKI':>10} {'%':>8} {'STATUS':>10}")
    print("─" * 100)
    
    for p in pillars:
        percent_str = f"{p.percent:.1f}%"
        print(f"{p.name:<25} {p.total:>10} {p.complete:>10} {p.gaps:>10} {percent_str:>8} {p.status_icon():>15}")
    
    print("─" * 100)
    
    # Overall health
    avg_percent = sum(p.percent for p in pillars) / len(pillars)
    overall_status = f"{GREEN}HEALTHY{RESET}" if avg_percent >= 90 else f"{YELLOW}NEEDS ATTENTION{RESET}" if avg_percent >= 70 else f"{RED}CRITICAL{RESET}"
    print(f"\n{BOLD}Overall System Health: {overall_status} ({avg_percent:.1f}%){RESET}\n")

def repair_pillar(pillar):
    """Execute repair script for a pillar"""
    if not pillar.repair_script:
        print(f"{YELLOW}[WARN] No repair script defined for {pillar.name}{RESET}")
        return False
        
    print(f"\n{BLUE}[REPAIR] Executing repair for {pillar.name}...{RESET}")
    print(f"Running: python3 {pillar.repair_script}")
    
    try:
        # Run script in background
        result = subprocess.run(['python3', pillar.repair_script], 
                              cwd=os.path.dirname(os.path.abspath(__file__)),
                              capture_output=True,
                              text=True,
                              timeout=300)  # 5 min timeout
        
        if result.returncode == 0:
            print(f"{GREEN}[SUCCESS] Repair completed for {pillar.name}{RESET}")
            return True
        else:
            print(f"{RED}[ERROR] Repair failed: {result.stderr[:200]}{RESET}")
            return False
    except subprocess.TimeoutExpired:
        print(f"{YELLOW}[TIMEOUT] Repair script still running in background{RESET}")
        return True
    except Exception as e:
        print(f"{RED}[ERROR] Failed to run repair: {e}{RESET}")
        return False

def main():
    print_header()
    
    # Define data pillars
    pillars = [
        DataPillar(
            name="Posłowie (Zdjęcia)",
            total_query="SELECT COUNT(*) as count FROM mps",
            gap_query="SELECT COUNT(*) as count FROM mps WHERE photo_url NOT LIKE '/assets/%'",
            repair_script="scripts/download_assets.py",
            min_threshold=100
        ),
        DataPillar(
            name="Ustawy (Treść)",
            total_query="SELECT COUNT(*) as count FROM processes",
            gap_query="SELECT COUNT(*) as count FROM processes WHERE body_text IS NULL",
            repair_script="scripts/etl_legislation_body.py",
            min_threshold=95
        ),
        DataPillar(
            name="Interpelacje (Pytania)",
            total_query="SELECT COUNT(*) as count FROM interpellations",
            gap_query="SELECT COUNT(*) as count FROM interpellations WHERE content IS NULL OR LENGTH(content) < 20",
            repair_script="scripts/fix_interp_sync.py",
            min_threshold=90
        ),
        DataPillar(
            name="Wypowiedzi (Stenogramy)",
            total_query="SELECT COUNT(*) as count FROM speeches",
            gap_query="SELECT COUNT(*) as count FROM speeches WHERE content IS NULL OR LENGTH(content) < 50",
            repair_script="scripts/fill_speech_content.py",
            min_threshold=95
        ),
        DataPillar(
            name="Głosowania (ML Score)",
            total_query="SELECT COUNT(*) as count FROM votes",
            gap_query="SELECT COUNT(*) as count FROM votes WHERE importance_score IS NULL OR importance_score = 0",
            repair_script=None,  # Requires ML model
            min_threshold=80
        ),
        DataPillar(
            name="Wypowiedzi (MP Links)",
            total_query="SELECT COUNT(*) as count FROM speeches",
            gap_query="SELECT COUNT(*) as count FROM speeches WHERE mp_id IS NULL OR mp_id = ''",
            repair_script="scripts/fix_speech_mp_links.py",
            min_threshold=90
        ),
    ]
    
    # Phase 1: AUDIT
    print(f"{BOLD}Phase 1: 🔍 AUDIT{RESET}")
    for p in pillars:
        print(f"Auditing {p.name}...", end=" ")
        p.audit()
        print(f"{p.status_icon()}")
    
    print_table(pillars)
    
    # Phase 2: DIAGNOSE
    print(f"\n{BOLD}Phase 2: 🩺 DIAGNOSE{RESET}")
    needs_repair = [p for p in pillars if p.needs_repair()]
    
    if not needs_repair:
        print(f"{GREEN}✅ All systems GREEN! No repairs needed.{RESET}")
        return
    
    print(f"{YELLOW}⚠️  Found {len(needs_repair)} pillars needing repair:{RESET}")
    for p in needs_repair:
        print(f"  - {p.name}: {p.gaps} gaps ({p.percent:.1f}%)")
    
    # Phase 3: REPAIR (Optional - ask user)
    print(f"\n{BOLD}Phase 3: 🔧 REPAIR{RESET}")
    print(f"Would you like to auto-repair? (y/n): ", end="")
    
    # Auto-yes for now (remove this for interactive mode)
    choice = "n"  # Set to "y" to enable auto-repair
    
    if choice.lower() == 'y':
        for p in needs_repair:
            if p.repair_script:
                repair_pillar(p)
        
        # Re-audit
        print(f"\n{BOLD}Re-auditing after repairs...{RESET}")
        for p in pillars:
            p.audit()
        print_table(pillars)
    else:
        print(f"{YELLOW}Skipping auto-repair. Run individual scripts manually:{RESET}")
        for p in needs_repair:
            if p.repair_script:
                print(f"  python3 {p.repair_script}")
    
    print(f"\n{BOLD}{BLUE}{'='*80}{RESET}")
    print(f"{BOLD}📋 Audit Complete. Check status above.{RESET}")
    print(f"{BOLD}{BLUE}{'='*80}{RESET}\n")

if __name__ == "__main__":
    main()
