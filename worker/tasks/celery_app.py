import os
from celery import Celery


# Create Celery instance
app = Celery('tasks')

# Configuration
app.conf.update(
    broker_url=os.getenv('CELERY_BROKER_URL', 'amqp://guest:guest@rabbitmq:5672//'),
    result_backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0'),
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    result_expires=3600,  # 1 hour
)

# Since task_definitions.py is in the same directory, use relative import
app.autodiscover_tasks(['worker.tasks.task_definitions'])

if __name__ == '__main__':
    app.start()
# try:
#     print("✓ task_definitions imported successfully")
# except ImportError as e:
#     print(f"✗ Failed to import task_definitions: {e}")
#     print(f"Current directory: {os.getcwd()}")
#     print(f"Files available: {os.listdir('.')}")

# if __name__ == '__main__':
#     app.start()