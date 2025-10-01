const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const credentialController = require('../controllers/credential.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication and admin access
router.use(authenticate, requireAdmin);

router.post(
  '/',
  [
    body('credential_name').trim().notEmpty().withMessage('Credential name is required'),
    body('type').isIn(['bank', 'tax', 'upi', 'other']).withMessage('Invalid credential type'),
    body('payload').isObject().withMessage('Payload must be an object'),
    body('is_active').optional().isBoolean(),
    body('notes').optional().trim()
  ],
  validate,
  credentialController.createCredential
);

router.get('/', credentialController.getCredentials);
router.get('/:id', credentialController.getCredential);
router.patch('/:id', credentialController.updateCredential);
router.delete('/:id', credentialController.deleteCredential);

module.exports = router;
