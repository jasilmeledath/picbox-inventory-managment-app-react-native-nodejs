const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const {
  createCompanyCredential,
  getCompanyCredentials,
  getCompanyCredential,
  getCompanyCredentialByName,
  updateCompanyCredential,
  deleteCompanyCredential
} = require('../controllers/companyCredential.controller');

// All routes require authentication
router.use(authenticate);

// Company credential routes
router.route('/')
  .get(getCompanyCredentials)
  .post(uploadImage.single('logo'), createCompanyCredential);

router.route('/by-name/:companyName')
  .get(getCompanyCredentialByName);

router.route('/:id')
  .get(getCompanyCredential)
  .patch(uploadImage.single('logo'), updateCompanyCredential)
  .delete(deleteCompanyCredential);

module.exports = router;
