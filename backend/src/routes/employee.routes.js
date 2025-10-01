const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const employeeController = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Employee name is required'),
    body('role').optional().trim(),
    body('phone').optional().trim()
  ],
  validate,
  employeeController.createEmployee
);

router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployee);
router.patch('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

/**
 * @swagger
 * /api/employees/{id}/payments:
 *   post:
 *     summary: Record payment for employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/payments',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid payment amount is required'),
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('method').optional().isIn(['cash', 'bank_transfer', 'upi', 'other']),
    body('notes').optional().trim()
  ],
  validate,
  employeeController.recordPayment
);

router.get('/:id/payments', employeeController.getPaymentHistory);

module.exports = router;
