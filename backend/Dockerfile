# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code into backend package directory to support relative imports
COPY . backend/
ENV PYTHONPATH=/app

# Run application as a package, listening on $PORT (default 8000)
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
