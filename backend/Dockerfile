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

# Copy the entire project code into 'backend' folder
# This matches the local structure where 'backend' is the package
COPY . /app/backend

# Set PYTHONPATH to /app so 'import backend.main' works
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Run Uvicorn - now 'backend.main' is valid because backend is a subdir of /app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
