FROM python:3.11-slim

# Set working directory to root of the project
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything from project root
COPY . .




# Debug: Show what files we have
RUN echo "=== Files in container ===" && ls -la
RUN echo "=== Python files ===" && find . -name "*.py"

# Debug: Test imports
RUN echo "=== Testing imports ===" && \
    python -c "import celery_app; print('celery_app OK')" && \
    python -c "import task_definitions; print('task_definitions OK')" || echo "task_definitions FAILED"
# Create non-root user
RUN adduser --disabled-password --gecos '' celeryuser
RUN chown -R celeryuser:celeryuser /app
USER celeryuser

# Add /app to PYTHONPATH so Python can find 'worker'
ENV PYTHONPATH=/app

# Run celery from correct module path
CMD ["celery", "-A", "worker.tasks.celery_app", "worker", "--loglevel=info"]


