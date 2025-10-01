const Invoice = require('../models/Invoice');
const CompanyCredential = require('../models/CompanyCredential');
const logger = require('../config/logger');
const { deleteFromCloudinary } = require('../middleware/upload');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const cloudinary = require('cloudinary').v2;

/**
 * @desc    Create new invoice
 * @route   POST /api/invoices
 * @access  Private
 */
exports.createInvoice = async (req, res) => {
  try {
    const {
      brand_type,
      customer_name,
      event_name,
      rented_items,
      total_amount,
      paid_amount,
      status,
      date,
      company_credentials
    } = req.body;

    const invoice = new Invoice({
      brand_type,
      customer_name,
      event_name,
      rented_items,
      total_amount,
      paid_amount: paid_amount || 0,
      status: status || 'draft',
      date: date || new Date(),
      company_credentials
    });

    await invoice.save();

    logger.info(`Invoice created for ${customer_name}`);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    logger.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

/**
 * @desc    Get all invoices
 * @route   GET /api/invoices
 * @access  Private
 */
exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, brand_type, status, search } = req.query;

    const query = {};

    if (brand_type) {
      query.brand_type = brand_type;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { event_name: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('company_credentials', 'credential_name type')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

/**
 * @desc    Get single invoice
 * @route   GET /api/invoices/:id
 * @access  Private
 */
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('company_credentials')
      .populate('rented_items.product_id', 'name sku');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

/**
 * @desc    Update invoice
 * @route   PATCH /api/invoices/:id
 * @access  Private
 */
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'brand_type', 'customer_name', 'event_name', 'rented_items',
      'total_amount', 'paid_amount', 'status', 'date', 'company_credentials'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        invoice[field] = req.body[field];
      }
    });

    await invoice.save();

    logger.info(`Invoice updated: ${invoice._id}`);

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    logger.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message
    });
  }
};

/**
 * @desc    Delete invoice
 * @route   DELETE /api/invoices/:id
 * @access  Private
 */
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Delete PDF from Cloudinary if exists
    if (invoice.pdf && invoice.pdf.public_id) {
      try {
        await deleteFromCloudinary(invoice.pdf.public_id);
      } catch (error) {
        logger.warn('Failed to delete PDF from Cloudinary:', error);
      }
    }

    await invoice.deleteOne();

    logger.info(`Invoice deleted: ${invoice._id}`);

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    logger.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message
    });
  }
};

/**
 * @desc    Generate PDF for invoice
 * @route   POST /api/invoices/:id/generate-pdf
 * @access  Private
 */
exports.generatePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('rented_items.product_id', 'name sku');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get company credentials based on brand_type
    const companyCredential = await CompanyCredential.findOne({
      company_name: invoice.brand_type,
      is_active: true
    });

    if (!companyCredential) {
      return res.status(404).json({
        success: false,
        message: `Company credentials not found for ${invoice.brand_type}. Please configure company details first.`
      });
    }

    // Generate PDF
    logger.info(`Generating PDF for invoice ${invoice.invoice_number}...`);
    const pdfBuffer = await generateInvoicePDF(invoice.toObject(), companyCredential.toObject());

    // Delete old PDF from Cloudinary if exists
    if (invoice.pdf && invoice.pdf.public_id) {
      try {
        await deleteFromCloudinary(invoice.pdf.public_id);
      } catch (error) {
        logger.warn('Failed to delete old PDF:', error);
      }
    }

    // Upload PDF to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'invoices',
          public_id: `invoice_${invoice.invoice_number}_${Date.now()}`,
          format: 'pdf'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(pdfBuffer);
    });

    const uploadResult = await uploadPromise;

    // Save PDF info to invoice
    invoice.pdf = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    };

    await invoice.save();

    logger.info(`PDF generated and uploaded for invoice ${invoice.invoice_number}`);

    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: {
        pdf_url: uploadResult.secure_url,
        invoice: invoice
      }
    });
  } catch (error) {
    logger.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
};

/**
 * @desc    Upload PDF to invoice
 * @route   POST /api/invoices/:id/upload
 * @access  Private
 */
exports.uploadPdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Delete old PDF if exists
    if (invoice.pdf && invoice.pdf.public_id) {
      try {
        await deleteFromCloudinary(invoice.pdf.public_id);
      } catch (error) {
        logger.warn('Failed to delete old PDF:', error);
      }
    }

    // Save new PDF info
    invoice.pdf = {
      url: req.file.path,
      public_id: req.file.filename
    };

    await invoice.save();

    logger.info(`PDF uploaded for invoice: ${invoice._id}`);

    res.json({
      success: true,
      message: 'PDF uploaded successfully',
      data: invoice
    });
  } catch (error) {
    logger.error('Upload PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading PDF',
      error: error.message
    });
  }
};
