const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoice.controller');
const { authenticate } = require('../middleware/auth');
const { uploadPdf } = require('../middleware/upload');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  [
    body('brand_type').isIn(['Picbox', 'Echo']).withMessage('Brand type must be Picbox or Echo'),
    body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
    body('event_name').optional().trim(),
    body('rented_items').isArray().withMessage('Rented items must be an array'),
    body('total_amount').isFloat({ min: 0 }).withMessage('Valid total amount is required'),
    body('paid_amount').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['draft', 'estimate', 'final']),
    body('company_credentials').optional().isMongoId()
  ],
  validate,
  invoiceController.createInvoice
);

router.get('/', invoiceController.getInvoices);

// Specific routes must come BEFORE generic :id routes
// Support both GET and POST for PDF generation (GET for direct download, POST for API calls)
router.get('/:id/generate-pdf', invoiceController.generatePDF);
router.post('/:id/generate-pdf', invoiceController.generatePDF);
router.post('/:id/upload', uploadPdf.single('pdf'), invoiceController.uploadPdf);

// Generic :id routes come last
router.get('/:id', invoiceController.getInvoice);
router.patch('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
