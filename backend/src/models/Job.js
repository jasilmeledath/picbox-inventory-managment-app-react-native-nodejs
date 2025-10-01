const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Job date is required']
  },
  assigned_employees: [{
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String
    },
    daily_wage: {
      type: Number,
      required: [true, 'Daily wage is required'],
      min: [0, 'Daily wage cannot be negative']
    },
    wage_status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    }
  }],
  rented_items: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
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
      required: [true, 'Rental rate is required'],
      min: [0, 'Rate cannot be negative']
    }
  }],
  expenses: [{
    type: {
      type: String,
      enum: ['transport', 'food', 'misc'],
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Expense amount cannot be negative']
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed'],
    default: 'planned'
  },
  total_cost: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate total cost before saving
jobSchema.pre('save', function(next) {
  // Sum of all wages
  const wagesCost = this.assigned_employees.reduce((sum, emp) => sum + emp.daily_wage, 0);
  
  // Sum of all rented items (qty × rate)
  const rentalCost = this.rented_items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  
  // Sum of all expenses
  const expensesCost = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  this.total_cost = wagesCost + rentalCost + expensesCost;
  next();
});

// Indexes for querying
jobSchema.index({ date: -1 });
jobSchema.index({ status: 1 });
jobSchema.index({ title: 'text' });

module.exports = mongoose.model('Job', jobSchema);
