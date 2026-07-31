/**
 * Test PDF Generation Locally
 * 
 * Usage: node test-pdf-generation.js
 * 
 * This script tests the PDF generation without hitting the full API
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const mongoose = require('mongoose');
const { generateInvoicePDF } = require('./src/utils/pdfGenerator');

// Sample invoice data
const sampleInvoice = {
  invoice_number: 1,
  brand_type: 'Picbox',
  customer_name: 'Test Customer',
  event_name: 'Test Event',
  rented_items: [
    {
      product_id: '507f1f77bcf86cd799439011',
      name: 'DJ Speaker Set',
      qty: 2,
      rate: 5000
    },
    {
      product_id: '507f1f77bcf86cd799439012',
      name: 'LED Wall Panel',
      qty: 1,
      rate: 10000
    }
  ],
  subtotal: 20000,
  discount: 2000,
  discount_percentage: 10,
  total_amount: 18000,
  paid_amount: 10000,
  pending_amount: 8000,
  status: 'final',
  date: new Date()
};

// Sample company credential
const sampleCompanyCredential = {
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
  is_active: true
};

async function testPDFGeneration() {
  console.log('='.repeat(60));
  console.log('🧪 Testing PDF Generation');
  console.log('='.repeat(60));
  
  try {
    console.log('\n1️⃣ Environment Check');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('   MongoDB URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Not set');
    
    console.log('\n2️⃣ Checking Puppeteer');
    const puppeteer = require('puppeteer');
    console.log('   Puppeteer version:', puppeteer._launcher._projectRoot);
    
    try {
      const execPath = puppeteer.executablePath();
      console.log('   Chrome path:', execPath);
      console.log('   Chrome exists:', fs.existsSync(execPath) ? '✅ Yes' : '❌ No');
    } catch (error) {
      console.log('   ⚠️ Could not detect Chrome path:', error.message);
    }
    
    console.log('\n3️⃣ Checking Assets');
    const picboxLogo = path.join(__dirname, 'assets/logos/picbox-logo.png');
    const echoLogo = path.join(__dirname, 'assets/logos/echo-logo.png');
    console.log('   Picbox logo:', fs.existsSync(picboxLogo) ? '✅ Exists' : '❌ Missing');
    console.log('   Echo logo:', fs.existsSync(echoLogo) ? '✅ Exists' : '❌ Missing');
    
    console.log('\n4️⃣ Generating Test PDF');
    console.log('   Invoice: #1 - Test Customer');
    console.log('   Amount: ₹18,000 (₹10,000 paid, ₹8,000 pending)');
    
    const startTime = Date.now();
    const pdfBuffer = await generateInvoicePDF(sampleInvoice, sampleCompanyCredential);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n5️⃣ PDF Generation Result');
    console.log('   ✅ SUCCESS!');
    console.log('   PDF size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
    console.log('   Generation time:', duration, 'seconds');
    
    // Save PDF to file
    const outputPath = path.join(__dirname, 'test-invoice.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log('   Saved to:', outputPath);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! PDF generation is working correctly.');
    console.log('='.repeat(60));
    console.log('\n📄 Open test-invoice.pdf to verify the output.\n');
    
    process.exit(0);
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    console.log('\n📋 Troubleshooting:');
    console.log('   1. Make sure Puppeteer is installed: npm install puppeteer');
    console.log('   2. Install Chrome: npx puppeteer browsers install chrome');
    console.log('   3. Check that assets/logos folder exists with logo files');
    console.log('   4. Verify Node.js version >= 18');
    console.log('\n');
    process.exit(1);
  }
}

// Run the test
testPDFGeneration();
