#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

echo "🚀 Starting Master Plan Backfill (Gemini Expert Mode)..."
echo "   This will process historical data for Metro & Graphs."
echo "   Logs will be saved to: backfill_gemini.log"

# Use virtual environment python
PYTHON_PATH="./.venv/bin/python"
if [ ! -f "$PYTHON_PATH" ]; then
    PYTHON_PATH="./venv/bin/python"
fi

nohup $PYTHON_PATH scripts/backfill_analyses.py > backfill_gemini.log 2>&1 &

echo "✅ Process started with PID: $!"
echo "📄 To monitor usage: tail -f backfill_gemini.log"
