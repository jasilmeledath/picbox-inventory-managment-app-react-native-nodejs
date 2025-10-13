import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DatePicker from '../../components/common/DatePicker';
import { Job } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { jobService } from '../../api/job.service';
import { useEmployeeStore } from '../../store/employeeStore';
import { useProductStore } from '../../store/productStore';

type WizardStep = 1 | 2 | 3 | 4;

export default function JobsScreen() {
  const { employees, fetchEmployees } = useEmployeeStore();
  const { products, fetchProducts } = useProductStore();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  // Job form data
  const [jobForm, setJobForm] = useState({
    title: '',
    date: null as Date | null,
    status: 'planned' as 'planned' | 'in-progress' | 'completed',
  });

  // Step 2: Assigned Employees
  const [selectedEmployees, setSelectedEmployees] = useState<Array<{
    employee_id: string;
    name: string;
    role?: string;
    daily_wage: number;
    wage_status?: 'pending' | 'paid';
  }>>([]);
  const [tempWage, setTempWage] = useState('');

  // Step 3: Rented Items
  const [selectedItems, setSelectedItems] = useState<Array<{
    product_id: string;
    name: string;
    quantity: number;
    rate: number;
    tempQuantity?: string;  // Temporary string for editing
    tempRate?: string;      // Temporary string for editing
  }>>([]);
  const [tempQuantity, setTempQuantity] = useState('');
  const [tempRate, setTempRate] = useState('');

  // Step 4: Expenses
  const [expenses, setExpenses] = useState<Array<{
    description: string;
    amount: number;
    category: 'transport' | 'food' | 'misc';
  }>>([]);
  const [tempExpense, setTempExpense] = useState({
    description: '',
    amount: '',
    category: 'transport' as 'transport' | 'food' | 'misc',
  });

  const [errors, setErrors] = useState<any>({});

  // Initial load
  useEffect(() => {
    loadJobs();
    fetchEmployees();
    fetchProducts();
  }, []);

  // Refresh when screen comes into focus (fixes employee wages not updating)
  useFocusEffect(
    React.useCallback(() => {
      loadJobs();
      fetchEmployees(); // Refresh employees to get updated pending salary
    }, [])
  );

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const { jobs: fetchedJobs } = await jobService.getJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadJobs(),
        fetchEmployees(),
        fetchProducts(),
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    setIsLoading(true);
    try {
      const { jobs: searchResults } = await jobService.getJobs({ search: text });
      setJobs(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: any = {};

    if (step === 1) {
      if (!jobForm.title.trim()) newErrors.title = 'Job title is required';
      if (!jobForm.date) newErrors.date = 'Job date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((currentStep + 1) as WizardStep);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const toggleEmployee = (employeeId: string) => {
    const employee = employees.find(e => e._id === employeeId);
    if (!employee) return;

    const exists = selectedEmployees.find(e => e.employee_id === employeeId);
    if (exists) {
      setSelectedEmployees(selectedEmployees.filter(e => e.employee_id !== employeeId));
    } else {
      setSelectedEmployees([
        ...selectedEmployees,
        {
          employee_id: employeeId,
          name: employee.name,
          role: employee.role,
          daily_wage: 0,
        },
      ]);
    }
  };

  const updateEmployeeWage = (employeeId: string, wage: string) => {
    setSelectedEmployees(
      selectedEmployees.map(e =>
        e.employee_id === employeeId ? { ...e, daily_wage: parseFloat(wage) || 0 } : e
      )
    );
  };

  const toggleProduct = (productId: string) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    const exists = selectedItems.find(i => i.product_id === productId);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.product_id !== productId));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          product_id: productId,
          name: product.name,
          quantity: 1,
          rate: 0,
          tempQuantity: '1',
          tempRate: '0',
        },
      ]);
    }
  };

  const updateItemQuantity = (productId: string, quantity: string) => {
    setSelectedItems(
      selectedItems.map(i =>
        i.product_id === productId 
          ? { ...i, tempQuantity: quantity, quantity: parseInt(quantity) || 0 } 
          : i
      )
    );
  };

  const updateItemRate = (productId: string, rate: string) => {
    setSelectedItems(
      selectedItems.map(i =>
        i.product_id === productId 
          ? { ...i, tempRate: rate, rate: parseFloat(rate) || 0 } 
          : i
      )
    );
  };

  const addExpense = () => {
    if (!tempExpense.description.trim() || !tempExpense.amount) {
      Alert.alert('Error', 'Please enter description and amount');
      return;
    }

    setExpenses([
      ...expenses,
      {
        description: tempExpense.description,
        amount: parseFloat(tempExpense.amount),
        category: tempExpense.category,
      },
    ]);

    setTempExpense({ description: '', amount: '', category: 'transport' });
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const wagesTotal = selectedEmployees.reduce((sum, e) => sum + e.daily_wage, 0);
    const itemsTotal = selectedItems.reduce((sum, i) => sum + (i.quantity * i.rate), 0);
    const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    return wagesTotal + itemsTotal + expensesTotal;
  };

  const getFilteredEmployees = () => {
    if (!employeeSearchQuery.trim()) return employees;
    const query = employeeSearchQuery.toLowerCase();
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(query) ||
      (employee.role && employee.role.toLowerCase().includes(query))
    );
  };

  const getFilteredProducts = () => {
    if (!productSearchQuery.trim()) return products;
    const query = productSearchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query)) ||
      (product.sku && product.sku.toLowerCase().includes(query))
    );
  };

  const handleSubmitJob = async () => {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    if (!jobForm.date) {
      Alert.alert('Error', 'Please select a job date');
      return;
    }

    setIsLoading(true);
    try {
      // Format date to YYYY-MM-DD
      const formattedDate = jobForm.date.toISOString().split('T')[0];

      const jobData = {
        title: jobForm.title,
        date: formattedDate,
        status: jobForm.status,
        assigned_employees: selectedEmployees.map(e => ({
          employee_id: e.employee_id,
          name: e.name,
          role: e.role,
          daily_wage: e.daily_wage,
          wage_status: 'pending' as const,
        })),
        rented_items: selectedItems.map(i => ({
          product_id: i.product_id,
          name: i.name,
          qty: i.quantity,
          rate: i.rate,
        })),
        expenses: expenses.map(e => ({
          type: e.category,
          amount: e.amount,
          notes: e.description,
        })),
      };

      await jobService.createJob(jobData as any);
      
      Alert.alert('Success', 'Job created successfully');
      resetForm();
      setIsModalVisible(false);
      loadJobs();
    } catch (error: any) {
      console.error('Job creation error:', error);
      
      // Show detailed validation errors if available
      let errorMessage = error.message || 'Failed to create job';
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n');
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;

    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    if (!jobForm.date) {
      Alert.alert('Error', 'Please select a job date');
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = jobForm.date.toISOString().split('T')[0];

      const updates = {
        title: jobForm.title,
        date: formattedDate,
        status: jobForm.status,
        assigned_employees: selectedEmployees.map(e => ({
          employee_id: e.employee_id,
          name: e.name,
          role: e.role,
          daily_wage: e.daily_wage,
          wage_status: e.wage_status || 'pending' as const,
        })),
        rented_items: selectedItems.map(i => ({
          product_id: i.product_id,
          name: i.name,
          qty: i.quantity,
          rate: i.rate,
        })),
        expenses: expenses.map(e => ({
          type: e.category,
          amount: e.amount,
          notes: e.description,
        })),
      };

      await jobService.updateJob(editingJob._id, updates as any);
      
      Alert.alert('Success', 'Job updated successfully');
      resetForm();
      setIsModalVisible(false);
      setEditingJob(null);
      loadJobs();
    } catch (error: any) {
      console.error('Job update error:', error);
      
      let errorMessage = error.message || 'Failed to update job';
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n');
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    
    // Populate form with existing job data
    setJobForm({
      title: job.title,
      date: new Date(job.date),
      status: job.status,
    });

    // Populate assigned employees with temp values
    setSelectedEmployees(job.assigned_employees.map(e => ({
      employee_id: e.employee_id,
      name: e.name,
      role: e.role,
      daily_wage: e.daily_wage,
      wage_status: e.wage_status,
    })));

    // Populate rented items with temp values
    setSelectedItems(job.rented_items.map(i => ({
      product_id: i.product_id,
      name: i.name,
      quantity: i.qty,
      rate: i.rate,
      tempQuantity: i.qty.toString(),
      tempRate: i.rate.toString(),
    })));

    // Populate expenses
    setExpenses(job.expenses.map(e => ({
      description: e.notes || '',
      amount: e.amount,
      category: e.type,
    })));

    setIsModalVisible(true);
  };

  const handleViewJob = (job: Job) => {
    setViewingJob(job);
    setIsDetailModalVisible(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job? This will reverse any pending wage increments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await jobService.deleteJob(jobId);
              Alert.alert('Success', 'Job deleted successfully');
              loadJobs();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete job');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setJobForm({
      title: '',
      date: null,
      status: 'planned',
    });
    setSelectedEmployees([]);
    setSelectedItems([]);
    setExpenses([]);
    setCurrentStep(1);
    setErrors({});
    setEmployeeSearchQuery('');
    setProductSearchQuery('');
    setEditingJob(null);
  };

  const renderJob = ({ item }: { item: Job }) => (
    <Card style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.jobDate}>
            <Ionicons name="calendar-outline" size={14} /> {formatDate(item.date)}
          </Text>
          {item.assigned_employees.length > 0 && (
            <Text style={styles.jobTeam}>
              <Ionicons name="people-outline" size={14} /> {item.assigned_employees.length} team member(s)
            </Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'completed' && styles.status_completed,
          item.status === 'in-progress' && styles.status_in_progress,
          item.status === 'planned' && styles.status_planned,
        ]}>
          <Text style={styles.statusText}>
            {item.status.replace('-', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.jobFooter}>
        <Text style={styles.jobTotal}>Total: {formatCurrency(item.total_cost)}</Text>
        <View style={styles.jobActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewJob(item)}
          >
            <Ionicons name="eye-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditJob(item)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteJob(item._id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  if (isLoading && jobs.length === 0) {
    return <LoadingSpinner message="Loading jobs..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
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

      {/* Jobs List */}
      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No jobs found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Create your first job'}
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Job Wizard Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.wizardContainer}>
          {/* Header */}
          <View style={styles.wizardHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                Alert.alert('Cancel', 'Are you sure you want to cancel?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes', onPress: () => { resetForm(); setIsModalVisible(false); } },
                ]);
              }}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.wizardTitle}>{editingJob ? 'Edit Job' : 'Create New Job'}</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {[1, 2, 3, 4].map((step) => (
              <View key={step} style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  currentStep >= step && styles.stepCircleActive
                ]}>
                  <Text style={[
                    styles.stepNumber,
                    currentStep >= step && styles.stepNumberActive
                  ]}>
                    {step}
                  </Text>
                </View>
                <Text style={styles.stepLabel}>
                  {step === 1 ? 'Basic' : step === 2 ? 'Team' : step === 3 ? 'Items' : 'Expenses'}
                </Text>
              </View>
            ))}
          </View>

          {/* Step Content */}
          <ScrollView style={styles.stepContent}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <View>
                <Text style={styles.stepTitle}>Basic Information</Text>
                <Text style={styles.stepSubtitle}>
                  Enter job title and date to get started
                </Text>
                
                <Input
                  label="Job Title *"
                  placeholder="e.g., Wedding Reception - Kumar Family"
                  value={jobForm.title}
                  onChangeText={(text) => setJobForm({ ...jobForm, title: text })}
                  error={errors.title}
                />

                <DatePicker
                  label="Job Date *"
                  value={jobForm.date}
                  onChange={(date) => setJobForm({ ...jobForm, date })}
                  error={errors.date}
                  placeholder="Select job date"
                  minimumDate={new Date()}
                />

                <Text style={styles.inputLabel}>Job Status</Text>
                <View style={styles.statusSelector}>
                  {(['planned', 'in-progress', 'completed'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        jobForm.status === status && styles.statusOptionActive
                      ]}
                      onPress={() => setJobForm({ ...jobForm, status })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        jobForm.status === status && styles.statusOptionTextActive
                      ]}>
                        {status.replace('-', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Step 2: Assign Employees */}
            {currentStep === 2 && (
              <View>
                <Text style={styles.stepTitle}>Assign Team Members</Text>
                <Text style={styles.stepSubtitle}>
                  Select employees and set their daily wages
                </Text>

                {/* Employee Search */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search employees by name or role..."
                    placeholderTextColor={colors.textSecondary}
                    value={employeeSearchQuery}
                    onChangeText={setEmployeeSearchQuery}
                  />
                  {employeeSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setEmployeeSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {getFilteredEmployees().map((employee) => {
                  const isSelected = selectedEmployees.find(e => e.employee_id === employee._id);
                  return (
                    <View key={employee._id} style={styles.employeeItem}>
                      <TouchableOpacity
                        style={styles.employeeCheckbox}
                        onPress={() => toggleEmployee(employee._id)}
                      >
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <View style={styles.employeeItemInfo}>
                          <Text style={styles.employeeItemName}>{employee.name}</Text>
                          {employee.role && (
                            <Text style={styles.employeeItemRole}>{employee.role}</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {isSelected && (
                        <TextInput
                          style={styles.wageInput}
                          placeholder="Wage"
                          keyboardType="numeric"
                          value={isSelected.daily_wage.toString() || ''}
                          onChangeText={(text) => updateEmployeeWage(employee._id, text)}
                        />
                      )}
                    </View>
                  );
                })}

                {getFilteredEmployees().length === 0 && (
                  <Text style={styles.emptyText}>
                    {employeeSearchQuery ? 'No employees found matching your search' : 'No employees available'}
                  </Text>
                )}
              </View>
            )}

            {/* Step 3: Rented Items */}
            {currentStep === 3 && (
              <View>
                <Text style={styles.stepTitle}>Select Rented Items</Text>
                <Text style={styles.stepSubtitle}>
                  Choose products, quantity, and rental rates
                </Text>

                {/* Product Search */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search products by name, SKU, or description..."
                    placeholderTextColor={colors.textSecondary}
                    value={productSearchQuery}
                    onChangeText={setProductSearchQuery}
                  />
                  {productSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setProductSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {getFilteredProducts().map((product) => {
                  const isSelected = selectedItems.find(i => i.product_id === product._id);
                  return (
                    <View key={product._id} style={styles.productItem}>
                      <TouchableOpacity
                        style={styles.productCheckbox}
                        onPress={() => toggleProduct(product._id)}
                      >
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <Text style={styles.productItemName}>{product.name}</Text>
                      </TouchableOpacity>

                      {isSelected && (
                        <View style={styles.productInputs}>
                          <TextInput
                            style={styles.quantityInput}
                            placeholder="Qty"
                            keyboardType="numeric"
                            value={isSelected.tempQuantity !== undefined ? isSelected.tempQuantity : isSelected.quantity.toString()}
                            onChangeText={(text) => updateItemQuantity(product._id, text)}
                          />
                          <TextInput
                            style={styles.rateInput}
                            placeholder="Rate"
                            keyboardType="numeric"
                            value={isSelected.tempRate !== undefined ? isSelected.tempRate : isSelected.rate.toString()}
                            onChangeText={(text) => updateItemRate(product._id, text)}
                          />
                        </View>
                      )}
                    </View>
                  );
                })}

                {getFilteredProducts().length === 0 && (
                  <Text style={styles.emptyText}>
                    {productSearchQuery ? 'No products found matching your search' : 'No products available'}
                  </Text>
                )}
              </View>
            )}

            {/* Step 4: Expenses & Review */}
            {currentStep === 4 && (
              <View>
                <Text style={styles.stepTitle}>Add Expenses</Text>

                <View style={styles.expenseForm}>
                  <Input
                    label="Description"
                    placeholder="e.g., Transportation"
                    value={tempExpense.description}
                    onChangeText={(text) => setTempExpense({ ...tempExpense, description: text })}
                  />

                  <Input
                    label="Amount"
                    placeholder="0.00"
                    value={tempExpense.amount}
                    onChangeText={(text) => setTempExpense({ ...tempExpense, amount: text })}
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.categorySelector}>
                    {(['transport', 'food', 'misc'] as const).map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryOption,
                          tempExpense.category === category && styles.categoryOptionActive
                        ]}
                        onPress={() => setTempExpense({ ...tempExpense, category })}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          tempExpense.category === category && styles.categoryOptionTextActive
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Button title="Add Expense" onPress={addExpense} />
                </View>

                {/* Expenses List */}
                {expenses.length > 0 && (
                  <View style={styles.expensesList}>
                    <Text style={styles.expensesListTitle}>Added Expenses:</Text>
                    {expenses.map((expense, index) => (
                      <View key={index} style={styles.expenseItem}>
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseDescription}>{expense.description}</Text>
                          <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeExpense(index)}>
                          <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Summary */}
                <View style={styles.summary}>
                  <Text style={styles.summaryTitle}>Job Summary</Text>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Team Members:</Text>
                    <Text style={styles.summaryValue}>{selectedEmployees.length}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Wages Total:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(selectedEmployees.reduce((sum, e) => sum + e.daily_wage, 0))}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Items:</Text>
                    <Text style={styles.summaryValue}>{selectedItems.length}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Items Total:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(selectedItems.reduce((sum, i) => sum + (i.quantity * i.rate), 0))}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Expenses Total:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                    </Text>
                  </View>

                  <View style={[styles.summaryRow, styles.summaryTotal]}>
                    <Text style={styles.summaryTotalLabel}>TOTAL COST:</Text>
                    <Text style={styles.summaryTotalValue}>
                      {formatCurrency(calculateTotal())}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={styles.wizardFooter}>
            {currentStep > 1 && (
              <Button
                title="Back"
                onPress={handleBack}
                variant="secondary"
                style={styles.footerButton}
              />
            )}
            {currentStep < 4 ? (
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.footerButton}
              />
            ) : (
              <Button
                title={editingJob ? "Update Job" : "Create Job"}
                onPress={editingJob ? handleUpdateJob : handleSubmitJob}
                loading={isLoading}
                style={styles.footerButton}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Job Details Modal */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.detailModalContainer}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsDetailModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Job Details</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Content */}
          <ScrollView style={styles.detailContent}>
            {viewingJob && (
              <>
                {/* Basic Info */}
                <Card style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Job Title:</Text>
                    <Text style={styles.detailValue}>{viewingJob.title}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(viewingJob.date)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[
                      styles.statusBadge,
                      viewingJob.status === 'completed' && styles.status_completed,
                      viewingJob.status === 'in-progress' && styles.status_in_progress,
                      viewingJob.status === 'planned' && styles.status_planned,
                    ]}>
                      <Text style={styles.statusText}>
                        {viewingJob.status.replace('-', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </Card>

                {/* Team Members */}
                {viewingJob.assigned_employees.length > 0 && (
                  <Card style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Team Members ({viewingJob.assigned_employees.length})</Text>
                    
                    {viewingJob.assigned_employees.map((emp, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <Text style={styles.listItemName}>{emp.name}</Text>
                          {emp.role && <Text style={styles.listItemSubtext}>{emp.role}</Text>}
                        </View>
                        <View style={styles.listItemRight}>
                          <Text style={styles.listItemAmount}>{formatCurrency(emp.daily_wage)}</Text>
                          <Text style={[
                            styles.listItemStatus,
                            emp.wage_status === 'paid' && styles.statusPaid
                          ]}>
                            {emp.wage_status}
                          </Text>
                        </View>
                      </View>
                    ))}

                    <View style={styles.subtotalRow}>
                      <Text style={styles.subtotalLabel}>Total Wages:</Text>
                      <Text style={styles.subtotalValue}>
                        {formatCurrency(viewingJob.assigned_employees.reduce((sum, e) => sum + e.daily_wage, 0))}
                      </Text>
                    </View>
                  </Card>
                )}

                {/* Rented Items */}
                {viewingJob.rented_items.length > 0 && (
                  <Card style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Rented Items ({viewingJob.rented_items.length})</Text>
                    
                    {viewingJob.rented_items.map((item, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <Text style={styles.listItemName}>{item.name}</Text>
                          <Text style={styles.listItemSubtext}>Qty: {item.qty} × {formatCurrency(item.rate)}</Text>
                        </View>
                        <Text style={styles.listItemAmount}>{formatCurrency(item.qty * item.rate)}</Text>
                      </View>
                    ))}

                    <View style={styles.subtotalRow}>
                      <Text style={styles.subtotalLabel}>Total Rental:</Text>
                      <Text style={styles.subtotalValue}>
                        {formatCurrency(viewingJob.rented_items.reduce((sum, i) => sum + (i.qty * i.rate), 0))}
                      </Text>
                    </View>
                  </Card>
                )}

                {/* Expenses */}
                {viewingJob.expenses.length > 0 && (
                  <Card style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Expenses ({viewingJob.expenses.length})</Text>
                    
                    {viewingJob.expenses.map((expense, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <Text style={styles.listItemName}>{expense.notes || 'Expense'}</Text>
                          <Text style={styles.listItemSubtext}>{expense.type}</Text>
                        </View>
                        <Text style={styles.listItemAmount}>{formatCurrency(expense.amount)}</Text>
                      </View>
                    ))}

                    <View style={styles.subtotalRow}>
                      <Text style={styles.subtotalLabel}>Total Expenses:</Text>
                      <Text style={styles.subtotalValue}>
                        {formatCurrency(viewingJob.expenses.reduce((sum, e) => sum + e.amount, 0))}
                      </Text>
                    </View>
                  </Card>
                )}

                {/* Total Cost */}
                <Card style={styles.totalCard}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(viewingJob.total_cost)}</Text>
                  </View>
                </Card>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
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
  jobCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  jobDate: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  jobTeam: {
    ...typography.caption,
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    height: 28,
    justifyContent: 'center',
  },
  status_planned: {
    backgroundColor: colors.primary + '20',
  },
  status_in_progress: {
    backgroundColor: '#FF9800' + '20',
  },
  status_completed: {
    backgroundColor: colors.success + '20',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  jobTotal: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  jobActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background,
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
    textAlign: 'center',
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
  wizardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  closeButton: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepContent: {
    flex: 1,
    padding: spacing.lg,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  employeeItem: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  employeeCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  employeeItemInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  employeeItemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  employeeItemRole: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  wageInput: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
  },
  productItem: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  productCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productItemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  productInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quantityInput: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
  },
  rateInput: {
    flex: 2,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
  },
  expenseForm: {
    marginBottom: spacing.lg,
  },
  categorySelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryOptionTextActive: {
    color: '#FFFFFF',
  },
  expensesList: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  expensesListTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  expenseAmount: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summary: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  summaryTotal: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  summaryTotalLabel: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  wizardFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  footerButton: {
    flex: 1,
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  detailTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  detailContent: {
    flex: 1,
    padding: spacing.md,
  },
  detailSection: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  listItemAmount: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  listItemStatus: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statusPaid: {
    color: colors.success,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  subtotalLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  subtotalValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  totalCard: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    marginBottom: spacing.xxl,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  totalValue: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
