#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

echo "🚀 Starting Background Analysis Filler (Secure Mode)..."
echo "   This process will run in the background."
echo "   You can close this terminal window safely."

# Run with nohup to survive terminal closure
# Log output to fill_analysis.log
nohup venv/bin/python backend/etl/fill_missing_analyses.py > fill_analysis.log 2>&1 &

echo "✅ Process started! PID: $!"
echo "📄 Logs will be saved to: fill_analysis.log"
echo "   To check progress: tail -f fill_analysis.log"
