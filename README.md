
# Async Task Processing System 
This is a hybrid task queue system built using Node.js for the API layer and Celery (Python) for background asynchronous task processing. It is designed to handle computational or I/O-heavy jobs off the main request/response lifecycle using a microservice-based architecture with message brokering and containerized deployment via Docker and Docker Compose.

1. **Nodejs**
-Acts as the frontend-facing REST API that handles HTTP requests and triggers background tasks by sending them to the message broker (RabbitMQ or Redis).
2. **RabbitMQ**
-Serves as the message broker between Node.js and Celery. It queues the tasks and delivers them reliably to Celery workers. RabbitMQ is feature-rich; Redis is faster for lightweight use cases.
3. **Celery-Worker**
-Consumes tasks from the message broker and executes long-running or asynchronous tasks (e.g., sending emails, processing data) in the background.

4. **Redis**
-Optionally used for Celery result backend, storing task status and results so that the API can later retrieve them if needed.
5. **Flower**
-A web-based tool for monitoring Celery tasks. It provides real-time insights into task execution, queues, retries, and failures.
# Project Overview
This project decouples heavy or blocking operations (like sending emails or batch processing data) from the main web server using an asynchronous task queue.
# Project Structure
```bash
CELERY-NODEJS/
│
├── api/                        # Node.js backend service
│   ├── src/
│   │   ├── controllers/        # Route controllers (e.g., taskController.js)
│   │   ├── middleware/         # Error handling middleware
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic layer
│   │   ├── utils/              # Utility functions (e.g., logger)
│   │   └── app.js              # Express app entry point
│   ├── .env                    # Node environment variables
│   ├── Dockerfile              # Dockerfile for Node.js app
│   ├── package.json            # Node.js project config
│
├── worker/                     # Python Celery worker
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py       # Celery configuration
│   │   └── task_definitions.py # Task function definitions
│   ├── venv/                   # Python virtual environment (optional, use Docker ideally)
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # Dockerfile for Python worker
│   ├── .env                    # Environment for Celery
│
├── docker-compose.yml          # Compose file to run services
├── .gitignore
└── README.md                   # Project overview and usage docs
```

# Set-up Instructions
1. **Clone the repo**
```bash
git clone https://github.com/Towshin05/Celery_Async_task.git

cd  CELERY_NODEJS
```
2. **Start all services**
```bash
docker-compose up --build
```

##  URLs & Ports

| Service        | URL                                              |
| -------------- | ------------------------------------------------ |
| Nodejs       | [http://localhost:5000](http://localhost:3000)   |
| RabbitMQ Admin | [http://localhost:15672](http://localhost:15672) |
| Flower Monitor | [http://localhost:5555](http://localhost:5555)   |



# API Curl
1. **Add Numbers**
```bash
curl -X POST http://localhost:3000/api/tasks \
-H "Content-Type: application/json" \
-d '{"task_name": "add_numbers", "args": [5, 10]}'
```
2. **Process_data**
```bash
curl -X POST http://localhost:3000/api/tasks \
-H "Content-Type: application/json" \
-d '{"task_name": "process_data", "args": ["hello", 2]}'
```
3. **Send Email**
```bash
curl -X POST http://localhost:3000/api/tasks \
-H "Content-Type: application/json" \
-d '{"task_name": "send_email", "args": ["user@example.com", "Hi", "Hello there."]}'
```

4. **Failing Task**
```bash
curl -X POST http://localhost:3000/api/tasks \
-H "Content-Type: application/json" \
-d '{"task_name": "failing_task", "args": [true]}'
```
5. **Batch Process**
```bash
curl -X POST http://localhost:3000/api/tasks \
-H "Content-Type: application/json" \
-d '{"task_name": "batch_process", "args": [["apple", "banana", "carrot"]]}'
```


### Monitoring with Flower
-After running docker-compose up, visit: http://localhost:5555
 
![](./images/1.png)

### RabbitMQ Management UI
Default credentials: guest/guest
-Monitor queues, exchanges, and connections
![image](./images/2.png)


## Poridhi Lab Setup
1. Create load balancer and configure with your application's IP and port in Poridhi lab:
![image](./images/load.png)


2. Configure IP and port:
- Get IP from eth0 using `ifconfig`

<div align="center">
  <img src="images/if.png" alt="WhatsApp Image 2025-06-03 at 15 58 00_f2d59dd0" width="600">
</div>

- Use application port from Dockerfile



3. Access the application through load balancer:
At first we load the system following the instructions as in local machine and checking if all the ports are forwarded.
<div align="center">
  <img src="images/port.png" alt="Screenshot 2025-06-03 155900" width="600">
</div>


