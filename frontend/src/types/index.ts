// API Types
export interface User {
  _id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Product {
  _id: string;
  sku?: string;
  name: string;
  description?: string;
  purchase_type: 'new' | 'existing';
  purchase_cost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  employeeId: number;
  name: string;
  role?: string;
  phone?: string;
  totalSalaryReceived: number;
  pendingSalary: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  employee_id: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank_transfer' | 'upi' | 'other';
  notes?: string;
  recorded_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignedEmployee {
  employee_id: string;
  name: string;
  role?: string;
  daily_wage: number;
  wage_status: 'pending' | 'paid';
}

export interface RentedItem {
  product_id: string;
  name: string;
  qty: number;
  rate: number;
}

export interface Expense {
  type: 'transport' | 'food' | 'misc';
  amount: number;
  date: string;
  notes?: string;
}

export interface Job {
  _id: string;
  title: string;
  date: string;
  assigned_employees: AssignedEmployee[];
  rented_items: RentedItem[];
  expenses: Expense[];
  status: 'planned' | 'in-progress' | 'completed';
  total_cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
  brand_type: 'Picbox' | 'Echo';
  customer_name: string;
  event_name?: string;
  rented_items: RentedItem[];
  subtotal: number;
  discount: number;
  discount_percentage: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  status: 'draft' | 'estimate' | 'final';
  date: string;
  pdf?: {
    url: string;
    public_id: string;
  };
  company_credentials?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Credential {
  _id: string;
  credential_name: string;
  type: 'bank' | 'tax' | 'upi' | 'other';
  payload: Record<string, any>;
  is_active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalWagesPending: number;
  totalWagesPaid: number;
  profit: number;
  breakdowns: {
    wagesPending: number;
    wagesPaid: number;
    jobExpenses: number;
    purchaseCosts: number;
  };
  recentJobs: Job[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
