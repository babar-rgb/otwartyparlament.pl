FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for psycopg2, etc)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project code
# Note: We copy valid python packages. 
# It's better to mount or copy specific dirs, but for simplicity we copy root to /app
COPY . .

# Set PYTHONPATH to verify imports work
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Run Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
