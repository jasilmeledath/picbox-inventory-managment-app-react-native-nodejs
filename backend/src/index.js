const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : true, // Allow all origins in development for mobile testing
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for locally stored PDFs
app.use('/invoices', express.static(path.join(__dirname, '../invoices')));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/credentials', require('./routes/credential.routes'));
app.use('/api/company-credentials', require('./routes/companyCredential.routes'));
app.use('/api/uploads', require('./routes/upload.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/backup', require('./routes/backup.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Listen on all network interfaces for mobile device access
const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`� Local access: http://localhost:${PORT}/api-docs`);
  logger.info(`📱 Network access: http://192.168.220.35:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
