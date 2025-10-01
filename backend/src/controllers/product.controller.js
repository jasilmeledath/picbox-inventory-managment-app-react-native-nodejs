const Product = require('../models/Product');
const logger = require('../config/logger');

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private
 */
exports.createProduct = async (req, res) => {
  try {
    const { sku, name, description, purchase_type, purchase_cost } = req.body;

    // Validate purchase_cost for new products
    if (purchase_type === 'new' && (purchase_cost === null || purchase_cost === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Purchase cost is required for new products'
      });
    }

    const product = new Product({
      sku,
      name,
      description,
      purchase_type,
      purchase_cost: purchase_type === 'new' ? purchase_cost : null
    });

    await product.save();

    logger.info(`Product created: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Private
 */
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, purchase_type } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Purchase type filter
    if (purchase_type) {
      query.purchase_type = purchase_type;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Private
 */
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

/**
 * @desc    Update product
 * @route   PATCH /api/products/:id
 * @access  Private
 */
exports.updateProduct = async (req, res) => {
  try {
    const { sku, name, description, purchase_type, purchase_cost } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields
    if (sku !== undefined) product.sku = sku;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (purchase_type !== undefined) {
      product.purchase_type = purchase_type;
      // Validate purchase_cost for new products
      if (purchase_type === 'new' && (purchase_cost === null || purchase_cost === undefined)) {
        return res.status(400).json({
          success: false,
          message: 'Purchase cost is required for new products'
        });
      }
    }
    if (purchase_cost !== undefined) product.purchase_cost = purchase_cost;

    await product.save();

    logger.info(`Product updated: ${product.name}`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.deleteOne();

    logger.info(`Product deleted: ${product.name}`);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};
