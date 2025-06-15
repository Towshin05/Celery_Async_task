import time
import random
from celery import current_task

# Import the app instance from celery_app
from celery_app import app

@app.task(bind=True)
def add_numbers(self, a, b):
    """Add two numbers together"""
    try:
        result = a + b
        return {
            'result': result,
            'task_id': self.request.id,
            'message': f'Successfully added {a} + {b} = {result}'
        }
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)

@app.task(bind=True)
def process_data(self, data, delay=0):
    """Process data with optional delay"""
    try:
        if delay > 0:
            time.sleep(delay)
        
        processed_data = {
            'original': data,
            'processed': data.upper() if isinstance(data, str) else str(data),
            'length': len(str(data)),
            'processed_at': time.time()
        }
        
        return {
            'result': processed_data,
            'task_id': self.request.id,
            'message': 'Data processed successfully'
        }
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)

@app.task(bind=True)
def send_email(self, recipient, subject, body):
    """Simulate sending email"""
    try:
        # Simulate email sending delay
        time.sleep(2)
        
        return {
            'result': {
                'recipient': recipient,
                'subject': subject,
                'body': body,
                'sent_at': time.time(),
                'status': 'sent'
            },
            'task_id': self.request.id,
            'message': f'Email sent successfully to {recipient}'
        }
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)

@app.task(bind=True)
def long_running_task(self, duration=10, steps=10):
    """Simulate long running task with progress updates"""
    try:
        step_duration = duration / steps
        
        for i in range(steps):
            time.sleep(step_duration)
            
            # Update task progress
            current_task.update_state(
                state='PROGRESS',
                meta={
                    'current': i + 1,
                    'total': steps,
                    'percentage': ((i + 1) / steps) * 100,
                    'status': f'Processing step {i + 1} of {steps}'
                }
            )
        
        return {
            'result': {
                'duration': duration,
                'steps_completed': steps,
                'completed_at': time.time()
            },
            'task_id': self.request.id,
            'message': f'Long running task completed in {duration} seconds'
        }
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)

@app.task(bind=True)
def failing_task(self, should_fail=True):
    """Task that demonstrates error handling"""
    if should_fail:
        raise Exception("This task is designed to fail")
    
    return {
        'result': 'Task completed successfully',
        'task_id': self.request.id,
        'message': 'This task did not fail'
    }

@app.task(bind=True)
def batch_process(self, items):
    """Process a batch of items"""
    try:
        results = []
        total_items = len(items)
        
        for i, item in enumerate(items):
            # Simulate processing time
            time.sleep(0.5)
            
            processed_item = {
                'original': item,
                'processed': f"processed_{item}",
                'index': i
            }
            results.append(processed_item)
            
            # Update progress
            current_task.update_state(
                state='PROGRESS',
                meta={
                    'current': i + 1,
                    'total': total_items,
                    'percentage': ((i + 1) / total_items) * 100,
                    'status': f'Processed {i + 1} of {total_items} items'
                }
            )
        
        return {
            'result': results,
            'task_id': self.request.id,
            'message': f'Successfully processed {total_items} items'
        }
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)