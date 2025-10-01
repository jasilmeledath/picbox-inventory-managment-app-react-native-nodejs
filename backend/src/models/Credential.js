const mongoose = require('mongoose');
const crypto = require('crypto');

const credentialSchema = new mongoose.Schema({
  credential_name: {
    type: String,
    required: [true, 'Credential name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['bank', 'tax', 'upi', 'other'],
    required: [true, 'Credential type is required']
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Credential payload is required']
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

// Encryption helpers
const algorithm = 'aes-256-cbc';

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

function encrypt(text) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const key = getEncryptionKey();
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// Encrypt payload before saving
credentialSchema.pre('save', function(next) {
  if (this.isModified('payload') && typeof this.payload === 'object') {
    try {
      this.payload = encrypt(this.payload);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Decrypt payload after finding
credentialSchema.post('find', function(docs) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      if (doc.payload && typeof doc.payload === 'string') {
        try {
          doc.payload = decrypt(doc.payload);
        } catch (error) {
          console.error('Decryption error:', error);
        }
      }
    });
  }
});

credentialSchema.post('findOne', function(doc) {
  if (doc && doc.payload && typeof doc.payload === 'string') {
    try {
      doc.payload = decrypt(doc.payload);
    } catch (error) {
      console.error('Decryption error:', error);
    }
  }
});

// Method to mask sensitive fields for list views
credentialSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  if (obj.payload) {
    if (obj.type === 'bank' && obj.payload.account_number) {
      const accNum = obj.payload.account_number;
      obj.payload.account_number = '****' + accNum.slice(-4);
    }
    if (obj.type === 'upi' && obj.payload.upi_id) {
      const upi = obj.payload.upi_id;
      const parts = upi.split('@');
      if (parts.length === 2) {
        obj.payload.upi_id = parts[0].slice(0, 3) + '****@' + parts[1];
      }
    }
  }
  
  return obj;
};

credentialSchema.index({ type: 1, is_active: 1 });

module.exports = mongoose.model('Credential', credentialSchema);
