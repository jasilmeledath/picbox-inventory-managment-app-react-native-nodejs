require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Models
const User = require('../models/User');
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const Job = require('../models/Job');
const Invoice = require('../models/Invoice');
const Credential = require('../models/Credential');
const Counter = require('../models/Counter');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Employee.deleteMany({});
    await Job.deleteMany({});
    await Invoice.deleteMany({});
    await Credential.deleteMany({});
    await Counter.deleteMany({});
    logger.info('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@picbox.com',
      passwordHash: 'admin123',
      name: 'Admin User',
      isAdmin: true
    });
    logger.info('Created admin user');

    // Create products
    const products = await Product.insertMany([
      {
        sku: 'SPK-001',
        name: 'JBL EON615 Speaker',
        description: '15" Two-Way Multipurpose Self-Powered Sound Reinforcement',
        purchase_type: 'new',
        purchase_cost: 45000
      },
      {
        sku: 'MIC-001',
        name: 'Shure SM58 Microphone',
        description: 'Professional cardioid dynamic vocal microphone',
        purchase_type: 'new',
        purchase_cost: 8500
      },
      {
        sku: 'MIX-001',
        name: 'Yamaha MG16XU Mixer',
        description: '16-Channel Mixing Console',
        purchase_type: 'existing',
        purchase_cost: null
      },
      {
        sku: 'AMP-001',
        name: 'Crown XTi 4002 Amplifier',
        description: 'Two-channel, 1200W @ 4Ω power amplifier',
        purchase_type: 'new',
        purchase_cost: 95000
      },
      {
        sku: 'CABLE-001',
        name: 'XLR Cables (Set of 10)',
        description: '10m professional audio cables',
        purchase_type: 'existing',
        purchase_cost: null
      }
    ]);
    logger.info(`Created ${products.length} products`);

    // Create employees
    const employees = [];
    for (let i = 1; i <= 5; i++) {
      const employeeId = await Counter.getNextSequence('employeeId');
      const employee = await Employee.create({
        employeeId,
        name: `Employee ${i}`,
        role: i <= 2 ? 'Technician' : 'Helper',
        phone: `98765432${i}0`
      });
      employees.push(employee);
    }
    logger.info(`Created ${employees.length} employees`);

    // Create credentials
    const credentials = await Credential.insertMany([
      {
        credential_name: 'Picbox Main Account',
        type: 'bank',
        payload: {
          bank_name: 'HDFC Bank',
          account_number: '12345678901234',
          ifsc: 'HDFC0001234',
          account_holder_name: 'Picbox Sound Systems'
        },
        is_active: true,
        notes: 'Primary business account'
      },
      {
        credential_name: 'GST Registration',
        type: 'tax',
        payload: {
          gstin: '29ABCDE1234F1Z5'
        },
        is_active: true,
        notes: 'Karnataka GST'
      },
      {
        credential_name: 'Picbox UPI',
        type: 'upi',
        payload: {
          upi_id: 'picbox@paytm'
        },
        is_active: true,
        notes: 'Quick payment option'
      }
    ]);
    logger.info(`Created ${credentials.length} credentials`);

    // Create sample jobs
    const jobs = await Job.insertMany([
      {
        title: 'Wedding Event - Kumar Residence',
        date: new Date('2025-10-15'),
        assigned_employees: [
          {
            employee_id: employees[0]._id,
            name: employees[0].name,
            role: employees[0].role,
            daily_wage: 2000,
            wage_status: 'pending'
          },
          {
            employee_id: employees[1]._id,
            name: employees[1].name,
            role: employees[1].role,
            daily_wage: 2000,
            wage_status: 'pending'
          }
        ],
        rented_items: [
          {
            product_id: products[0]._id,
            name: products[0].name,
            qty: 4,
            rate: 3000
          },
          {
            product_id: products[1]._id,
            name: products[1].name,
            qty: 6,
            rate: 500
          }
        ],
        expenses: [
          {
            type: 'transport',
            amount: 1500,
            date: new Date('2025-10-15'),
            notes: 'Vehicle rental'
          },
          {
            type: 'food',
            amount: 800,
            date: new Date('2025-10-15'),
            notes: 'Team lunch'
          }
        ],
        status: 'completed'
      },
      {
        title: 'Corporate Event - Tech Summit 2025',
        date: new Date('2025-10-20'),
        assigned_employees: [
          {
            employee_id: employees[0]._id,
            name: employees[0].name,
            role: employees[0].role,
            daily_wage: 2500,
            wage_status: 'pending'
          }
        ],
        rented_items: [
          {
            product_id: products[2]._id,
            name: products[2].name,
            qty: 2,
            rate: 5000
          }
        ],
        expenses: [],
        status: 'planned'
      }
    ]);
    logger.info(`Created ${jobs.length} jobs`);

    // Update employee pending salaries based on jobs
    for (const emp of employees) {
      let pending = 0;
      for (const job of jobs) {
        const assignment = job.assigned_employees.find(
          a => a.employee_id.toString() === emp._id.toString() && a.wage_status === 'pending'
        );
        if (assignment) {
          pending += assignment.daily_wage;
        }
      }
      emp.pendingSalary = pending;
      await emp.save();
    }
    logger.info('Updated employee pending salaries');

    // Create sample invoices
    const invoices = await Invoice.insertMany([
      {
        brand_type: 'Picbox',
        customer_name: 'Mr. Kumar',
        event_name: 'Wedding Reception',
        rented_items: [
          {
            product_id: products[0]._id,
            name: products[0].name,
            qty: 4,
            rate: 3000
          },
          {
            product_id: products[1]._id,
            name: products[1].name,
            qty: 6,
            rate: 500
          }
        ],
        total_amount: 15000,
        paid_amount: 10000,
        pending_amount: 5000,
        status: 'final',
        date: new Date('2025-10-15'),
        company_credentials: credentials[0]._id
      },
      {
        brand_type: 'Echo',
        customer_name: 'TechCorp Solutions',
        event_name: 'Annual Conference',
        rented_items: [
          {
            product_id: products[2]._id,
            name: products[2].name,
            qty: 2,
            rate: 5000
          },
          {
            product_id: products[3]._id,
            name: products[3].name,
            qty: 1,
            rate: 8000
          }
        ],
        total_amount: 18000,
        paid_amount: 0,
        pending_amount: 18000,
        status: 'estimate',
        date: new Date('2025-10-20'),
        company_credentials: credentials[1]._id
      }
    ]);
    logger.info(`Created ${invoices.length} invoices`);

    logger.info('✅ Database seeded successfully!');
    logger.info('\nSample Credentials:');
    logger.info('Email: admin@picbox.com');
    logger.info('Password: admin123');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
