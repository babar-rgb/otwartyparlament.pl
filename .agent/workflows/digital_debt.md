---
description: "Digital Debt Audit: Checks code quality, types, complexity, and technical debt metrics"
---

# Digital Debt Audit Workflow

This workflow measures and enforces code quality standards. It helps prevent "code rot" by ensuring all new code meets strict typing, linting, and complexity guidelines.

## 1. Python Code Quality (Backend)
**Goal:** Ensure backend code follows PEP8, has no unused imports, and no syntax errors.

// turbo
1. Install Quality Tools
pip install ruff mypy radon vulture

// turbo
2. Run Ruff Linter & Formatter Check (Fast)
cd backend && ruff check . --output-format=json

// turbo
3. Run Mypy Static Type Checker (Strict)
cd backend && mypy . --ignore-missing-imports

// turbo
4. Run Radon Complexity Check (Cyclomatic Complexity)
# Fails if any block has complexity > B (10)
cd backend && radon cc . -a -n B

> **Pass Criteria:** No linting errors, no type errors, no overly complex functions (Grade C or lower).

## 2. TypeScript Type Safety (Frontend)
**Goal:** Eliminate "any" types and prevent runtime crashes caused by type mismatches.

// turbo
5. Run TypeScript Compiler (No Emit)
cd frontend && npm run typecheck

> **Pass Criteria:** 0 errors. This is a hard blocker for production.

## 3. Frontend Linting & Style
**Goal:** Enforce consistent React/JS coding style.

// turbo
6. Run ESLint (JSON Output)
cd frontend && npm run lint -- --format json

> **Pass Criteria:** No errors.

## 4. Debt Metrics (Robust)
**Goal:** Track the accumulation of technical debt (TODOs/FIXMEs) over time using an embedded script.

// turbo
7. Run Debt Measurement Script (Embedded)
cat << 'EOF' > /tmp/measure_debt_temp.py
#!/usr/bin/env python3
import os
import json
import time

def count_patterns(root_dir):
    SKIP_DIRS = {'.git', 'node_modules', 'venv', '.venv', 'env', 'dist', 'build', '.next', 'out', 'coverage', '__pycache__', '.pytest_cache', '.mypy_cache', '.idea', '.vscode'}
    SKIP_EXTENSIONS = {'.pyc', '.pyo', '.pyd', '.so', '.dll', '.dylib', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.zip', '.tar', '.gz', '.7z', '.rar', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.db', '.sqlite', '.sqlite3', '.map', '.min.js', '.min.css'}
    counts = {"todos": 0, "fixmes": 0}
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for file in files:
            _, ext = os.path.splitext(file)
            if ext.lower() in SKIP_EXTENSIONS: continue
            try:
                with open(os.path.join(root, file), 'r', encoding='utf-8', errors='ignore') as f:
                    for line in f:
                        if "TODO" in line: counts["todos"] += 1
                        if "FIXME" in line: counts["fixmes"] += 1
            except: pass
    return counts

if __name__ == "__main__":
    print(json.dumps({"timestamp": int(time.time()), "metrics": count_patterns("."), "status": "success"}, indent=2))
EOF
python3 /tmp/measure_debt_temp.py && rm /tmp/measure_debt_temp.py

> **Action:** If this number grows by >10% in a week, review recent commits.

## 5. Dead Code Detection (Informational)
**Goal:** Find unused functions and variables (Soft Fail).

// turbo
8. Run Vulture (Allow Fail)
cd backend && vulture . --min-confidence 80 || true

> **Pass Criteria:** Informational only. Do not block deployment on this.
