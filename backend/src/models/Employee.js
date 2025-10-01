const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: Number,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  role: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  totalSalaryReceived: {
    type: Number,
    default: 0,
    min: [0, 'Total salary received cannot be negative']
  },
  pendingSalary: {
    type: Number,
    default: 0,
    min: [0, 'Pending salary cannot be negative']
  }
}, {
  timestamps: true
});

// Index for search optimization
employeeSchema.index({ name: 'text' });
// Note: employeeId index is already created by unique: true in schema

module.exports = mongoose.model('Employee', employeeSchema);
