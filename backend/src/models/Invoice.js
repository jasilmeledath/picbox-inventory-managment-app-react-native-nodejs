const mongoose = require('mongoose');
const Counter = require('./Counter');

const invoiceSchema = new mongoose.Schema({
  invoice_number: {
    type: Number,
    unique: true
  },
  brand_type: {
    type: String,
    enum: ['Picbox', 'Echo'],
    required: [true, 'Brand type is required']
  },
  customer_name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  event_name: {
    type: String,
    trim: true
  },
  rented_items: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: {
      type: String,
      required: true
    },
    qty: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative']
    }
  }],
  total_amount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paid_amount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  pending_amount: {
    type: Number,
    default: 0,
    min: [0, 'Pending amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['draft', 'estimate', 'final'],
    default: 'draft'
  },
  date: {
    type: Date,
    default: Date.now
  },
  pdf: {
    url: String,
    public_id: String
  },
  company_credentials: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyCredential'
  }
}, {
  timestamps: true
});

// Calculate pending amount before saving
invoiceSchema.pre('save', async function(next) {
  this.pending_amount = this.total_amount - this.paid_amount;
  
  // Auto-generate invoice_number if not set (for new invoices)
  if (this.isNew && !this.invoice_number) {
    try {
      const counter = await Counter.getNextSequence('invoice');
      this.invoice_number = counter;
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Indexes for querying
invoiceSchema.index({ date: -1 });
invoiceSchema.index({ brand_type: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ customer_name: 'text' });

module.exports = mongoose.model('Invoice', invoiceSchema);
