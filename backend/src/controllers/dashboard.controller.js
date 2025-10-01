const Employee = require('../models/Employee');
const Job = require('../models/Job');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const logger = require('../config/logger');

/**
 * @desc    Get dashboard summary with precise financial calculations
 * @route   GET /api/dashboard/summary
 * @access  Private
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    // ============================================
    // REVENUE CALCULATION
    // ============================================
    // Revenue comes from invoices (actual customer billing)
    // Only count 'final' status invoices for actual revenue
    const finalInvoicesResult = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['final'] } // Only final invoices count as confirmed revenue
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total_amount' },
          totalReceived: { $sum: '$paid_amount' },
          totalPending: { $sum: '$pending_amount' }
        }
      }
    ]);

    const revenueData = finalInvoicesResult[0] || {
      totalRevenue: 0,
      totalReceived: 0,
      totalPending: 0
    };

    // Optional: Include estimates for forecasting
    const estimatesResult = await Invoice.aggregate([
      {
        $match: {
          status: 'estimate'
        }
      },
      {
        $group: {
          _id: null,
          potentialRevenue: { $sum: '$total_amount' }
        }
      }
    ]);

    const potentialRevenue = estimatesResult[0]?.potentialRevenue || 0;

    // ============================================
    // EXPENSE CALCULATION
    // ============================================

    // 1. WAGES PAID (actual cash outflow)
    const wagesPaidResult = await Employee.aggregate([
      {
        $group: {
          _id: null,
          totalWagesPaid: { $sum: '$totalSalaryReceived' }
        }
      }
    ]);
    const totalWagesPaid = wagesPaidResult[0]?.totalWagesPaid || 0;

    // 2. WAGES PENDING (liability, not yet cash outflow)
    const wagesPendingResult = await Employee.aggregate([
      {
        $group: {
          _id: null,
          totalWagesPending: { $sum: '$pendingSalary' }
        }
      }
    ]);
    const totalWagesPending = wagesPendingResult[0]?.totalWagesPending || 0;

    // 3. JOB EXPENSES (transport, food, misc - actual costs)
    const jobExpensesResult = await Job.aggregate([
      { $unwind: { path: '$expenses', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalJobExpenses: { 
            $sum: { $ifNull: ['$expenses.amount', 0] }
          }
        }
      }
    ]);
    const totalJobExpenses = jobExpensesResult[0]?.totalJobExpenses || 0;

    // 4. PRODUCT PURCHASE COSTS (capital expenditure)
    const purchaseCostsResult = await Product.aggregate([
      {
        $match: {
          purchase_type: 'new',
          purchase_cost: { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalPurchaseCosts: { $sum: '$purchase_cost' }
        }
      }
    ]);
    const totalPurchaseCosts = purchaseCostsResult[0]?.totalPurchaseCosts || 0;

    // ============================================
    // PROFIT CALCULATION
    // ============================================
    
    // Total Actual Expenses (cash basis)
    const totalExpenses = totalWagesPaid + totalJobExpenses + totalPurchaseCosts;

    // Gross Profit (Revenue - Expenses)
    const grossProfit = revenueData.totalRevenue - totalExpenses;

    // Net Profit (considering receivables)
    // This is what we actually have after accounting for what we've received vs paid
    const netProfit = revenueData.totalReceived - totalExpenses;

    // ============================================
    // ADDITIONAL METRICS
    // ============================================

    // Active Jobs Count
    const activeJobsCount = await Job.countDocuments({
      status: { $in: ['planned', 'in-progress'] }
    });

    // Total Employees
    const totalEmployees = await Employee.countDocuments();

    // Total Products
    const totalProducts = await Product.countDocuments();

    // Recent Jobs (last 5)
    const recentJobs = await Job.find()
      .sort({ date: -1 })
      .limit(5)
      .select('title date status total_cost')
      .lean();

    // ============================================
    // CASH FLOW ANALYSIS
    // ============================================
    const cashFlow = {
      inflow: revenueData.totalReceived, // What we've actually received
      outflow: totalExpenses, // What we've actually paid
      balance: revenueData.totalReceived - totalExpenses, // Current cash position
      pendingInflow: revenueData.totalPending, // What customers owe us
      pendingOutflow: totalWagesPending, // What we owe employees
      projectedBalance: (revenueData.totalReceived + revenueData.totalPending) - (totalExpenses + totalWagesPending)
    };

    // ============================================
    // SUMMARY RESPONSE
    // ============================================
    const summary = {
      // Core Metrics
      totalRevenue: revenueData.totalRevenue, // Total billed (final invoices)
      totalExpenses: totalExpenses, // Total paid out
      grossProfit: grossProfit, // Revenue - Expenses
      netProfit: netProfit, // What we received - What we paid
      
      // Revenue Breakdown
      revenueBreakdown: {
        totalBilled: revenueData.totalRevenue, // Total final invoices
        totalReceived: revenueData.totalReceived, // Cash received
        totalPending: revenueData.totalPending, // Accounts receivable
        potentialRevenue: potentialRevenue // Estimates (not confirmed)
      },

      // Expense Breakdown
      expenseBreakdown: {
        wagesPaid: totalWagesPaid,
        wagesPending: totalWagesPending,
        jobExpenses: totalJobExpenses,
        purchaseCosts: totalPurchaseCosts,
        totalActualExpenses: totalExpenses // Cash basis
      },

      // Cash Flow
      cashFlow: cashFlow,

      // Activity Metrics
      metrics: {
        activeJobs: activeJobsCount,
        totalEmployees: totalEmployees,
        totalProducts: totalProducts
      },

      // Recent Activity
      recentJobs: recentJobs
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
};
