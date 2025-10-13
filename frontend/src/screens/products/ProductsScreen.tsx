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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../theme';
import { useProductStore } from '../../store/productStore';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';

export default function ProductsScreen() {
  const { products, isLoading, fetchProducts, createProduct, deleteProduct } = useProductStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    description: '',
    purchase_type: 'existing' as 'new' | 'existing',
    purchase_cost: '',
  });
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(searchQuery);
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    fetchProducts(text);
  };

  const validateProduct = () => {
    const newErrors: any = {};
    
    if (!newProduct.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (newProduct.purchase_type === 'new' && !newProduct.purchase_cost) {
      newErrors.purchase_cost = 'Purchase cost is required for new products';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProduct = async () => {
    if (!validateProduct()) return;

    try {
      await createProduct({
        ...newProduct,
        purchase_cost: newProduct.purchase_cost ? parseFloat(newProduct.purchase_cost) : undefined,
      });
      
      Alert.alert('Success', 'Product added successfully');
      setIsAddModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add product');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product._id);
              Alert.alert('Success', 'Product deleted');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewProduct({
      sku: '',
      name: '',
      description: '',
      purchase_type: 'existing',
      purchase_cost: '',
    });
    setErrors({});
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          {item.sku && <Text style={styles.productSku}>SKU: {item.sku}</Text>}
          <Text style={styles.productName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.productDescription}>{item.description}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteProduct(item)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.productFooter}>
        <View style={styles.typeContainer}>
          <View style={[
            styles.typeBadge,
            item.purchase_type === 'new' ? styles.newBadge : styles.existingBadge
          ]}>
            <Text style={styles.typeText}>
              {item.purchase_type === 'new' ? 'New' : 'Existing'}
            </Text>
          </View>
        </View>
        {item.purchase_cost && (
          <Text style={styles.costText}>
            Cost: {formatCurrency(item.purchase_cost)}
          </Text>
        )}
      </View>
    </Card>
  );

  if (isLoading && products.length === 0) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
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

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProduct}
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
            <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Add your first product'}
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Product Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => {
                setIsAddModalVisible(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Input
                label="SKU (Optional)"
                placeholder="e.g., SPK-001"
                value={newProduct.sku}
                onChangeText={(text) => setNewProduct({ ...newProduct, sku: text })}
              />

              <Input
                label="Product Name *"
                placeholder="e.g., JBL EON615 Speaker"
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                error={errors.name}
              />

              <Input
                label="Description"
                placeholder="Product details..."
                value={newProduct.description}
                onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Purchase Type *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newProduct.purchase_type === 'existing' && styles.typeOptionActive
                  ]}
                  onPress={() => setNewProduct({ ...newProduct, purchase_type: 'existing', purchase_cost: '' })}
                >
                  <Text style={[
                    styles.typeOptionText,
                    newProduct.purchase_type === 'existing' && styles.typeOptionTextActive
                  ]}>
                    Existing
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newProduct.purchase_type === 'new' && styles.typeOptionActive
                  ]}
                  onPress={() => setNewProduct({ ...newProduct, purchase_type: 'new' })}
                >
                  <Text style={[
                    styles.typeOptionText,
                    newProduct.purchase_type === 'new' && styles.typeOptionTextActive
                  ]}>
                    New
                  </Text>
                </TouchableOpacity>
              </View>

              {newProduct.purchase_type === 'new' && (
                <Input
                  label="Purchase Cost *"
                  placeholder="0.00"
                  value={newProduct.purchase_cost}
                  onChangeText={(text) => setNewProduct({ ...newProduct, purchase_cost: text })}
                  keyboardType="numeric"
                  error={errors.purchase_cost}
                />
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setIsAddModalVisible(false);
                  resetForm();
                }}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Add Product"
                onPress={handleAddProduct}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
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
  productCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productSku: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  productName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  productDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  typeContainer: {
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  newBadge: {
    backgroundColor: colors.success + '20',
  },
  existingBadge: {
    backgroundColor: colors.primary + '20',
  },
  typeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  costText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
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
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
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
});
