const Employee = require('../models/Employee');
const Payment = require('../models/Payment');
const Counter = require('../models/Counter');
const logger = require('../config/logger');
const mongoose = require('mongoose');

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private
 */
exports.createEmployee = async (req, res) => {
  try {
    const { name, role, phone } = req.body;

    // Get next employee ID
    const employeeId = await Counter.getNextSequence('employeeId');

    const employee = new Employee({
      employeeId,
      name,
      role,
      phone
    });

    await employee.save();

    logger.info(`Employee created: ${name} (ID: ${employeeId})`);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    logger.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
};

/**
 * @desc    Get all employees
 * @route   GET /api/employees
 * @access  Private
 */
exports.getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .sort({ employeeId: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Employee.countDocuments(query);

    res.json({
      success: true,
      data: employees,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

/**
 * @desc    Get single employee
 * @route   GET /api/employees/:id
 * @access  Private
 */
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    logger.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};

/**
 * @desc    Update employee
 * @route   PATCH /api/employees/:id
 * @access  Private
 */
exports.updateEmployee = async (req, res) => {
  try {
    const { name, role, phone } = req.body;

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (name !== undefined) employee.name = name;
    if (role !== undefined) employee.role = role;
    if (phone !== undefined) employee.phone = phone;

    await employee.save();

    logger.info(`Employee updated: ${employee.name}`);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    logger.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
};

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private
 */
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.deleteOne();

    logger.info(`Employee deleted: ${employee.name}`);

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    logger.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};

/**
 * @desc    Record employee payment
 * @route   POST /api/employees/:id/payments
 * @access  Private
 */
exports.recordPayment = async (req, res) => {
  try {
    const { amount, date, method, notes } = req.body;
    const employeeId = req.params.id;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    if (amount > employee.pendingSalary) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds pending salary (₹${employee.pendingSalary})`
      });
    }

    // Create payment record
    const payment = new Payment({
      employee_id: employeeId,
      amount,
      date: date || new Date(),
      method: method || 'cash',
      notes,
      recorded_by: req.user.userId
    });

    await payment.save();

    // Update employee salary fields
    employee.pendingSalary -= amount;
    employee.totalSalaryReceived += amount;
    await employee.save();

    logger.info(`Payment recorded for ${employee.name}: ₹${amount}`);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        employee: {
          _id: employee._id,
          name: employee.name,
          pendingSalary: employee.pendingSalary,
          totalSalaryReceived: employee.totalSalaryReceived
        }
      }
    });
  } catch (error) {
    logger.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
};

/**
 * @desc    Get employee payment history
 * @route   GET /api/employees/:id/payments
 * @access  Private
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const payments = await Payment.find({ employee_id: req.params.id })
      .populate('recorded_by', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Payment.countDocuments({ employee_id: req.params.id });

    res.json({
      success: true,
      data: payments,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};
