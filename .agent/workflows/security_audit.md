---
description: "Security Audit Workflow: Checks dependencies, secrets, and Docker security"
---

# Security Audit Workflow

This workflow performs a comprehensive security check of the application before deployment.
Following the `audit_plan.md`, it covers: Dependencies (SCA), Secrets Detection, and Docker Security.

## 1. Python Dependency Check (SCA)
**Goal:** Detect known vulnerabilities in backend libraries.

// turbo
1. Install security tools (pip-audit & safety)
pip install safety pip-audit

// turbo
2. Check installed packages (Primary Source)
cd backend && pip-audit --format json

// turbo
3. Secondary Check (Safety - Open DB)
cd backend && safety check --json

> **Pass Criteria:** No critical or high vulnerabilities found.

## 2. Frontend Dependency Audit
**Goal:** Detect vulnerabilities in npm packages.

// turbo
4. Run npm audit (JSON Output)
cd frontend && npm audit --json --audit-level=high

> **Pass Criteria:** No high/critical vulnerabilities.

## 3. Secrets Detection (Robust)
**Goal:** Prevent accidental commit of API keys, passwords, or tokens.

// turbo
5. Scan for secrets using Trivy (Containerized)
docker run --rm -v $(pwd):/src aquasec/trivy fs /src --scanners secret --format json

> **Pass Criteria:** No hardcoded secrets found in source code.

## 4. Docker Security Scan
**Goal:** Check base images for OS-level vulnerabilities.

6. Scan backend image (JSON Output)
# Note: User must approve docker run command
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL --format json active-backend:latest


> **Pass Criteria:** No OS-level critical CVEs in the container image.

## 5. Code Integrity & Build Check
**Goal:** Verify that recent changes didn't break the build or introduce critical syntax errors (which would crash the site immediately).

// turbo
7. Check for Git Merge Conflict Markers
grep -r "<<<<<<<" . --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=.git

// turbo
8. Backend Syntax Check (Compile)
cd backend && python3 -m compileall . -q

// turbo
9. Frontend Build Check (Type Safety)
cd frontend && npm run typecheck

> **Pass Criteria:** No syntax errors or type errors that prevent build.
