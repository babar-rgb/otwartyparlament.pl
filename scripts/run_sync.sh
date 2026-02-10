#!/bin/bash
# run_sync.sh - Unified Data Sync for Otwarty Parlament
# Usage: ./run_sync.sh [options]

LOG_FILE="sync_$(date +%Y%m%d_%H%M%S).log"
echo "🚀 Starting Sejm Data Sync at $(date)" | tee -a $LOG_FILE
echo "📝 Log file: $LOG_FILE"

# Activate Virtual Env if not already active
if [[ "$VIRTUAL_ENV" == "" ]]; then
    if [ -d ".venv" ]; then
        echo "🔧 Activating .venv..." | tee -a $LOG_FILE
        source .venv/bin/activate
    else
        echo "❌ .venv not found! Please run 'python3 -m venv .venv' and install dependencies." | tee -a $LOG_FILE
        exit 1
    fi
fi

# Function to run step
run_step() {
    NAME=$1
    CMD=$2
    echo "---------------------------------------------------" | tee -a $LOG_FILE
    echo "🔄 Running: $NAME" | tee -a $LOG_FILE
    echo "   Command: $CMD" | tee -a $LOG_FILE
    
    # Run command and capture exit code
    $CMD >> $LOG_FILE 2>&1
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ $NAME Completed Successfully." | tee -a $LOG_FILE
    else
        echo "❌ $NAME FAILED with exit code $EXIT_CODE. Check log for details." | tee -a $LOG_FILE
        # Verify if we should stop or continue? Let's continue for resilience.
    fi
}

# 1. Fetch Core Data (Sittings, Votes, MPs), Legislative Processes, and Interpellations
echo "---------------------------------------------------" | tee -a $LOG_FILE
echo "🔄 Running: Incremental Update (Votes, Sittings, Bills, Interpellations)" | tee -a $LOG_FILE
echo "   Command: python -m backend.etl.incremental" | tee -a $LOG_FILE
python -m backend.etl.incremental >> "$LOG_FILE" 2>&1
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Incremental Update Completed Successfully." | tee -a $LOG_FILE
else
    echo "❌ Incremental Update FAILED with exit code $EXIT_CODE. Check log for details." | tee -a $LOG_FILE
fi

# 2. Calculate Statistics (Attendance, Rebellion)
echo "---------------------------------------------------" | tee -a $LOG_FILE
echo "📊 Running: Statistics Calculation" | tee -a $LOG_FILE
echo "   Command: python -m backend.etl.stats" | tee -a $LOG_FILE
python -m backend.etl.stats >> "$LOG_FILE" 2>&1
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Statistics Calculation Completed Successfully." | tee -a $LOG_FILE
else
    echo "❌ Statistics Calculation FAILED with exit code $EXIT_CODE. Check log for details." | tee -a $LOG_FILE
fi

# 3. Calculate Badges (Gamification)
echo "---------------------------------------------------" | tee -a $LOG_FILE
echo "🏅 Running: Badge Assignment" | tee -a $LOG_FILE
echo "   Command: python -m backend.scripts.calculate_badges" | tee -a $LOG_FILE
python -m backend.scripts.calculate_badges >> "$LOG_FILE" 2>&1
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Badge Assignment Completed Successfully." | tee -a $LOG_FILE
else
    echo "❌ Badge Assignment FAILED with exit code $EXIT_CODE. Check log for details." | tee -a $LOG_FILE
fi

echo "---------------------------------------------------" | tee -a $LOG_FILE
echo "🏁 Sync Finished at $(date)" | tee -a $LOG_FILE
echo "👉 Check $LOG_FILE for full details."
