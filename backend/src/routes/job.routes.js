const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const jobController = require('../controllers/job.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Job title is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('assigned_employees').optional().isArray(),
    body('rented_items').optional().isArray(),
    body('expenses').optional().isArray(),
    body('status').optional().isIn(['planned', 'in-progress', 'completed'])
  ],
  validate,
  jobController.createJob
);

router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJob);
router.patch('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);

router.post(
  '/:id/expenses',
  [
    body('type').isIn(['transport', 'food', 'misc']).withMessage('Valid expense type required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('date').optional().isISO8601(),
    body('notes').optional().trim()
  ],
  validate,
  jobController.addExpense
);

module.exports = router;
