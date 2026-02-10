#!/bin/bash
# run_nightly.sh - Overnight Batch ETL for Sejm Analysis
# Usage: ./run_nightly.sh

LOG_FILE="nightly_etl.log"
echo "🌙 Starting Nightly Sejm ETL at $(date)" | tee -a $LOG_FILE

# 1. Link Votes to Bills (Fast Regex)
echo "🔗 [1/3] Linking Votes to Bills..." | tee -a $LOG_FILE
.venv/bin/python backend/etl/analysis/link_votes_bills.py >> $LOG_FILE 2>&1
echo "✅ Linking complete." | tee -a $LOG_FILE

# 2. Categorize Bills (Ollama)
echo "📜 [2/3] Categorizing Bills (This may take hours)..." | tee -a $LOG_FILE
.venv/bin/python backend/etl/analysis/process_bills_ollama.py >> $LOG_FILE 2>&1
echo "✅ Bills categorization complete." | tee -a $LOG_FILE

# 3. Categorize Votes (Ollama)
echo "🗳️ [3/3] Categorizing Votes (This may take hours)..." | tee -a $LOG_FILE
.venv/bin/python backend/etl/analysis/process_votes_ollama.py >> $LOG_FILE 2>&1
echo "✅ Votes categorization complete." | tee -a $LOG_FILE

# 4. Generate MP Biographies (Ollama)
echo "👤 [4/4] Generating MP Biographies..." | tee -a $LOG_FILE
.venv/bin/python -m backend.etl.analysis.generate_mp_bios >> $LOG_FILE 2>&1
echo "✅ MP Biographies generation complete." | tee -a $LOG_FILE

echo "☀️ Nightly ETL Finished at $(date)" | tee -a $LOG_FILE
