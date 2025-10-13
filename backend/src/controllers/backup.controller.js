const User = require('../models/User');
const Employee = require('../models/Employee');
const Product = require('../models/Product');
const Job = require('../models/Job');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const CompanyCredential = require('../models/CompanyCredential');
const Counter = require('../models/Counter');
const logger = require('../config/logger');

/**
 * @desc    Generate database backup (all collections in JSON format)
 * @route   GET /api/backup/download
 * @access  Private (Admin only)
 */
async function downloadBackup(req, res) {
  try {
    logger.info('Starting database backup generation...');

    // Fetch all data from all collections
    const [
      users,
      employees,
      products,
      jobs,
      invoices,
      payments,
      companyCredentials,
      counters
    ] = await Promise.all([
      User.find({}).lean(),
      Employee.find({}).lean(),
      Product.find({}).lean(),
      Job.find({}).populate('assigned_employees.employee_id', 'name').populate('rented_items.product_id', 'name').lean(),
      Invoice.find({}).populate('company_credentials').lean(),
      Payment.find({}).populate('employee_id', 'name').lean(),
      CompanyCredential.find({}).lean(),
      Counter.find({}).lean()
    ]);

    // Create backup object with metadata
    const backup = {
      metadata: {
        backup_date: new Date().toISOString(),
        backup_version: '1.0.0',
        database_name: 'picbox',
        total_collections: 8,
        record_counts: {
          users: users.length,
          employees: employees.length,
          products: products.length,
          jobs: jobs.length,
          invoices: invoices.length,
          payments: payments.length,
          companyCredentials: companyCredentials.length,
          counters: counters.length
        }
      },
      data: {
        users,
        employees,
        products,
        jobs,
        invoices,
        payments,
        companyCredentials,
        counters
      }
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `picbox_backup_${timestamp}.json`;

    // Set response headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send backup as JSON
    res.json(backup);

    logger.info(`✅ Database backup generated successfully: ${filename}`);
    logger.info(`Total records: ${JSON.stringify(backup.metadata.record_counts)}`);
  } catch (error) {
    logger.error('Database backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating database backup',
      error: error.message
    });
  }
}

/**
 * @desc    Get backup metadata (without full data)
 * @route   GET /api/backup/info
 * @access  Private (Admin only)
 */
async function getBackupInfo(req, res) {
  try {
    // Get counts from all collections
    const [
      usersCount,
      employeesCount,
      productsCount,
      jobsCount,
      invoicesCount,
      paymentsCount,
      companyCredentialsCount,
      countersCount
    ] = await Promise.all([
      User.countDocuments({}),
      Employee.countDocuments({}),
      Product.countDocuments({}),
      Job.countDocuments({}),
      Invoice.countDocuments({}),
      Payment.countDocuments({}),
      CompanyCredential.countDocuments({}),
      Counter.countDocuments({})
    ]);

    const totalRecords = usersCount + employeesCount + productsCount + 
                        jobsCount + invoicesCount + paymentsCount + 
                        companyCredentialsCount + countersCount;

    res.json({
      success: true,
      data: {
        total_collections: 8,
        total_records: totalRecords,
        collections: {
          users: usersCount,
          employees: employeesCount,
          products: productsCount,
          jobs: jobsCount,
          invoices: invoicesCount,
          payments: paymentsCount,
          companyCredentials: companyCredentialsCount,
          counters: countersCount
        },
        last_checked: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get backup info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving backup information',
      error: error.message
    });
  }
}

module.exports = {
  downloadBackup,
  getBackupInfo
};
