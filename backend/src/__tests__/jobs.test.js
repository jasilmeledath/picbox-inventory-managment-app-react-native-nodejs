const request = require('supertest');
const app = require('../../index');
const Employee = require('../../models/Employee');
const Job = require('../../models/Job');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Jobs API - Wage Logic', () => {
  let authToken;
  let employee1;
  let employee2;

  beforeEach(async () => {
    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      passwordHash: 'password123',
      name: 'Test User',
      isAdmin: true
    });

    authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    // Create test employees
    employee1 = await Employee.create({
      employeeId: 1,
      name: 'John Doe',
      role: 'Technician',
      phone: '1234567890'
    });

    employee2 = await Employee.create({
      employeeId: 2,
      name: 'Jane Smith',
      role: 'Manager',
      phone: '0987654321'
    });
  });

  it('should increment employee pendingSalary on job creation', async () => {
    const jobData = {
      title: 'Test Event',
      date: new Date(),
      assigned_employees: [
        {
          employee_id: employee1._id,
          name: employee1.name,
          role: employee1.role,
          daily_wage: 1000
        },
        {
          employee_id: employee2._id,
          name: employee2.name,
          role: employee2.role,
          daily_wage: 1500
        }
      ],
      rented_items: [],
      expenses: []
    };

    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(jobData)
      .expect(201);

    expect(response.body.success).toBe(true);

    // Check employee pending salaries
    const updatedEmp1 = await Employee.findById(employee1._id);
    const updatedEmp2 = await Employee.findById(employee2._id);

    expect(updatedEmp1.pendingSalary).toBe(1000);
    expect(updatedEmp2.pendingSalary).toBe(1500);
  });

  it('should record payment and update salary fields', async () => {
    // Set pending salary
    employee1.pendingSalary = 5000;
    await employee1.save();

    const paymentData = {
      amount: 3000,
      date: new Date(),
      method: 'cash',
      notes: 'Partial payment'
    };

    const response = await request(app)
      .post(`/api/employees/${employee1._id}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(paymentData)
      .expect(201);

    expect(response.body.success).toBe(true);

    // Check updated employee
    const updatedEmp = await Employee.findById(employee1._id);
    expect(updatedEmp.pendingSalary).toBe(2000);
    expect(updatedEmp.totalSalaryReceived).toBe(3000);
  });

  it('should reject payment exceeding pending salary', async () => {
    employee1.pendingSalary = 1000;
    await employee1.save();

    const paymentData = {
      amount: 2000,
      method: 'cash'
    };

    const response = await request(app)
      .post(`/api/employees/${employee1._id}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(paymentData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('exceeds pending salary');
  });

  it('should reverse wages when job is deleted', async () => {
    // Create job first
    const job = await Job.create({
      title: 'Test Event',
      date: new Date(),
      assigned_employees: [
        {
          employee_id: employee1._id,
          name: employee1.name,
          role: employee1.role,
          daily_wage: 1000,
          wage_status: 'pending'
        }
      ],
      rented_items: [],
      expenses: []
    });

    employee1.pendingSalary = 1000;
    await employee1.save();

    // Delete job
    await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Check employee
    const updatedEmp = await Employee.findById(employee1._id);
    expect(updatedEmp.pendingSalary).toBe(0);
  });
});
