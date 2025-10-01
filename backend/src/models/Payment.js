const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative']
  },
  date: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'other'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true
  },
  recorded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for querying payments by employee
paymentSchema.index({ employee_id: 1, date: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
