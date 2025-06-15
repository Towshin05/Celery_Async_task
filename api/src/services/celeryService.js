const amqp = require('amqplib');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class CeleryService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.redisClient = null;
  }

  async connect() {
    try {
      // Connect to RabbitMQ
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Declare queue
      await this.channel.assertQueue('celery', { durable: true });
      
      // Connect to Redis
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL
      });
      await this.redisClient.connect();
      
      logger.info('Connected to RabbitMQ and Redis');
    } catch (error) {
      logger.error('Failed to connect to message broker or result backend:', error);
      throw error;
    }
  }

  async submitTask(taskName, args = [], kwargs = {}, options = {}) {
    if (!this.channel || !this.redisClient) {
      await this.connect();
    }

    const taskId = uuidv4();
    const task = {
      id: taskId,
      task: taskName,
      args: args,
      kwargs: kwargs,
      retries: 0,
      eta: options.eta || null,
      expires: options.expires || null,
      utc: true,
      callbacks: null,
      errbacks: null,
      timelimit: [null, null],
      taskset: null,
      chord: null,
      ...options
    };

    try {
      // Send task to RabbitMQ
      const message = JSON.stringify([args, kwargs, {
        callbacks: null,
        errbacks: null,
        chain: null,
        chord: null
      }]);

      await this.channel.sendToQueue('celery', Buffer.from(message), {
        persistent: true,
        headers: {
          'lang': 'py',
          'task': taskName,
          'id': taskId,
          'shadow': null,
          'eta': null,
          'expires': null,
          'group': null,
          'retries': 0,
          'timelimit': [null, null],
          'root_id': taskId,
          'parent_id': null,
          'argsrepr': JSON.stringify(args),
          'kwargsrepr': JSON.stringify(kwargs),
          'origin': 'gen1@nodejs-api'
        },
        correlationId: taskId
      });

      // Store task metadata in Redis
      await this.redisClient.hSet(`celery-task-meta-${taskId}`, {
        status: 'PENDING',
        result: null,
        traceback: null,
        children: '[]',
        date_created: new Date().toISOString(),
        task_id: taskId
      });

      logger.info(`Task ${taskId} submitted successfully`);
      
      return {
        task_id: taskId,
        status: 'PENDING',
        message: 'Task submitted successfully'
      };
    } catch (error) {
      logger.error(`Failed to submit task: ${error.message}`);
      throw error;
    }
  }

  async getTaskStatus(taskId) {
    if (!this.redisClient) {
      await this.connect();
    }

    try {
      const taskData = await this.redisClient.hGetAll(`celery-task-meta-${taskId}`);
      
      if (Object.keys(taskData).length === 0) {
        return {
          task_id: taskId,
          status: 'PENDING',
          result: null
        };
      }

      return {
        task_id: taskId,
        status: taskData.status,
        result: taskData.result ? JSON.parse(taskData.result) : null,
        traceback: taskData.traceback,
        date_created: taskData.date_created,
        date_done: taskData.date_done || null
      };
    } catch (error) {
      logger.error(`Failed to get task status: ${error.message}`);
      throw error;
    }
  }

  async getAllTasks(limit = 50, offset = 0) {
    if (!this.redisClient) {
      await this.connect();
    }

    try {
      const keys = await this.redisClient.keys('celery-task-meta-*');
      const tasks = [];

      for (const key of keys.slice(offset, offset + limit)) {
        const taskData = await this.redisClient.hGetAll(key);
        const taskId = key.replace('celery-task-meta-', '');
        
        tasks.push({
          task_id: taskId,
          status: taskData.status,
          result: taskData.result ? JSON.parse(taskData.result) : null,
          date_created: taskData.date_created,
          date_done: taskData.date_done || null
        });
      }

      return {
        tasks,
        total: keys.length,
        limit,
        offset
      };
    } catch (error) {
      logger.error(`Failed to get all tasks: ${error.message}`);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      if (this.redisClient) await this.redisClient.quit();
      logger.info('Connections closed');
    } catch (error) {
      logger.error('Error closing connections:', error);
    }
  }
}

module.exports = new CeleryService();