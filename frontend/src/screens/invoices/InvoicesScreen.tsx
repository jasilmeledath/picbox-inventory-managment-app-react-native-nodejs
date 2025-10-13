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
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DatePicker from '../../components/common/DatePicker';
import { Invoice, invoiceService } from '../../api/invoice.service';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useProductStore } from '../../store/productStore';

type WizardStep = 1 | 2 | 3;

export default function InvoicesScreen() {
  const { products, fetchProducts } = useProductStore();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Invoice form data
  const [invoiceForm, setInvoiceForm] = useState({
    brand_type: 'Picbox' as 'Picbox' | 'Echo',
    customer_name: '',
    event_name: '',
    status: 'draft' as 'draft' | 'estimate' | 'final',
    date: null as Date | null,
    paid_amount: '',
    discount_type: 'percentage' as 'percentage' | 'amount',
    discount_value: '',
  });

  // Selected Items
  const [selectedItems, setSelectedItems] = useState<Array<{
    product_id: string;
    name: string;
    qty: number;
    rate: number;
    tempQty?: string;
    tempRate?: string;
  }>>([]);

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    loadInvoices();
    fetchProducts();
  }, []);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const { invoices: fetchedInvoices } = await invoiceService.getInvoices();
      setInvoices(fetchedInvoices);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadInvoices(),
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
      const { invoices: searchResults } = await invoiceService.getInvoices({ search: text });
      setInvoices(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: any = {};

    if (step === 1) {
      if (!invoiceForm.customer_name.trim()) newErrors.customer_name = 'Customer name is required';
      if (!invoiceForm.date) newErrors.date = 'Date is required';
    }

    if (step === 2) {
      if (selectedItems.length === 0) {
        Alert.alert('Error', 'Please select at least one item');
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    setCurrentStep((currentStep - 1) as WizardStep);
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
          qty: 1,
          rate: 0,
          tempQty: '1',
          tempRate: '0',
        },
      ]);
    }
  };

  const updateItemQty = (productId: string, qty: string) => {
    setSelectedItems(
      selectedItems.map(i =>
        i.product_id === productId 
          ? { ...i, tempQty: qty, qty: parseInt(qty) || 0 } 
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

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, i) => sum + (i.qty * i.rate), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    const discountValue = parseFloat(invoiceForm.discount_value) || 0;
    
    if (invoiceForm.discount_type === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return subtotal - discount;
  };

  const handleGeneratePDF = async (invoiceId: string) => {
    if (!viewingInvoice) return;

    Alert.alert(
      'Download Invoice PDF',
      'Generate and download a professional PDF invoice with company details and QR code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            setIsGeneratingPDF(true);
            try {
              console.log('Starting PDF generation for invoice:', invoiceId);
              
              const fileUri = await invoiceService.generatePDF(
                invoiceId,
                viewingInvoice.invoice_number,
                viewingInvoice.customer_name
              );
              
              console.log('PDF generated successfully at:', fileUri);
              
              Alert.alert(
                'Success',
                'Invoice PDF generated and ready to share! The share dialog will open automatically.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('PDF Generation failed:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to generate PDF. Please check:\n\n1. Company credentials are configured\n2. You have internet connection\n3. Server is running',
                [{ text: 'OK' }]
              );
            } finally {
              setIsGeneratingPDF(false);
            }
          },
        },
      ]
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

  const handleSubmitInvoice = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    if (!invoiceForm.date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = invoiceForm.date.toISOString().split('T')[0];
      const totalAmount = calculateTotal();

      // Calculate discount fields
      const discountValue = parseFloat(invoiceForm.discount_value) || 0;
      const discount_percentage = invoiceForm.discount_type === 'percentage' ? discountValue : 0;
      const discount = invoiceForm.discount_type === 'amount' ? discountValue : 0;

      const invoiceData = {
        brand_type: invoiceForm.brand_type,
        customer_name: invoiceForm.customer_name,
        event_name: invoiceForm.event_name || undefined,
        date: formattedDate,
        status: invoiceForm.status,
        rented_items: selectedItems.map(i => ({
          product_id: i.product_id,
          name: i.name,
          qty: i.qty,
          rate: i.rate,
        })),
        total_amount: totalAmount,
        paid_amount: parseFloat(invoiceForm.paid_amount) || 0,
        discount_percentage,
        discount,
      };

      await invoiceService.createInvoice(invoiceData);
      
      Alert.alert('Success', 'Invoice created successfully');
      resetForm();
      setIsModalVisible(false);
      loadInvoices();
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;

    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    if (!invoiceForm.date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = invoiceForm.date.toISOString().split('T')[0];
      const totalAmount = calculateTotal();

      // Calculate discount fields
      const discountValue = parseFloat(invoiceForm.discount_value) || 0;
      const discount_percentage = invoiceForm.discount_type === 'percentage' ? discountValue : 0;
      const discount = invoiceForm.discount_type === 'amount' ? discountValue : 0;

      const updates = {
        brand_type: invoiceForm.brand_type,
        customer_name: invoiceForm.customer_name,
        event_name: invoiceForm.event_name || undefined,
        date: formattedDate,
        status: invoiceForm.status,
        rented_items: selectedItems.map(i => ({
          product_id: i.product_id,
          name: i.name,
          qty: i.qty,
          rate: i.rate,
        })),
        total_amount: totalAmount,
        paid_amount: parseFloat(invoiceForm.paid_amount) || 0,
        discount_percentage,
        discount,
      };

      await invoiceService.updateInvoice(editingInvoice._id, updates);
      
      Alert.alert('Success', 'Invoice updated successfully');
      resetForm();
      setIsModalVisible(false);
      setEditingInvoice(null);
      loadInvoices();
    } catch (error: any) {
      console.error('Invoice update error:', error);
      Alert.alert('Error', error.message || 'Failed to update invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    
    // Determine discount type and value
    const discountType = invoice.discount_percentage > 0 ? 'percentage' : 'amount';
    const discountValue = invoice.discount_percentage > 0 
      ? invoice.discount_percentage.toString() 
      : invoice.discount.toString();
    
    setInvoiceForm({
      brand_type: invoice.brand_type,
      customer_name: invoice.customer_name,
      event_name: invoice.event_name || '',
      status: invoice.status,
      date: new Date(invoice.date),
      paid_amount: invoice.paid_amount.toString(),
      discount_type: discountType,
      discount_value: discountValue || '',
    });

    setSelectedItems(invoice.rented_items.map(i => ({
      product_id: i.product_id,
      name: i.name,
      qty: i.qty,
      rate: i.rate,
      tempQty: i.qty.toString(),
      tempRate: i.rate.toString(),
    })));

    setIsModalVisible(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsDetailModalVisible(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await invoiceService.deleteInvoice(invoiceId);
              Alert.alert('Success', 'Invoice deleted successfully');
              loadInvoices();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete invoice');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setInvoiceForm({
      brand_type: 'Picbox',
      customer_name: '',
      event_name: '',
      status: 'draft',
      date: null,
      paid_amount: '',
      discount_type: 'percentage',
      discount_value: '',
    });
    setSelectedItems([]);
    setCurrentStep(1);
    setErrors({});
    setProductSearchQuery('');
    setEditingInvoice(null);
  };

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <Card style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <View style={styles.brandRow}>
            <View style={[
              styles.brandBadge,
              item.brand_type === 'Picbox' ? styles.brandPicbox : styles.brandEcho
            ]}>
              <Text style={styles.brandText}>{item.brand_type}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              item.status === 'final' && styles.status_final,
              item.status === 'estimate' && styles.status_estimate,
              item.status === 'draft' && styles.status_draft,
            ]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.invoiceNumberRow}>
            <Text style={styles.invoiceNumberLabel}>Invoice #</Text>
            <Text style={styles.invoiceNumberValue}>{item.invoice_number}</Text>
          </View>
          <Text style={styles.customerName}>{item.customer_name}</Text>
          {item.event_name && (
            <Text style={styles.eventName}>
              <Ionicons name="calendar-outline" size={14} /> {item.event_name}
            </Text>
          )}
          <Text style={styles.invoiceDate}>{formatDate(item.date)}</Text>
        </View>
      </View>

      <View style={styles.amountSection}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total:</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.total_amount)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Paid:</Text>
          <Text style={[styles.amountValue, styles.paidAmount]}>{formatCurrency(item.paid_amount)}</Text>
        </View>
        {item.pending_amount > 0 && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Pending:</Text>
            <Text style={[styles.amountValue, styles.pendingAmount]}>{formatCurrency(item.pending_amount)}</Text>
          </View>
        )}
      </View>

      <View style={styles.invoiceFooter}>
        <View style={styles.invoiceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewInvoice(item)}
          >
            <Ionicons name="eye-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditInvoice(item)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteInvoice(item._id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  if (isLoading && invoices.length === 0) {
    return <LoadingSpinner message="Loading invoices..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices..."
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

      {/* Invoice List */}
      <FlatList
        data={invoices}
        renderItem={renderInvoice}
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
            <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No Invoices Found</Text>
            <Text style={styles.emptySubtext}>Create your first invoice</Text>
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

      {/* Create/Edit Invoice Wizard Modal */}
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
            <Text style={styles.wizardTitle}>{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {[1, 2, 3].map((step) => (
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
                  {step === 1 ? 'Basic' : step === 2 ? 'Items' : 'Review'}
                </Text>
              </View>
            ))}
          </View>

          {/* Step Content */}
          <ScrollView style={styles.stepContent}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <View>
                <Text style={styles.stepTitle}>Invoice Information</Text>
                <Text style={styles.stepSubtitle}>Enter customer and invoice details</Text>

                {/* Brand Type */}
                <Text style={styles.inputLabel}>Brand Type *</Text>
                <View style={styles.brandSelector}>
                  {['Picbox', 'Echo'].map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={[
                        styles.brandOption,
                        invoiceForm.brand_type === brand && styles.brandOptionActive
                      ]}
                      onPress={() => setInvoiceForm({ ...invoiceForm, brand_type: brand as 'Picbox' | 'Echo' })}
                    >
                      <Text style={[
                        styles.brandOptionText,
                        invoiceForm.brand_type === brand && styles.brandOptionTextActive
                      ]}>
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Customer Name *"
                  placeholder="Enter customer name"
                  value={invoiceForm.customer_name}
                  onChangeText={(text) => setInvoiceForm({ ...invoiceForm, customer_name: text })}
                  error={errors.customer_name}
                />

                <Input
                  label="Event Name (Optional)"
                  placeholder="e.g., Wedding, Conference"
                  value={invoiceForm.event_name}
                  onChangeText={(text) => setInvoiceForm({ ...invoiceForm, event_name: text })}
                />

                <DatePicker
                  label="Invoice Date *"
                  value={invoiceForm.date}
                  onChange={(date) => setInvoiceForm({ ...invoiceForm, date })}
                  error={errors.date}
                />

                {/* Status */}
                <Text style={styles.inputLabel}>Status *</Text>
                <View style={styles.statusSelector}>
                  {['draft', 'estimate', 'final'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        invoiceForm.status === status && styles.statusOptionActive
                      ]}
                      onPress={() => setInvoiceForm({ ...invoiceForm, status: status as 'draft' | 'estimate' | 'final' })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        invoiceForm.status === status && styles.statusOptionTextActive
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Paid Amount"
                  placeholder="0.00"
                  value={invoiceForm.paid_amount}
                  onChangeText={(text) => setInvoiceForm({ ...invoiceForm, paid_amount: text })}
                  keyboardType="numeric"
                />

                {/* Discount Section */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.inputLabel}>Discount</Text>
                  
                  {/* Discount Type Toggle */}
                  <View style={styles.statusSelector}>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        invoiceForm.discount_type === 'percentage' && styles.statusOptionActive
                      ]}
                      onPress={() => setInvoiceForm({ ...invoiceForm, discount_type: 'percentage' })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        invoiceForm.discount_type === 'percentage' && styles.statusOptionTextActive
                      ]}>
                        Percentage (%)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        invoiceForm.discount_type === 'amount' && styles.statusOptionActive
                      ]}
                      onPress={() => setInvoiceForm({ ...invoiceForm, discount_type: 'amount' })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        invoiceForm.discount_type === 'amount' && styles.statusOptionTextActive
                      ]}>
                        Amount (₹)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Input
                    label={invoiceForm.discount_type === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                    placeholder={invoiceForm.discount_type === 'percentage' ? '0' : '0.00'}
                    value={invoiceForm.discount_value}
                    onChangeText={(text) => setInvoiceForm({ ...invoiceForm, discount_value: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            {/* Step 2: Select Items */}
            {currentStep === 2 && (
              <View>
                <Text style={styles.stepTitle}>Select Items</Text>
                <Text style={styles.stepSubtitle}>Choose products and set quantities & rates</Text>

                {/* Product Search */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
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
                            value={isSelected.tempQty !== undefined ? isSelected.tempQty : isSelected.qty.toString()}
                            onChangeText={(text) => updateItemQty(product._id, text)}
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
                    {productSearchQuery ? 'No products found' : 'No products available'}
                  </Text>
                )}
              </View>
            )}

            {/* Step 3: Review & Summary */}
            {currentStep === 3 && (
              <View>
                <Text style={styles.stepTitle}>Review Invoice</Text>

                <Card style={styles.summary}>
                  <Text style={styles.summaryTitle}>Invoice Summary</Text>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Brand:</Text>
                    <Text style={styles.summaryValue}>{invoiceForm.brand_type}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Customer:</Text>
                    <Text style={styles.summaryValue}>{invoiceForm.customer_name}</Text>
                  </View>

                  {invoiceForm.event_name && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Event:</Text>
                      <Text style={styles.summaryValue}>{invoiceForm.event_name}</Text>
                    </View>
                  )}

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Status:</Text>
                    <Text style={styles.summaryValue}>{invoiceForm.status}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Items:</Text>
                    <Text style={styles.summaryValue}>{selectedItems.length}</Text>
                  </View>

                  {selectedItems.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemCalc}>
                        {item.qty} × {formatCurrency(item.rate)} = {formatCurrency(item.qty * item.rate)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.summaryTotal}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal:</Text>
                      <Text style={styles.summaryValue}>{formatCurrency(calculateSubtotal())}</Text>
                    </View>
                    
                    {calculateDiscount() > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.success }]}>
                          Discount {invoiceForm.discount_type === 'percentage' ? `(${invoiceForm.discount_value}%)` : ''}:
                        </Text>
                        <Text style={[styles.summaryValue, { color: colors.success }]}>
                          - {formatCurrency(calculateDiscount())}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryTotalLabel}>Total Amount:</Text>
                      <Text style={styles.summaryTotalValue}>{formatCurrency(calculateTotal())}</Text>
                    </View>
                    {invoiceForm.paid_amount && parseFloat(invoiceForm.paid_amount) > 0 && (
                      <>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Paid:</Text>
                          <Text style={styles.summaryValue}>{formatCurrency(parseFloat(invoiceForm.paid_amount))}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Pending:</Text>
                          <Text style={[styles.summaryValue, styles.pendingText]}>
                            {formatCurrency(calculateTotal() - parseFloat(invoiceForm.paid_amount))}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </Card>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.wizardFooter}>
            {currentStep > 1 && (
              <Button
                title="Back"
                onPress={handleBack}
                variant="secondary"
                style={styles.footerButton}
              />
            )}
            {currentStep < 3 ? (
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.footerButton}
              />
            ) : (
              <Button
                title={editingInvoice ? "Update Invoice" : "Create Invoice"}
                onPress={editingInvoice ? handleUpdateInvoice : handleSubmitInvoice}
                loading={isLoading}
                style={styles.footerButton}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Invoice Details Modal */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.detailModalContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsDetailModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Invoice Details</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.detailContent}>
            {viewingInvoice && (
              <>
                <Card style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Invoice Number:</Text>
                    <Text style={styles.detailValue}>#{viewingInvoice.invoice_number}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Brand:</Text>
                    <View style={[
                      styles.brandBadge,
                      viewingInvoice.brand_type === 'Picbox' ? styles.brandPicbox : styles.brandEcho
                    ]}>
                      <Text style={styles.brandText}>{viewingInvoice.brand_type}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer:</Text>
                    <Text style={styles.detailValue}>{viewingInvoice.customer_name}</Text>
                  </View>

                  {viewingInvoice.event_name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Event:</Text>
                      <Text style={styles.detailValue}>{viewingInvoice.event_name}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(viewingInvoice.date)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[
                      styles.statusBadge,
                      viewingInvoice.status === 'final' && styles.status_final,
                      viewingInvoice.status === 'estimate' && styles.status_estimate,
                      viewingInvoice.status === 'draft' && styles.status_draft,
                    ]}>
                      <Text style={styles.statusText}>{viewingInvoice.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Discount Information */}
                  {(viewingInvoice.discount > 0 || viewingInvoice.discount_percentage > 0) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Discount:</Text>
                      <Text style={styles.detailValue}>
                        {viewingInvoice.discount_percentage > 0 
                          ? `${viewingInvoice.discount_percentage}% (${formatCurrency(viewingInvoice.subtotal * viewingInvoice.discount_percentage / 100)})`
                          : formatCurrency(viewingInvoice.discount)
                        }
                      </Text>
                    </View>
                  )}
                </Card>

                <Card style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Items ({viewingInvoice.rented_items.length})</Text>
                  
                  {viewingInvoice.rented_items.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={styles.listItemLeft}>
                        <Text style={styles.listItemName}>{item.name}</Text>
                        <Text style={styles.listItemSubtext}>
                          Qty: {item.qty} × {formatCurrency(item.rate)}
                        </Text>
                      </View>
                      <Text style={styles.listItemAmount}>{formatCurrency(item.qty * item.rate)}</Text>
                    </View>
                  ))}

                  <View style={styles.subtotalRow}>
                    <Text style={styles.subtotalLabel}>Subtotal:</Text>
                    <Text style={styles.subtotalValue}>{formatCurrency(viewingInvoice.subtotal || viewingInvoice.total_amount)}</Text>
                  </View>
                  
                  {/* Show discount if applicable */}
                  {(viewingInvoice.discount > 0 || viewingInvoice.discount_percentage > 0) && (
                    <View style={styles.subtotalRow}>
                      <Text style={[styles.subtotalLabel, { color: colors.success }]}>
                        Discount {viewingInvoice.discount_percentage > 0 ? `(${viewingInvoice.discount_percentage}%)` : ''}:
                      </Text>
                      <Text style={[styles.subtotalValue, { color: colors.success }]}>
                        - {formatCurrency(
                          viewingInvoice.discount_percentage > 0 
                            ? (viewingInvoice.subtotal || viewingInvoice.total_amount) * viewingInvoice.discount_percentage / 100
                            : viewingInvoice.discount
                        )}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.subtotalRow}>
                    <Text style={styles.subtotalLabel}>Total:</Text>
                    <Text style={styles.subtotalValue}>{formatCurrency(viewingInvoice.total_amount)}</Text>
                  </View>
                </Card>

                <Card style={styles.totalCard}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>{formatCurrency(viewingInvoice.total_amount)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Paid Amount</Text>
                    <Text style={styles.totalValue}>{formatCurrency(viewingInvoice.paid_amount)}</Text>
                  </View>
                  {viewingInvoice.pending_amount > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Pending Amount</Text>
                      <Text style={[styles.totalValue, styles.pendingHighlight]}>
                        {formatCurrency(viewingInvoice.pending_amount)}
                      </Text>
                    </View>
                  )}
                </Card>

                {/* PDF Export */}
                <Card style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>📄 Download Invoice PDF</Text>
                  
                  <Text style={styles.pdfInfoText}>
                    Generate and download a professional PDF invoice with company logo, bank details, and UPI QR code for easy payment.
                  </Text>
                  
                  <Button
                    title={isGeneratingPDF ? "Generating PDF..." : "Download Invoice PDF"}
                    onPress={() => handleGeneratePDF(viewingInvoice._id)}
                    loading={isGeneratingPDF}
                    icon={<Ionicons name="download-outline" size={20} color={colors.white} />}
                  />
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
  invoiceCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  invoiceHeader: {
    marginBottom: spacing.sm,
  },
  invoiceInfo: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  brandBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  brandPicbox: {
    backgroundColor: colors.primary + '20',
  },
  brandEcho: {
    backgroundColor: '#9C27B0' + '20',
  },
  brandText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_draft: {
    backgroundColor: colors.textSecondary + '20',
  },
  status_estimate: {
    backgroundColor: '#FF9800' + '20',
  },
  status_final: {
    backgroundColor: colors.success + '20',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  invoiceNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  invoiceNumberLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  invoiceNumberValue: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
  customerName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  eventName: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  invoiceDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  amountSection: {
    marginVertical: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  amountValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  paidAmount: {
    color: colors.success,
  },
  pendingAmount: {
    color: colors.error,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  invoiceActions: {
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
  brandSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  brandOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  brandOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  brandOptionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  brandOptionTextActive: {
    color: '#FFFFFF',
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
  summary: {
    padding: spacing.lg,
    marginBottom: spacing.xxl,
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
  itemRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemCalc: {
    ...typography.caption,
    color: colors.textSecondary,
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
  pendingText: {
    color: colors.error,
  },
  wizardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    marginBottom: spacing.xs,
  },
  totalLabel: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  totalValue: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pendingHighlight: {
    color: '#FFEB3B',
  },
  pdfSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
  },
  pdfSuccessText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },
  pdfInfoText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
});
