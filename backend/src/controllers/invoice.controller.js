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
      discount,
      discount_percentage,
      paid_amount,
      status,
      date,
      company_credentials
    } = req.body;

    // Calculate subtotal from items
    const subtotal = rented_items.reduce((sum, item) => {
      return sum + (item.qty * item.rate);
    }, 0);

    // Calculate discount amount
    let discountAmount = discount || 0;
    if (discount_percentage && discount_percentage > 0) {
      discountAmount = (subtotal * discount_percentage) / 100;
    }

    // Calculate total amount
    const total_amount = subtotal - discountAmount;
    const paidAmt = paid_amount || 0;
    const pending_amount = total_amount - paidAmt;

    const invoice = new Invoice({
      brand_type,
      customer_name,
      event_name,
      rented_items,
      subtotal,
      discount: discountAmount,
      discount_percentage: discount_percentage || 0,
      total_amount,
      paid_amount: paidAmt,
      pending_amount,
      status: status || 'draft',
      date: date || new Date(),
      company_credentials
    });

    await invoice.save();

    logger.info(`Invoice created for ${customer_name} - Subtotal: ${subtotal}, Discount: ${discountAmount}, Total: ${total_amount}`);

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
      'discount', 'discount_percentage', 'paid_amount', 'status', 'date', 'company_credentials'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        invoice[field] = req.body[field];
      }
    });

    // Recalculate amounts if items or discount changed
    if (req.body.rented_items || req.body.discount !== undefined || req.body.discount_percentage !== undefined) {
      const subtotal = invoice.rented_items.reduce((sum, item) => {
        return sum + (item.qty * item.rate);
      }, 0);

      invoice.subtotal = subtotal;

      // Calculate discount amount
      let discountAmount = invoice.discount || 0;
      if (invoice.discount_percentage && invoice.discount_percentage > 0) {
        discountAmount = (subtotal * invoice.discount_percentage) / 100;
        invoice.discount = discountAmount;
      }

      // Calculate total and pending
      invoice.total_amount = subtotal - discountAmount;
      invoice.pending_amount = invoice.total_amount - (invoice.paid_amount || 0);
    }

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
/**
 * @desc    Generate and download invoice PDF
 * @route   GET/POST /api/invoices/:id/generate-pdf
 * @access  Private
 */
exports.generatePDF = async (req, res) => {
  try {
    logger.info(`=== PDF Generation Started ===`);
    logger.info(`Invoice ID: ${req.params.id}`);
    logger.info(`Method: ${req.method}`);
    
    const invoice = await Invoice.findById(req.params.id)
      .populate('rented_items.product_id', 'name sku');

    if (!invoice) {
      logger.error(`Invoice not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    logger.info(`Found invoice #${invoice.invoice_number} for ${invoice.customer_name}`);

    // Get company credentials based on brand_type
    const companyCredential = await CompanyCredential.findOne({
      company_name: invoice.brand_type,
      is_active: true
    });

    if (!companyCredential) {
      logger.error(`Company credentials not found for ${invoice.brand_type}`);
      return res.status(404).json({
        success: false,
        message: `Company credentials not found for ${invoice.brand_type}. Please configure company details first.`
      });
    }

    logger.info(`Found company credentials for ${invoice.brand_type}`);

    // Generate PDF
    logger.info(`Generating PDF for invoice ${invoice.invoice_number}...`);
    const pdfBuffer = await generateInvoicePDF(invoice.toObject(), companyCredential.toObject());

    logger.info(`PDF buffer generated, size: ${pdfBuffer.length} bytes`);

    // Set response headers for PDF download
    const fileName = `invoice_${invoice.invoice_number}_${invoice.customer_name.replace(/\s+/g, '_')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Accept-Ranges', 'bytes');
    
    logger.info(`Sending PDF to client: ${fileName}`);
    logger.info(`Response headers set:`, {
      contentType: 'application/pdf',
      contentLength: pdfBuffer.length,
      fileName: fileName
    });
    
    // Send PDF buffer directly to client - use end() instead of send()
    res.end(pdfBuffer, 'binary');

    logger.info(`✅ PDF generated and sent for download: ${fileName}`);
  } catch (error) {
    logger.error('❌ Generate PDF error:', error);
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
