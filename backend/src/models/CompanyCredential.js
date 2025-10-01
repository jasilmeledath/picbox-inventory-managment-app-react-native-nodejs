const mongoose = require('mongoose');

const companyCredentialSchema = new mongoose.Schema({
  company_name: {
    type: String,
    enum: ['Picbox', 'Echo'],
    required: [true, 'Company name is required'],
    unique: true
  },
  display_name: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  address: {
    line1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true
    },
    line2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true
    }
  },
  contact: {
    primary_phone: {
      type: String,
      required: [true, 'Primary phone is required'],
      trim: true
    },
    alternate_phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  bank_details: {
    account_name: {
      type: String,
      trim: true
    },
    account_number: {
      type: String,
      trim: true
    },
    ifsc_code: {
      type: String,
      trim: true,
      uppercase: true
    },
    bank_name: {
      type: String,
      trim: true
    },
    branch: {
      type: String,
      trim: true
    }
  },
  upi_details: {
    upi_id: {
      type: String,
      trim: true,
      lowercase: true
    },
    google_pay_number: {
      type: String,
      trim: true
    },
    payee_name: {
      type: String,
      trim: true
    }
  },
  tax_details: {
    gstin: {
      type: String,
      trim: true,
      uppercase: true
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true
    }
  },
  logo: {
    url: {
      type: String
    },
    public_id: {
      type: String
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for quick lookup
companyCredentialSchema.index({ company_name: 1 });
companyCredentialSchema.index({ is_active: 1 });

module.exports = mongoose.model('CompanyCredential', companyCredentialSchema);
