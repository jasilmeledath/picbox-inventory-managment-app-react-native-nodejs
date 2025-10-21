const mongoose = require('mongoose');
const path = require('path');
const Employee = require('../models/Employee');
const Job = require('../models/Job');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function diagnoseIssues() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // ============================================
    // 1. DASHBOARD NET PROFIT ISSUE
    // ============================================
    console.log('='.repeat(60));
    console.log('DASHBOARD CALCULATION DIAGNOSIS');
    console.log('='.repeat(60));

    const finalInvoices = await Invoice.aggregate([
      { $match: { status: { $in: ['final'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total_amount' },
          totalReceived: { $sum: '$paid_amount' },
          totalPending: { $sum: '$pending_amount' }
        }
      }
    ]);

    const wagesPaid = await Employee.aggregate([
      { $group: { _id: null, total: { $sum: '$totalSalaryReceived' } } }
    ]);

    const wagesPending = await Employee.aggregate([
      { $group: { _id: null, total: { $sum: '$pendingSalary' } } }
    ]);

    const jobExpenses = await Job.aggregate([
      { $unwind: { path: '$expenses', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$expenses.amount', 0] } } } }
    ]);

    const revenue = finalInvoices[0] || { totalRevenue: 0, totalReceived: 0, totalPending: 0 };
    const wagesPaidTotal = wagesPaid[0]?.total || 0;
    const wagesPendingTotal = wagesPending[0]?.total || 0;
    const jobExpensesTotal = jobExpenses[0]?.total || 0;

    const totalExpenses = wagesPaidTotal + jobExpensesTotal;
    const netProfit = revenue.totalReceived - totalExpenses;

    console.log('\nRevenue:');
    console.log(`  Total Revenue (billed): ₹${revenue.totalRevenue}`);
    console.log(`  Total Received (cash):  ₹${revenue.totalReceived}`);
    console.log(`  Total Pending:          ₹${revenue.totalPending}`);

    console.log('\nExpenses:');
    console.log(`  Wages Paid:             ₹${wagesPaidTotal}`);
    console.log(`  Wages Pending:          ₹${wagesPendingTotal}`);
    console.log(`  Job Expenses:           ₹${jobExpensesTotal}`);
    console.log(`  TOTAL EXPENSES:         ₹${totalExpenses}`);

    console.log('\nProfit:');
    console.log(`  Net Profit:             ₹${netProfit}`);
    console.log(`  Formula: Received (${revenue.totalReceived}) - Expenses (${totalExpenses}) = ${netProfit}`);

    console.log('\n⚠️  ISSUE CHECK:');
    if (netProfit === totalExpenses) {
      console.log('  ❌ NET PROFIT EQUALS EXPENSES - This is wrong!');
      console.log('  Problem: Net profit calculation is incorrect');
    } else {
      console.log('  ✅ Net profit calculation looks correct');
    }

    // ============================================
    // 2. EMPLOYEE PAYMENT ISSUE
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('EMPLOYEE PAYMENT DIAGNOSIS');
    console.log('='.repeat(60));

    const employees = await Employee.find().lean();
    
    for (const emp of employees) {
      console.log(`\n👤 ${emp.name} (ID: ${emp._id})`);
      console.log(`   Current Status:`);
      console.log(`   - Pending Salary:    ₹${emp.pendingSalary}`);
      console.log(`   - Total Received:    ₹${emp.totalSalaryReceived}`);

      // Get all jobs for this employee
      const jobs = await Job.find({ 'assigned_employees.employee_id': emp._id }).lean();
      let totalEarned = 0;
      console.log(`\n   Jobs:`);
      for (const job of jobs) {
        const assignment = job.assigned_employees.find(
          ae => ae.employee_id.toString() === emp._id.toString()
        );
        if (assignment) {
          totalEarned += assignment.daily_wage;
          console.log(`   - ${job.title}: ₹${assignment.daily_wage}`);
        }
      }
      console.log(`   Total Earned from Jobs: ₹${totalEarned}`);

      // Get all payments
      const payments = await Payment.find({ employee_id: emp._id }).lean();
      let totalPaid = 0;
      console.log(`\n   Payments:`);
      for (const payment of payments) {
        totalPaid += payment.amount;
        console.log(`   - ${new Date(payment.date).toLocaleDateString()}: ₹${payment.amount}`);
      }
      console.log(`   Total Paid: ₹${totalPaid}`);

      // Calculate what should be pending
      const shouldBePending = totalEarned - totalPaid;
      const actualPending = emp.pendingSalary;

      console.log(`\n   ✅ VERIFICATION:`);
      console.log(`   Should be pending: ₹${shouldBePending} (${totalEarned} - ${totalPaid})`);
      console.log(`   Actually pending:  ₹${actualPending}`);
      console.log(`   Difference:        ₹${Math.abs(shouldBePending - actualPending)}`);

      if (shouldBePending !== actualPending) {
        console.log(`   ❌ MISMATCH FOUND!`);
      } else {
        console.log(`   ✅ Correct!`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

diagnoseIssues();
