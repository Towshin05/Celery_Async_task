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

# Import tasks directly instead of using autodiscovery
# This ensures all tasks are registered when the app starts
from worker.tasks.task_definitions import (
    add_numbers,
    process_data,
    send_email,
    long_running_task,
    failing_task,
    batch_process
)

# Manually register tasks (optional - importing them is usually enough)
app.register_task(add_numbers)
app.register_task(process_data)
app.register_task(send_email)
app.register_task(long_running_task)
app.register_task(failing_task)
app.register_task(batch_process)

# Debug: Print registered tasks when module is loaded
print("=== Registered Tasks ===")
for task_name in app.tasks.keys():
    if not task_name.startswith('celery.'):  # Skip built-in celery tasks
        print(f"Task: {task_name}")
print("========================")

if __name__ == '__main__':
    app.start()