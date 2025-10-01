import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, shadows } from '../../theme';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { MainTabParamList, JobStackParamList, ProductStackParamList } from '../../navigation/types';

type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<JobStackParamList | ProductStackParamList>
>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { summary, isLoading, fetchSummary, refreshSummary } = useDashboardStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleRefresh = async () => {
    try {
      await refreshSummary();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to refresh dashboard');
    }
  };

  // Quick Action Handlers
  const handleNewJob = () => {
    navigation.navigate('Jobs', { screen: 'CreateJob' } as any);
  };

  const handleAddProduct = () => {
    navigation.navigate('Products', { screen: 'AddProduct' } as any);
  };

  const handleRecordPayment = () => {
    // Navigate to Employees screen - user can select employee to pay
    navigation.navigate('Employees');
    Alert.alert(
      'Record Payment',
      'Select an employee from the list to record a payment.',
      [{ text: 'OK' }]
    );
  };

  const handleNewInvoice = () => {
    navigation.navigate('Invoices');
    Alert.alert(
      'New Invoice',
      'Navigate to the Invoices tab to create a new invoice.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading && !summary) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Company Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/logos/picbox-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="stats-chart" size={40} color={colors.primary} />
        </View>
      </View>

      {/* Financial Metrics Cards */}
      <View style={styles.metricsGrid}>
        {/* Revenue Card */}
        <Card style={styles.revenueCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="trending-up" size={24} color={colors.success} />
            <Text style={styles.metricLabel}>Total Revenue</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            {formatCurrency(summary?.totalRevenue || 0)}
          </Text>
          <Text style={styles.metricSubtext}>From all jobs</Text>
        </Card>

        {/* Expenses Card */}
        <Card style={styles.expensesCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="trending-down" size={24} color={colors.error} />
            <Text style={styles.metricLabel}>Total Expenses</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.error }]}>
            {formatCurrency(summary?.totalExpenses || 0)}
          </Text>
          <Text style={styles.metricSubtext}>Wages + Job costs</Text>
        </Card>

        {/* Profit Card */}
        <Card style={styles.profitCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="wallet" size={24} color={colors.primary} />
            <Text style={styles.metricLabel}>Net Profit</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.primary }]}>
            {formatCurrency(summary?.profit || 0)}
          </Text>
          <Text style={styles.metricSubtext}>Revenue - Expenses</Text>
        </Card>
      </View>

      {/* Wages Summary */}
      <Card style={styles.wagesCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>💰 Wage Summary</Text>
        </View>
        <View style={styles.wagesGrid}>
          <View style={styles.wageItem}>
            <Text style={styles.wageLabel}>Pending</Text>
            <Text style={[styles.wageValue, { color: colors.warning }]}>
              {formatCurrency(summary?.totalWagesPending || 0)}
            </Text>
          </View>
          <View style={styles.wageDivider} />
          <View style={styles.wageItem}>
            <Text style={styles.wageLabel}>Paid</Text>
            <Text style={[styles.wageValue, { color: colors.success }]}>
              {formatCurrency(summary?.totalWagesPaid || 0)}
            </Text>
          </View>
        </View>
        <Text style={styles.wagesNote}>
          Total wages: {formatCurrency((summary?.totalWagesPending || 0) + (summary?.totalWagesPaid || 0))}
        </Text>
      </Card>

      {/* Breakdown */}
      {summary?.breakdowns && (
        <Card style={styles.breakdownCard}>
          <Text style={styles.cardTitle}>📊 Expense Breakdown</Text>
          <View style={styles.breakdownList}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Wages Pending</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(summary.breakdowns.wagesPending)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Wages Paid</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(summary.breakdowns.wagesPaid)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Job Expenses</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(summary.breakdowns.jobExpenses)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Purchase Costs</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(summary.breakdowns.purchaseCosts)}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Recent Jobs */}
      {summary?.recentJobs && summary.recentJobs.length > 0 && (
        <Card style={styles.recentJobsCard}>
          <Text style={styles.cardTitle}>📅 Recent Jobs</Text>
          {summary.recentJobs.slice(0, 5).map((job) => (
            <View key={job._id} style={styles.jobItem}>
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobDate}>
                  {formatDate(job.date)}
                </Text>
              </View>
              <View style={styles.jobAmount}>
                <Text style={[styles.jobCost, { color: colors.success }]}>
                  {formatCurrency(job.total_cost)}
                </Text>
                <View style={[
                  styles.statusBadge,
                  job.status === 'completed' && styles.status_completed,
                  job.status === 'in-progress' && styles.status_in_progress,
                  job.status === 'planned' && styles.status_planned,
                ]}>
                  <Text style={styles.statusText}>{job.status.replace('-', ' ')}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleNewJob}
            activeOpacity={0.7}
          >
            <Ionicons name="briefcase-outline" size={28} color={colors.primary} />
            <Text style={styles.actionText}>New Job</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleAddProduct}
            activeOpacity={0.7}
          >
            <Ionicons name="cube-outline" size={28} color={colors.accent} />
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleRecordPayment}
            activeOpacity={0.7}
          >
            <Ionicons name="cash-outline" size={28} color={colors.success} />
            <Text style={styles.actionText}>Record Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleNewInvoice}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={28} color={colors.warning} />
            <Text style={styles.actionText}>New Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Empty State */}
      {!summary && !isLoading && (
        <Card style={styles.emptyCard}>
          <Ionicons name="bar-chart-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={styles.emptySubtext}>Create jobs to see your dashboard</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  logo: {
    height: 70,
    width: '100%',
    maxWidth: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  revenueCard: {
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  expensesCard: {
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  profitCard: {
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  metricValue: {
    ...typography.h1,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  metricSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  wagesCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  wagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  wageItem: {
    alignItems: 'center',
    flex: 1,
  },
  wageDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
  },
  wageLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  wageValue: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  wagesNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  breakdownCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  breakdownList: {
    marginTop: spacing.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  breakdownLabel: {
    ...typography.body,
    color: colors.text,
  },
  breakdownValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  recentJobsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  jobItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  jobDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  jobAmount: {
    alignItems: 'flex-end',
  },
  jobCost: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.textSecondary,
  },
  statusText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  status_completed: {
    backgroundColor: colors.success,
  },
  status_in_progress: {
    backgroundColor: colors.warning,
  },
  status_planned: {
    backgroundColor: colors.primary,
  },
  quickActions: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.small,
  },
  actionText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyCard: {
    padding: spacing.xxl,
    alignItems: 'center',
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
});
