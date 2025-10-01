import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Product, Employee, Job } from '../types';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Employees: undefined;
  Jobs: undefined;
  Invoices: undefined;
  Settings: undefined;
};

// Product Stack
export type ProductStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string };
  AddProduct: undefined;
  EditProduct: { product: Product };
};

// Employee Stack
export type EmployeeStackParamList = {
  EmployeeList: undefined;
  EmployeeDetail: { employeeId: string };
  AddEmployee: undefined;
  EditEmployee: { employee: Employee };
  RecordPayment: { employee: Employee };
};

// Job Stack
export type JobStackParamList = {
  JobList: undefined;
  JobDetail: { jobId: string };
  CreateJob: undefined;
  EditJob: { job: Job };
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen props types
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type ProductStackScreenProps<T extends keyof ProductStackParamList> =
  NativeStackScreenProps<ProductStackParamList, T>;

export type EmployeeStackScreenProps<T extends keyof EmployeeStackParamList> =
  NativeStackScreenProps<EmployeeStackParamList, T>;

export type JobStackScreenProps<T extends keyof JobStackParamList> =
  NativeStackScreenProps<JobStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
