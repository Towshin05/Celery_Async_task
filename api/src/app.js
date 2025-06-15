// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');

// const taskRoutes = require('./routes/taskRoutes');
// const errorHandler = require('./middleware/errorHandler');
// const logger = require('./utils/logger');
// const celeryService = require('./services/celeryService');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Security middleware
// app.use(helmet());
// app.use(cors());

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use(limiter);

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Logging middleware
// app.use((req, res, next) => {
//   logger.info(`${req.method} ${req.path} - ${req.ip}`);
//   next();
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'healthy',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   });
// });

// // API routes
// app.use('/api/tasks', taskRoutes);

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found',
//     available_endpoints: [
//       'GET /health',
//       'GET /api/tasks/types/available',
//       'GET /api/tasks',
//       'POST /api/tasks',
//       'GET /api/tasks/:taskId'
//     ]
//   });
// });

// // Error handling middleware
// app.use(errorHandler);

// // Initialize Celery service and start server
// async function startServer() {
//   try {
//     // Initialize Celery service
//     await celeryService.connect();
//     logger.info('Celery service connected successfully');
    
//     // Start server
//     app.listen(PORT, () => {
//       logger.info(`API Server running on port ${PORT}`);
//     });
//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

// // Graceful shutdown
// process.on('SIGINT', async () => {
//   logger.info('Received SIGINT, shutting down gracefully');
//   await celeryService.close();
//   process.exit(0);
// });

// process.on('SIGTERM', async () => {
//   logger.info('Received SIGTERM, shutting down gracefully');
//   await celeryService.close();
//   process.exit(0);
// });

// // Start the application
// startServer();

// module.exports = app;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`API Server running on port ${PORT}`);
});

module.exports = app;