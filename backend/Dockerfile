# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Ensure apscheduler is installed (force reinstall if needed)
RUN pip install --no-cache-dir apscheduler

# Copy application code
COPY . .

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
