import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../theme';
import { useEmployeeStore } from '../../store/employeeStore';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Employee, Payment } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { employeeService } from '../../api/employee.service';

type ModalType = 'add' | 'payment' | 'history' | null;

export default function EmployeesScreen() {
  const { employees, isLoading, fetchEmployees, createEmployee, recordPayment } = useEmployeeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Add Employee Form
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    employeeId: '',
    role: '',
    phone: '',
  });
  
  // Payment Form
  const [payment, setPayment] = useState({
    amount: '',
    method: 'cash' as 'cash' | 'bank_transfer' | 'upi' | 'other',
    notes: '',
  });
  
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    fetchEmployees(text);
  };

  const validateEmployee = () => {
    const newErrors: any = {};
    
    if (!newEmployee.name.trim()) {
      newErrors.name = 'Employee name is required';
    }
    
    if (!newEmployee.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors: any = {};
    
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (selectedEmployee && parseFloat(payment.amount) > selectedEmployee.pendingSalary) {
      newErrors.amount = `Amount cannot exceed pending salary (${formatCurrency(selectedEmployee.pendingSalary)})`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddEmployee = async () => {
    if (!validateEmployee()) return;

    try {
      await createEmployee(newEmployee);
      
      Alert.alert('Success', 'Employee added successfully');
      setModalType(null);
      resetAddForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add employee');
    }
  };

  const handleRecordPayment = async () => {
    if (!validatePayment() || !selectedEmployee) return;

    try {
      await recordPayment(selectedEmployee._id, {
        amount: parseFloat(payment.amount),
        method: payment.method,
        notes: payment.notes,
      });
      
      Alert.alert('Success', 'Payment recorded successfully');
      setModalType(null);
      resetPaymentForm();
      setSelectedEmployee(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record payment');
    }
  };

  const openPaymentModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalType('payment');
  };

  const openPaymentHistory = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalType('history');
    setLoadingHistory(true);
    
    try {
      const { payments } = await employeeService.getPaymentHistory(employee._id);
      setPaymentHistory(payments);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load payment history');
      setModalType(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const resetAddForm = () => {
    setNewEmployee({
      name: '',
      employeeId: '',
      role: '',
      phone: '',
    });
    setErrors({});
  };

  const resetPaymentForm = () => {
    setPayment({
      amount: '',
      method: 'cash',
      notes: '',
    });
    setErrors({});
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <Card style={styles.employeeCard}>
      <View style={styles.employeeHeader}>
        <View style={styles.employeeInfo}>
          <View style={styles.employeeNameRow}>
            <Text style={styles.employeeName}>{item.name}</Text>
            {item.employeeId && (
              <Text style={styles.employeeId}>ID: {item.employeeId}</Text>
            )}
          </View>
          {item.role && <Text style={styles.employeeRole}>{item.role}</Text>}
          {item.phone && (
            <Text style={styles.employeePhone}>
              <Ionicons name="call-outline" size={14} /> {item.phone}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.salarySection}>
        <View style={styles.salaryRow}>
          <View style={styles.salaryItem}>
            <Text style={styles.salaryLabel}>Pending Salary</Text>
            <Text style={[styles.salaryValue, styles.pendingAmount]}>
              {formatCurrency(item.pendingSalary)}
            </Text>
          </View>
          <View style={styles.salaryDivider} />
          <View style={styles.salaryItem}>
            <Text style={styles.salaryLabel}>Total Paid</Text>
            <Text style={[styles.salaryValue, styles.paidAmount]}>
              {formatCurrency(item.totalSalaryReceived)}
            </Text>
          </View>
        </View>
      </View>

      {item.pendingSalary > 0 && (
        <Button
          title="Record Payment"
          onPress={() => openPaymentModal(item)}
          variant="primary"
          style={styles.paymentButton}
        />
      )}
      
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => openPaymentHistory(item)}
      >
        <Ionicons name="list-outline" size={18} color={colors.primary} />
        <Text style={styles.historyButtonText}>Payment History</Text>
      </TouchableOpacity>
    </Card>
  );

  if (isLoading && employees.length === 0) {
    return <LoadingSpinner message="Loading employees..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Employees List */}
      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No employees found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Add your first employee'}
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalType('add')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Employee Modal */}
      <Modal
        visible={modalType === 'add'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Employee</Text>
              <TouchableOpacity onPress={() => {
                setModalType(null);
                resetAddForm();
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Input
                label="Employee ID *"
                placeholder="e.g., EMP001"
                value={newEmployee.employeeId}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, employeeId: text })}
                error={errors.employeeId}
              />

              <Input
                label="Full Name *"
                placeholder="e.g., Rajesh Kumar"
                value={newEmployee.name}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
                error={errors.name}
              />

              <Input
                label="Role"
                placeholder="e.g., Sound Technician"
                value={newEmployee.role}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, role: text })}
              />

              <Input
                label="Phone Number"
                placeholder="e.g., +91 98765 43210"
                value={newEmployee.phone}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, phone: text })}
                keyboardType="phone-pad"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setModalType(null);
                  resetAddForm();
                }}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Add Employee"
                onPress={handleAddEmployee}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        visible={modalType === 'payment'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => {
                setModalType(null);
                resetPaymentForm();
                setSelectedEmployee(null);
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedEmployee && (
                <View style={styles.employeeSummary}>
                  <Text style={styles.summaryLabel}>Employee</Text>
                  <Text style={styles.summaryValue}>{selectedEmployee.name}</Text>
                  
                  <Text style={styles.summaryLabel}>Pending Salary</Text>
                  <Text style={[styles.summaryValue, styles.pendingAmount]}>
                    {formatCurrency(selectedEmployee.pendingSalary)}
                  </Text>
                </View>
              )}

              <Input
                label="Payment Amount *"
                placeholder="0.00"
                value={payment.amount}
                onChangeText={(text) => setPayment({ ...payment, amount: text })}
                keyboardType="numeric"
                error={errors.amount}
              />

              <Text style={styles.label}>Payment Method *</Text>
              <View style={styles.methodSelector}>
                {[
                  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
                  { value: 'bank_transfer', label: 'Bank', icon: 'card-outline' },
                  { value: 'upi', label: 'UPI', icon: 'phone-portrait-outline' },
                  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
                ].map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    style={[
                      styles.methodOption,
                      payment.method === method.value && styles.methodOptionActive
                    ]}
                    onPress={() => setPayment({ ...payment, method: method.value as any })}
                  >
                    <Ionicons
                      name={method.icon as any}
                      size={20}
                      color={payment.method === method.value ? '#FFFFFF' : colors.text}
                    />
                    <Text style={[
                      styles.methodText,
                      payment.method === method.value && styles.methodTextActive
                    ]}>
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Notes (Optional)"
                placeholder="Add any notes..."
                value={payment.notes}
                onChangeText={(text) => setPayment({ ...payment, notes: text })}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setModalType(null);
                  resetPaymentForm();
                  setSelectedEmployee(null);
                }}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Record Payment"
                onPress={handleRecordPayment}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        visible={modalType === 'history'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment History</Text>
              <TouchableOpacity onPress={() => {
                setModalType(null);
                setPaymentHistory([]);
                setSelectedEmployee(null);
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <View style={styles.historyHeader}>
                <Text style={styles.historyEmployeeName}>{selectedEmployee.name}</Text>
                <View style={styles.historyStats}>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatLabel}>Pending</Text>
                    <Text style={[styles.historyStatValue, styles.pendingAmount]}>
                      {formatCurrency(selectedEmployee.pendingSalary)}
                    </Text>
                  </View>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatLabel}>Total Paid</Text>
                    <Text style={[styles.historyStatValue, styles.paidAmount]}>
                      {formatCurrency(selectedEmployee.totalSalaryReceived)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {loadingHistory ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner message="Loading payment history..." />
              </View>
            ) : (
              <FlatList
                data={paymentHistory}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.historyList}
                ListEmptyComponent={
                  <View style={styles.emptyHistory}>
                    <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
                    <Text style={styles.emptyHistoryText}>No payments yet</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                      <View style={styles.paymentAmountContainer}>
                        <Text style={styles.paymentAmount}>
                          {formatCurrency(item.amount)}
                        </Text>
                        <View style={[styles.methodBadge, styles[`method_${item.method}`]]}>
                          <Text style={styles.methodBadgeText}>
                            {item.method === 'bank_transfer' ? 'Bank' : 
                             item.method === 'upi' ? 'UPI' :
                             item.method === 'cash' ? 'Cash' : 'Other'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.paymentDate}>{formatDate(item.date)}</Text>
                    </View>
                    {item.notes && (
                      <Text style={styles.paymentNotes}>{item.notes}</Text>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  employeeCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  employeeHeader: {
    marginBottom: spacing.md,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  employeeName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  employeeId: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  employeeRole: {
    ...typography.body,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  employeePhone: {
    ...typography.body,
    color: colors.textSecondary,
  },
  salarySection: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  salaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  salaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  salaryValue: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  pendingAmount: {
    color: colors.error,
  },
  paidAmount: {
    color: colors.success,
  },
  paymentButton: {
    marginTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  methodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  methodOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  employeeSummary: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  historyButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  historyHeader: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  historyEmployeeName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  historyStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  historyStat: {
    flex: 1,
  },
  historyStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  historyStatValue: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  historyList: {
    padding: spacing.lg,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyHistoryText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentAmountContainer: {
    flex: 1,
  },
  paymentAmount: {
    ...typography.h3,
    color: colors.success,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  paymentDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  paymentNotes: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  methodBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  method_cash: {
    backgroundColor: colors.success + '20',
  },
  method_bank_transfer: {
    backgroundColor: colors.primary + '20',
  },
  method_upi: {
    backgroundColor: '#9C27B0' + '20',
  },
  method_other: {
    backgroundColor: colors.textSecondary + '20',
  },
  methodBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
});
