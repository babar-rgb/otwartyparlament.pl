#!/bin/bash
# Nightly Content Enrichment Script
# Fetches heavy content: Transcripts, Interpellations Body, Bills, and generates Official Links.

echo "Starting Nightly Content Enrichment..."
date

echo "1. Incremental Sync (Metadata + Official Links for MPs/Votes)"
.venv/bin/python -m backend.etl.incremental

echo "2. Bills & Prints (Includes PDF links)"
.venv/bin/python -m backend.etl.bills

echo "3. Interpellations (Fetching Body & Official Links)"
.venv/bin/python -m backend.etl.interpellations

echo "4. Speeches (Full Stenogram Transcripts)"
.venv/bin/python -m backend.etl.speeches

echo "Nightly Content Enrichment Completed."
date
