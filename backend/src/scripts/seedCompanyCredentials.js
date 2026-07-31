const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const CompanyCredential = require('../models/CompanyCredential');

const companyCredentials = [
  {
    company_name: 'Picbox',
    display_name: 'PICBOX Sound & Lighting',
    address: {
      line1: '123 Sound Street',
      line2: 'Entertainment District',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    contact: {
      primary_phone: '+91 98765 43210',
      alternate_phone: '+91 98765 43211',
      email: 'contact@picbox.com'
    },
    bank_details: {
      account_name: 'PICBOX SOUND & LIGHTING',
      account_number: '1234567890',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      branch: 'Mumbai Main Branch'
    },
    upi_details: {
      upi_id: 'picbox@paytm',
      google_pay_number: '+91 98765 43210',
      payee_name: 'PICBOX'
    },
    tax_details: {
      gstin: '27XXXXX1234X1Z5',
      pan: 'ABCDE1234F'
    },
    is_active: true,
    notes: 'Default company credentials for Picbox brand'
  },
  {
    company_name: 'Echo',
    display_name: 'ECHO Events & Entertainment',
    address: {
      line1: '456 Music Avenue',
      line2: 'Arts Quarter',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002'
    },
    contact: {
      primary_phone: '+91 98765 54321',
      alternate_phone: '+91 98765 54322',
      email: 'contact@echo.com'
    },
    bank_details: {
      account_name: 'ECHO EVENTS & ENTERTAINMENT',
      account_number: '0987654321',
      ifsc_code: 'ICIC0001234',
      bank_name: 'ICICI Bank',
      branch: 'Mumbai South Branch'
    },
    upi_details: {
      upi_id: 'echo@paytm',
      google_pay_number: '+91 98765 54321',
      payee_name: 'ECHO'
    },
    tax_details: {
      gstin: '27YYYYY5678Y1Z5',
      pan: 'FGHIJ5678K'
    },
    is_active: true,
    notes: 'Default company credentials for Echo brand'
  }
];

async function seedCompanyCredentials() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Checking existing company credentials...');
    
    for (const credData of companyCredentials) {
      const existing = await CompanyCredential.findOne({ 
        company_name: credData.company_name 
      });

      if (existing) {
        console.log(`✓ ${credData.company_name} credentials already exist - skipping`);
      } else {
        const credential = new CompanyCredential(credData);
        await credential.save();
        console.log(`✅ Created ${credData.company_name} company credentials`);
      }
    }

    console.log('\n✅ Company credentials seeding complete!');
    console.log('\n📋 Summary:');
    const allCredentials = await CompanyCredential.find();
    allCredentials.forEach(cred => {
      console.log(`  - ${cred.company_name}: ${cred.display_name} (${cred.is_active ? 'Active' : 'Inactive'})`);
    });

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding company credentials:', error);
    process.exit(1);
  }
}

// Run the seeder
seedCompanyCredentials();
