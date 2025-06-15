const { body, validationResult } = require('express-validator');
const celeryService = require('../services/celeryService');
const logger = require('../utils/logger');

class TaskController {
  // Submit a new task
  static async submitTask(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { task_name, args = [], kwargs = {}, options = {} } = req.body;

      // Submit task to Celery
      const result = await celeryService.submitTask(task_name, args, kwargs, options);

      res.status(202).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get task status
  static async getTaskStatus(req, res, next) {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: 'Task ID is required'
        });
      }

      const result = await celeryService.getTaskStatus(taskId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all tasks
  static async getAllTasks(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const result = await celeryService.getAllTasks(limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available task types
  static async getTaskTypes(req, res, next) {
    try {
      const taskTypes = [
        {
          name: 'tasks.add_numbers',
          description: 'Add two numbers together',
          parameters: ['number1', 'number2']
        },
        {
          name: 'tasks.process_data',
          description: 'Process data with optional delay',
          parameters: ['data', 'delay']
        },
        {
          name: 'tasks.send_email',
          description: 'Send email notification',
          parameters: ['recipient', 'subject', 'body']
        },
        {
          name: 'tasks.long_running_task',
          description: 'Simulate long running task',
          parameters: ['duration', 'steps']
        }
      ];

      res.status(200).json({
        success: true,
        data: taskTypes
      });
    } catch (error) {
      next(error);
    }
  }

  // Validation rules
  static validateSubmitTask() {
    return [
      body('task_name')
        .notEmpty()
        .withMessage('Task name is required')
        .isString()
        .withMessage('Task name must be a string'),
      body('args')
        .optional()
        .isArray()
        .withMessage('Args must be an array'),
      body('kwargs')
        .optional()
        .isObject()
        .withMessage('Kwargs must be an object'),
      body('options')
        .optional()
        .isObject()
        .withMessage('Options must be an object')
    ];
  }
}

module.exports = TaskController;