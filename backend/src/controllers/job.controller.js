const Job = require('../models/Job');
const Employee = require('../models/Employee');
const logger = require('../config/logger');
const mongoose = require('mongoose');

/**
 * @desc    Create new job
 * @route   POST /api/jobs
 * @access  Private
 */
exports.createJob = async (req, res) => {
  try {
    const { title, date, assigned_employees, rented_items, expenses, status } = req.body;

    // Log received data for debugging
    logger.info('Received job data:', {
      title,
      date,
      status,
      assigned_employees_count: assigned_employees?.length || 0,
      rented_items_count: rented_items?.length || 0,
      expenses_count: expenses?.length || 0
    });

    // Create job
    const job = new Job({
      title,
      date,
      assigned_employees: assigned_employees || [],
      rented_items: rented_items || [],
      expenses: expenses || [],
      status: status || 'planned'
    });

    await job.save();

    // Update employee pending salaries
    if (assigned_employees && assigned_employees.length > 0) {
      for (const assignedEmp of assigned_employees) {
        const employee = await Employee.findById(assignedEmp.employee_id);
        
        if (!employee) {
          return res.status(404).json({
            success: false,
            message: `Employee not found: ${assignedEmp.employee_id}`
          });
        }

        // Increment pending salary
        employee.pendingSalary += assignedEmp.daily_wage;
        await employee.save();

        logger.info(`Incremented pending salary for ${employee.name}: +₹${assignedEmp.daily_wage}`);
      }
    }

    logger.info(`Job created: ${title}`);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    logger.error('Create job error:', error);
    
    // Log validation errors in detail
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      logger.error('Validation errors:', validationErrors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message
    });
  }
};

/**
 * @desc    Get all jobs
 * @route   GET /api/jobs
 * @access  Private
 */
exports.getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date_from, date_to, search } = req.query;

    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (date_from || date_to) {
      query.date = {};
      if (date_from) query.date.$gte = new Date(date_from);
      if (date_to) query.date.$lte = new Date(date_to);
    }

    // Search filter
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const jobs = await Job.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Job.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

/**
 * @desc    Get single job
 * @route   GET /api/jobs/:id
 * @access  Private
 */
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('assigned_employees.employee_id', 'name role phone')
      .populate('rented_items.product_id', 'name sku');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
};

/**
 * @desc    Update job
 * @route   PATCH /api/jobs/:id
 * @access  Private
 */
exports.updateJob = async (req, res) => {
  try {
    const { title, date, assigned_employees, rented_items, expenses, status } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Handle wage adjustments if assigned_employees changed
    if (assigned_employees) {
      // Reverse old wages
      for (const oldEmp of job.assigned_employees) {
        const employee = await Employee.findById(oldEmp.employee_id);
        if (employee && oldEmp.wage_status === 'pending') {
          // Prevent negative pending salary (handles seeded data)
          const newPendingSalary = employee.pendingSalary - oldEmp.daily_wage;
          employee.pendingSalary = Math.max(0, newPendingSalary);
          await employee.save();
          
          if (newPendingSalary < 0) {
            logger.warn(`Prevented negative pending salary for ${employee.name}. Original: ${employee.pendingSalary + oldEmp.daily_wage}, Attempted: ${newPendingSalary}, Set to: 0`);
          }
        }
      }

      // Apply new wages
      for (const newEmp of assigned_employees) {
        const employee = await Employee.findById(newEmp.employee_id);
        if (!employee) {
          return res.status(404).json({
            success: false,
            message: `Employee not found: ${newEmp.employee_id}`
          });
        }
        if (newEmp.wage_status === 'pending') {
          employee.pendingSalary += newEmp.daily_wage;
          await employee.save();
        }
      }

      job.assigned_employees = assigned_employees;
    }

    // Update other fields
    if (title !== undefined) job.title = title;
    if (date !== undefined) job.date = date;
    if (rented_items !== undefined) job.rented_items = rented_items;
    if (expenses !== undefined) job.expenses = expenses;
    if (status !== undefined) job.status = status;

    await job.save();

    logger.info(`Job updated: ${job.title}`);

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    logger.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job',
      error: error.message
    });
  }
};

/**
 * @desc    Delete job
 * @route   DELETE /api/jobs/:id
 * @access  Private
 */
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Reverse wages for pending employees
    for (const assignedEmp of job.assigned_employees) {
      if (assignedEmp.wage_status === 'pending') {
        const employee = await Employee.findById(assignedEmp.employee_id);
        if (employee) {
          // Prevent negative pending salary (handles seeded data)
          const newPendingSalary = employee.pendingSalary - assignedEmp.daily_wage;
          employee.pendingSalary = Math.max(0, newPendingSalary);
          await employee.save();
          
          if (newPendingSalary < 0) {
            logger.warn(`Prevented negative pending salary for ${employee.name}. Original: ${employee.pendingSalary + assignedEmp.daily_wage}, Attempted: ${newPendingSalary}, Set to: 0`);
          }
        }
      }
    }

    await job.deleteOne();

    logger.info(`Job deleted: ${job.title}`);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    logger.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message
    });
  }
};

/**
 * @desc    Add expense to job
 * @route   POST /api/jobs/:id/expenses
 * @access  Private
 */
exports.addExpense = async (req, res) => {
  try {
    const { type, amount, date, notes } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.expenses.push({
      type,
      amount,
      date: date || new Date(),
      notes
    });

    await job.save();

    logger.info(`Expense added to job ${job.title}: ₹${amount}`);

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: job
    });
  } catch (error) {
    logger.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding expense',
      error: error.message
    });
  }
};
