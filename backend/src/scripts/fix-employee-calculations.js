const mongoose = require('mongoose');
const path = require('path');
const Employee = require('../models/Employee');
const Job = require('../models/Job');
const Payment = require('../models/Payment');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function fixEmployeeCalculations() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('='.repeat(60));
    console.log('FIXING EMPLOYEE SALARY CALCULATIONS');
    console.log('='.repeat(60));

    const employees = await Employee.find().lean();
    
    for (const emp of employees) {
      console.log(`\n👤 Processing: ${emp.name}`);
      
      // Calculate total earned from all jobs
      const jobs = await Job.find({ 'assigned_employees.employee_id': emp._id }).lean();
      let totalEarned = 0;
      
      for (const job of jobs) {
        const assignment = job.assigned_employees.find(
          ae => ae.employee_id.toString() === emp._id.toString()
        );
        if (assignment) {
          totalEarned += assignment.daily_wage;
        }
      }
      
      // Calculate total paid from all payments
      const payments = await Payment.find({ employee_id: emp._id }).lean();
      let totalPaid = 0;
      
      for (const payment of payments) {
        totalPaid += payment.amount;
      }
      
      // Calculate correct values
      const correctPending = Math.max(0, totalEarned - totalPaid);
      const correctReceived = totalPaid;
      
      console.log(`   Current Values:`);
      console.log(`   - Pending: ₹${emp.pendingSalary} | Received: ₹${emp.totalSalaryReceived}`);
      console.log(`   Correct Values:`);
      console.log(`   - Pending: ₹${correctPending} | Received: ₹${correctReceived}`);
      console.log(`   Calculation: Earned (${totalEarned}) - Paid (${totalPaid}) = Pending (${correctPending})`);
      
      // Update if mismatch
      if (emp.pendingSalary !== correctPending || emp.totalSalaryReceived !== correctReceived) {
        await Employee.findByIdAndUpdate(emp._id, {
          pendingSalary: correctPending,
          totalSalaryReceived: correctReceived
        });
        console.log(`   ✅ FIXED!`);
      } else {
        console.log(`   ✅ Already correct`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('FIX COMPLETE - Verifying...');
    console.log('='.repeat(60));

    // Verify the fixes
    const updatedEmployees = await Employee.find().lean();
    let allCorrect = true;
    
    for (const emp of updatedEmployees) {
      // Recalculate
      const jobs = await Job.find({ 'assigned_employees.employee_id': emp._id }).lean();
      let totalEarned = 0;
      for (const job of jobs) {
        const assignment = job.assigned_employees.find(
          ae => ae.employee_id.toString() === emp._id.toString()
        );
        if (assignment) {
          totalEarned += assignment.daily_wage;
        }
      }
      
      const payments = await Payment.find({ employee_id: emp._id }).lean();
      let totalPaid = 0;
      for (const payment of payments) {
        totalPaid += payment.amount;
      }
      
      const shouldBePending = Math.max(0, totalEarned - totalPaid);
      
      if (emp.pendingSalary !== shouldBePending) {
        console.log(`\n❌ ${emp.name}: Still incorrect (${emp.pendingSalary} vs ${shouldBePending})`);
        allCorrect = false;
      }
    }
    
    if (allCorrect) {
      console.log('\n✅ All employee salaries are now correct!');
    } else {
      console.log('\n⚠️  Some employees still have issues');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixEmployeeCalculations();
