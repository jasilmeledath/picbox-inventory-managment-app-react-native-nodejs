const Credential = require('../models/Credential');
const logger = require('../config/logger');

/**
 * @desc    Create new credential
 * @route   POST /api/credentials
 * @access  Private (Admin only)
 */
exports.createCredential = async (req, res) => {
  try {
    const { credential_name, type, payload, is_active, notes } = req.body;

    const credential = new Credential({
      credential_name,
      type,
      payload,
      is_active: is_active !== undefined ? is_active : true,
      notes
    });

    await credential.save();

    logger.info(`Credential created: ${credential_name} (${type})`, {
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Credential created successfully',
      data: credential
    });
  } catch (error) {
    logger.error('Create credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating credential',
      error: error.message
    });
  }
};

/**
 * @desc    Get all credentials (with masked sensitive fields)
 * @route   GET /api/credentials
 * @access  Private (Admin only)
 */
exports.getCredentials = async (req, res) => {
  try {
    const { type, is_active } = req.query;

    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    const credentials = await Credential.find(query).sort({ createdAt: -1 });

    // Mask sensitive fields for list view
    const maskedCredentials = credentials.map(cred => cred.toSafeObject());

    res.json({
      success: true,
      data: maskedCredentials
    });
  } catch (error) {
    logger.error('Get credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching credentials',
      error: error.message
    });
  }
};

/**
 * @desc    Get single credential (full data)
 * @route   GET /api/credentials/:id
 * @access  Private (Admin only)
 */
exports.getCredential = async (req, res) => {
  try {
    const credential = await Credential.findById(req.params.id);

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    logger.info(`Credential accessed: ${credential.credential_name}`, {
      userId: req.user.userId
    });

    res.json({
      success: true,
      data: credential
    });
  } catch (error) {
    logger.error('Get credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching credential',
      error: error.message
    });
  }
};

/**
 * @desc    Update credential
 * @route   PATCH /api/credentials/:id
 * @access  Private (Admin only)
 */
exports.updateCredential = async (req, res) => {
  try {
    const { credential_name, type, payload, is_active, notes } = req.body;

    const credential = await Credential.findById(req.params.id);

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    if (credential_name !== undefined) credential.credential_name = credential_name;
    if (type !== undefined) credential.type = type;
    if (payload !== undefined) credential.payload = payload;
    if (is_active !== undefined) credential.is_active = is_active;
    if (notes !== undefined) credential.notes = notes;

    await credential.save();

    logger.info(`Credential updated: ${credential.credential_name}`, {
      userId: req.user.userId
    });

    res.json({
      success: true,
      message: 'Credential updated successfully',
      data: credential
    });
  } catch (error) {
    logger.error('Update credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating credential',
      error: error.message
    });
  }
};

/**
 * @desc    Delete credential
 * @route   DELETE /api/credentials/:id
 * @access  Private (Admin only)
 */
exports.deleteCredential = async (req, res) => {
  try {
    const credential = await Credential.findById(req.params.id);

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    await credential.deleteOne();

    logger.info(`Credential deleted: ${credential.credential_name}`, {
      userId: req.user.userId
    });

    res.json({
      success: true,
      message: 'Credential deleted successfully'
    });
  } catch (error) {
    logger.error('Delete credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting credential',
      error: error.message
    });
  }
};
