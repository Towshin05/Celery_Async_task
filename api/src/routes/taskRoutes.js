const express = require('express');
const TaskController = require('../controllers/taskController');

const router = express.Router();

// Submit a new task
router.post('/', TaskController.validateSubmitTask(), TaskController.submitTask);

// Get task status by ID
router.get('/:taskId', TaskController.getTaskStatus);

// Get all tasks
router.get('/', TaskController.getAllTasks);

// Get available task types
router.get('/types/available', TaskController.getTaskTypes);

module.exports = router;