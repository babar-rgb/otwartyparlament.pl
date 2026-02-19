---
description: "Error Logs Audit: Agent-Led analysis of Docker logs"
---

# Error Log Analysis Workflow (Agent-Led)

This workflow empowers the AI Agent to act as a Site Reliability Engineer (SRE). It extracts error logs from the backend, preprocesses them using AI to reduce noise, and presents a dossier for the Agent to interpret.

## 1. Gather & Preprocess Logs
**Goal:** Extract errors from Docker, group them by similarity, and identify "Top Offenders".

// turbo
1. Execute Log Gathering Script
cat << 'EOF' > /tmp/gather_logs_dossier.py
import sys, os, json, subprocess, re
import google.generativeai as genai

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print(json.dumps({"status": "skipped", "message": "Missing GEMINI_API_KEY"}))
    sys.exit(0)

genai.configure(api_key=API_KEY)

def clean_json_markdown(text):
    """
    Remove markdown code block delimiters (```json ... ```)
    """
    text = text.strip()
    match = re.search(r"```(json)?(.*?)```", text, re.DOTALL)
    if match:
        text = match.group(2).strip()
    return text

def get_docker_logs():
    try:
        # Better backend container detection
        # We look for "backend" or "api" but exclude "db", "postgres", "redis"
        result = subprocess.run(["docker", "ps", "--format", "{{.Names}}"], capture_output=True, text=True)
        containers = result.stdout.strip().split('\n')
        
        target = None
        for c in containers:
            c_lower = c.lower()
            if ("backend" in c_lower or "api" in c_lower) and not any(x in c_lower for x in ["db", "postgres", "redis", "scout"]):
                target = c
                break
        
        if not target and containers: 
             # Fallback to specifically 'parlament-backend-1'
             if "parlament-backend-1" in containers: target = "parlament-backend-1"
             else: target = containers[0] # Desperate fallback

        if not target: return "No suitable container found."

        print(f"Fetching logs from: {target} (Last 24h)")
        # Use --since 24h to avoid stale errors
        cmd = ["docker", "logs", "--since", "24h", target]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        logs = result.stdout + result.stderr
        if not logs:
            return "No logs in the last 24h."
            
        return logs
    except Exception as e:
        return f"Error fetching logs: {str(e)}"

def filter_errors(logs):
    # Simple keyword filter
    keywords = ["ERROR", "CRITICAL", "Exception", "Traceback", "500 Internal Server Error"]
    lines = logs.split('\n')
    errors = [line for line in lines if any(k in line for k in keywords)]
    return errors[-100:] # Last 100 errors

def ai_preprocess(errors):
    if not errors:
        return {"status": "clean", "message": "No errors found in last 24h."}

    prompt = f"""
    Jesteś Inżynierem Logów. Przeanalizuj te surowe logi błędów i przygotuj JSON dla Głównego Architekta via API.
    
    LOGI (ostatnie 100):
    {chr(10).join(errors)}
    
    ZADANIE:
    1. Zgrupuj powtarzające się błędy.
    2. Dla każdej grupy podaj: "signature" (np. 'DatabaseConnectionError'), "count", "example_msg".
    3. Oceń pilność (CRITICAL/WARNING).
    
    WYNIK JSON:
    {{
        "total_errors": {len(errors)},
        "groups": [
            {{ "signature": "...", "count": 10, "severity": "CRITICAL", "example": "..." }}
        ]
    }}
    """
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        # We pass json mode hint, but still clean it
        resp = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        text = clean_json_markdown(resp.text)
        return json.loads(text)
    except Exception as e:
        return {"status": "error", "message": f"AI Parsing Error: {str(e)}\nRaw Response: {resp.text if 'resp' in locals() else 'None'}"}

if __name__ == "__main__":
    raw = get_docker_logs()
    
    if "Error" in raw or "No suitable" in raw or "No logs" in raw:
        dossier = {"error_summary": raw}
    else:
        filtered = filter_errors(raw)
        ai_data = ai_preprocess(filtered)
        dossier = {
            "timestamp": "Last 24h",
            "analysis": ai_data,
            "raw_snippet": filtered[-5:] # Show last 5 raw lines for context
        }
        
    with open("logs_dossier.json", "w") as f:
        json.dump(dossier, f, indent=2)
        
    print("Logs Dossier prepared: logs_dossier.json")
EOF

# Install dependencies
pip install google-generativeai > /dev/null 2>&1 || true
python3 /tmp/gather_logs_dossier.py && rm /tmp/gather_logs_dossier.py

## 2. Agent Review (Manual Step)
**Goal:** The AI Agent reads the dossier and advises the user.

> **Instruction for Agent:**
> 1. Read `logs_dossier.json`.
> 2. If `error_summary` exists (e.g. "No logs"), inform user: "System milczy (brak logów 24h)".
> 3. If `analysis.status` == "clean", inform user: "System zdrowy (0 błędów w 24h)".
> 4. If errors exist, list top offenders.
> 5. Suggest a **Specific Fix** for the #1 error.
