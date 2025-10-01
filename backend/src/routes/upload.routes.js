const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth');
const { uploadImage, uploadPdf } = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

router.post('/image', uploadImage.single('image'), uploadController.uploadImage);
router.post('/pdf', uploadPdf.single('pdf'), uploadController.uploadPdf);

module.exports = router;
