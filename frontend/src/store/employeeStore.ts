import { create } from 'zustand';
import { Employee, Payment } from '../types';
import { employeeService } from '../api/employee.service';

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  payments: Payment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchEmployees: (search?: string) => Promise<void>;
  fetchEmployee: (id: string) => Promise<void>;
  createEmployee: (employee: any) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  recordPayment: (
    employeeId: string,
    payment: any
  ) => Promise<{ payment: Payment; employee: Employee }>;
  fetchPaymentHistory: (employeeId: string) => Promise<void>;
  clearError: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  selectedEmployee: null,
  payments: [],
  isLoading: false,
  error: null,

  fetchEmployees: async (search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { employees } = await employeeService.getEmployees({
        limit: 100,
        search,
      });
      set({ employees, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch employees',
        isLoading: false,
      });
    }
  },

  fetchEmployee: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const employee = await employeeService.getEmployee(id);
      set({ selectedEmployee: employee, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch employee',
        isLoading: false,
      });
    }
  },

  createEmployee: async (employeeData: any) => {
    set({ isLoading: true, error: null });
    try {
      const employee = await employeeService.createEmployee(employeeData);
      set((state) => ({
        employees: [employee, ...state.employees],
        isLoading: false,
      }));
      return employee;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create employee',
        isLoading: false,
      });
      throw error;
    }
  },

  updateEmployee: async (id: string, updates: Partial<Employee>) => {
    set({ isLoading: true, error: null });
    try {
      const employee = await employeeService.updateEmployee(id, updates);
      set((state) => ({
        employees: state.employees.map((e) => (e._id === id ? employee : e)),
        selectedEmployee: employee,
        isLoading: false,
      }));
      return employee;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update employee',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteEmployee: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.deleteEmployee(id);
      set((state) => ({
        employees: state.employees.filter((e) => e._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete employee',
        isLoading: false,
      });
      throw error;
    }
  },

  recordPayment: async (employeeId: string, paymentData: any) => {
    set({ isLoading: true, error: null });
    try {
      const result = await employeeService.recordPayment(
        employeeId,
        paymentData
      );
      
      // Update employee in list
      set((state) => ({
        employees: state.employees.map((e) =>
          e._id === employeeId ? result.employee : e
        ),
        selectedEmployee: result.employee,
        payments: [result.payment, ...state.payments],
        isLoading: false,
      }));
      
      return result;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to record payment',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchPaymentHistory: async (employeeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { payments } = await employeeService.getPaymentHistory(employeeId, {
        limit: 50,
      });
      set({ payments, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch payment history',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
