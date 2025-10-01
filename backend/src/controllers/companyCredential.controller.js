const CompanyCredential = require('../models/CompanyCredential');
const logger = require('../config/logger');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

/**
 * @desc    Create company credential
 * @route   POST /api/company-credentials
 * @access  Private
 */
exports.createCompanyCredential = async (req, res) => {
  try {
    const {
      company_name,
      display_name,
      address,
      contact,
      bank_details,
      upi_details,
      tax_details,
      notes
    } = req.body;

    // Check if company credential already exists
    const existing = await CompanyCredential.findOne({ company_name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Company credential for ${company_name} already exists. Use update instead.`
      });
    }

    const companyCredential = new CompanyCredential({
      company_name,
      display_name,
      address,
      contact,
      bank_details,
      upi_details,
      tax_details,
      notes
    });

    // Handle logo upload if file is present
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      companyCredential.logo = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    await companyCredential.save();

    logger.info(`Company credential created for ${company_name}`);

    res.status(201).json({
      success: true,
      message: 'Company credential created successfully',
      data: companyCredential
    });
  } catch (error) {
    logger.error('Create company credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating company credential',
      error: error.message
    });
  }
};

/**
 * @desc    Get all company credentials
 * @route   GET /api/company-credentials
 * @access  Private
 */
exports.getCompanyCredentials = async (req, res) => {
  try {
    const { company_name, is_active } = req.query;

    const query = {};
    if (company_name) {
      query.company_name = company_name;
    }
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    const companyCredentials = await CompanyCredential.find(query)
      .sort({ company_name: 1 });

    res.json({
      success: true,
      data: companyCredentials
    });
  } catch (error) {
    logger.error('Get company credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company credentials',
      error: error.message
    });
  }
};

/**
 * @desc    Get single company credential
 * @route   GET /api/company-credentials/:id
 * @access  Private
 */
exports.getCompanyCredential = async (req, res) => {
  try {
    const companyCredential = await CompanyCredential.findById(req.params.id);

    if (!companyCredential) {
      return res.status(404).json({
        success: false,
        message: 'Company credential not found'
      });
    }

    res.json({
      success: true,
      data: companyCredential
    });
  } catch (error) {
    logger.error('Get company credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company credential',
      error: error.message
    });
  }
};

/**
 * @desc    Get company credential by company name
 * @route   GET /api/company-credentials/by-name/:companyName
 * @access  Private
 */
exports.getCompanyCredentialByName = async (req, res) => {
  try {
    const companyCredential = await CompanyCredential.findOne({ 
      company_name: req.params.companyName 
    });

    if (!companyCredential) {
      return res.status(404).json({
        success: false,
        message: 'Company credential not found'
      });
    }

    res.json({
      success: true,
      data: companyCredential
    });
  } catch (error) {
    logger.error('Get company credential by name error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company credential',
      error: error.message
    });
  }
};

/**
 * @desc    Update company credential
 * @route   PATCH /api/company-credentials/:id
 * @access  Private
 */
exports.updateCompanyCredential = async (req, res) => {
  try {
    const companyCredential = await CompanyCredential.findById(req.params.id);

    if (!companyCredential) {
      return res.status(404).json({
        success: false,
        message: 'Company credential not found'
      });
    }

    const {
      display_name,
      address,
      contact,
      bank_details,
      upi_details,
      tax_details,
      is_active,
      notes
    } = req.body;

    // Update fields
    if (display_name !== undefined) companyCredential.display_name = display_name;
    if (address !== undefined) companyCredential.address = { ...companyCredential.address, ...address };
    if (contact !== undefined) companyCredential.contact = { ...companyCredential.contact, ...contact };
    if (bank_details !== undefined) companyCredential.bank_details = { ...companyCredential.bank_details, ...bank_details };
    if (upi_details !== undefined) companyCredential.upi_details = { ...companyCredential.upi_details, ...upi_details };
    if (tax_details !== undefined) companyCredential.tax_details = { ...companyCredential.tax_details, ...tax_details };
    if (is_active !== undefined) companyCredential.is_active = is_active;
    if (notes !== undefined) companyCredential.notes = notes;

    // Handle logo upload if new file is present
    if (req.file) {
      // Delete old logo from Cloudinary if exists
      if (companyCredential.logo && companyCredential.logo.public_id) {
        await deleteFromCloudinary(companyCredential.logo.public_id);
      }

      const result = await uploadToCloudinary(req.file);
      companyCredential.logo = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    await companyCredential.save();

    logger.info(`Company credential updated for ${companyCredential.company_name}`);

    res.json({
      success: true,
      message: 'Company credential updated successfully',
      data: companyCredential
    });
  } catch (error) {
    logger.error('Update company credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company credential',
      error: error.message
    });
  }
};

/**
 * @desc    Delete company credential
 * @route   DELETE /api/company-credentials/:id
 * @access  Private
 */
exports.deleteCompanyCredential = async (req, res) => {
  try {
    const companyCredential = await CompanyCredential.findById(req.params.id);

    if (!companyCredential) {
      return res.status(404).json({
        success: false,
        message: 'Company credential not found'
      });
    }

    // Delete logo from Cloudinary if exists
    if (companyCredential.logo && companyCredential.logo.public_id) {
      await deleteFromCloudinary(companyCredential.logo.public_id);
    }

    await companyCredential.deleteOne();

    logger.info(`Company credential deleted for ${companyCredential.company_name}`);

    res.json({
      success: true,
      message: 'Company credential deleted successfully'
    });
  } catch (error) {
    logger.error('Delete company credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company credential',
      error: error.message
    });
  }
};
