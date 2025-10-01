const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values but unique non-null values
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  purchase_type: {
    type: String,
    enum: ['new', 'existing'],
    required: [true, 'Purchase type is required']
  },
  purchase_cost: {
    type: Number,
    min: [0, 'Purchase cost cannot be negative'],
    validate: {
      validator: function(value) {
        // If purchase_type is 'new', purchase_cost is required
        if (this.purchase_type === 'new' && (value === null || value === undefined)) {
          return false;
        }
        return true;
      },
      message: 'Purchase cost is required for new products'
    }
  }
}, {
  timestamps: true
});

// Index for search optimization
productSchema.index({ name: 'text', description: 'text' });
// Note: sku index is already created by sparse: true in schema

module.exports = mongoose.model('Product', productSchema);
