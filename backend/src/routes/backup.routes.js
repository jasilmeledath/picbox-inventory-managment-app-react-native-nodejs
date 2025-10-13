const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/backup/info
 * @desc    Get backup information (record counts)
 * @access  Private (Admin only)
 */
router.get('/info', authenticate, backupController.getBackupInfo);

/**
 * @route   GET /api/backup/download
 * @desc    Download complete database backup in JSON format
 * @access  Private (Admin only)
 */
router.get('/download', authenticate, backupController.downloadBackup);

module.exports = router;
