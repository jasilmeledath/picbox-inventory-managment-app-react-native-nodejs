import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, typography, spacing, shadows } from '../../theme';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { storage } from '../../utils/storage';
import { SettingsStackParamList } from '../../navigation/SettingsNavigator';
import backupService, { BackupInfo } from '../../api/backupService';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

export default function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);

  useEffect(() => {
    loadApiUrl();
    loadBackupInfo();
  }, []);

  const loadApiUrl = async () => {
    const url = await storage.getApiBaseUrl();
    setApiBaseUrl(url);
    setTempUrl(url);
  };

  const loadBackupInfo = async () => {
    try {
      const info = await backupService.getBackupInfo();
      setBackupInfo(info);
    } catch (error) {
      console.error('Failed to load backup info:', error);
    }
  };

  const handleSaveUrl = async () => {
    if (!tempUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      await storage.setApiBaseUrl(tempUrl);
      setApiBaseUrl(tempUrl);
      setIsEditingUrl(false);
      Alert.alert(
        'Success',
        'API Base URL updated successfully. Please restart the app for changes to take effect.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save API URL');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleResetUrl = () => {
    Alert.alert(
      'Reset API URL',
      'Reset to default URL (http://192.168.0.111:3000/api)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            const defaultUrl = 'http://192.168.0.111:3000/api';
            await storage.setApiBaseUrl(defaultUrl);
            setApiBaseUrl(defaultUrl);
            setTempUrl(defaultUrl);
            Alert.alert('Success', 'API URL reset to default');
          },
        },
      ]
    );
  };

  const handleDownloadBackup = async () => {
    Alert.alert(
      'Download Backup',
      'This will download all your data as a JSON file. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Download',
          onPress: async () => {
            setIsDownloadingBackup(true);
            try {
              const backupData = await backupService.downloadBackup();
              
              const filename = `picbox_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
              const jsonString = JSON.stringify(backupData, null, 2);
              
              // Use the new expo-file-system API
              const file = new File(Paths.cache, filename);
              file.write(jsonString, { encoding: 'utf8' });

              // Share the file
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(file.uri, {
                  mimeType: 'application/json',
                  dialogTitle: 'Save backup file',
                  UTI: 'public.json',
                });

                // Calculate total records
                const recordCounts = backupData.metadata.record_counts;
                const totalRecords = recordCounts.users + recordCounts.employees + 
                  recordCounts.products + recordCounts.jobs + recordCounts.invoices + 
                  recordCounts.payments + recordCounts.companyCredentials + recordCounts.counters;

                Alert.alert(
                  'Success',
                  `Backup downloaded successfully!\n\nTotal Records: ${totalRecords}\nCollections: ${backupData.metadata.total_collections}`,
                  [{ text: 'OK' }]
                );
              } else {
                throw new Error('Sharing is not available on this device');
              }
            } catch (error: any) {
              console.error('Backup download error:', error);
              Alert.alert('Error', error.message || 'Failed to download backup');
            } finally {
              setIsDownloadingBackup(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* User Info */}
        <Card style={styles.section}>
          <View style={styles.userHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
              {user?.isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* API Configuration */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>API Configuration</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Base URL</Text>
            <Text style={styles.settingValue} numberOfLines={1}>{apiBaseUrl}</Text>
          </View>

          <View style={styles.buttonRow}>
            <Button
              title="Edit URL"
              onPress={() => setIsEditingUrl(true)}
              variant="secondary"
              style={styles.halfButton}
            />
            <Button
              title="Reset"
              onPress={handleResetUrl}
              variant="secondary"
              style={styles.halfButton}
            />
          </View>
        </Card>

        {/* Company Details */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Company Details</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CompanyCredentials')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Invoice Company Credentials</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Configure company details, bank info, and UPI details for invoice generation
          </Text>
        </Card>

        {/* Database Backup */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-download-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Database Backup</Text>
          </View>

          {backupInfo && (
            <>
              <View style={styles.backupInfoContainer}>
                <View style={styles.backupStat}>
                  <Text style={styles.backupStatLabel}>Total Records</Text>
                  <Text style={styles.backupStatValue}>{backupInfo.total_records}</Text>
                </View>
                <View style={styles.backupStatDivider} />
                <View style={styles.backupStat}>
                  <Text style={styles.backupStatLabel}>Collections</Text>
                  <Text style={styles.backupStatValue}>{backupInfo.total_collections}</Text>
                </View>
              </View>

              <View style={styles.backupDetails}>
                <View style={styles.backupDetailRow}>
                  <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.backupDetailText}>Employees: {backupInfo.collections.employees}</Text>
                </View>
                <View style={styles.backupDetailRow}>
                  <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.backupDetailText}>Products: {backupInfo.collections.products}</Text>
                </View>
                <View style={styles.backupDetailRow}>
                  <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.backupDetailText}>Jobs: {backupInfo.collections.jobs}</Text>
                </View>
                <View style={styles.backupDetailRow}>
                  <Ionicons name="document-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.backupDetailText}>Invoices: {backupInfo.collections.invoices}</Text>
                </View>
              </View>
            </>
          )}

          <Button
            title={isDownloadingBackup ? "Downloading..." : "Download Backup (JSON)"}
            onPress={handleDownloadBackup}
            disabled={isDownloadingBackup}
            style={styles.backupButton}
          />

          <Text style={styles.helperText}>
            Download a complete backup of all database records in JSON format. Use this for data safety and migration.
          </Text>
        </Card>

        {/* App Information */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>App Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>Production</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>React Native</Text>
          </View>
        </Card>

        {/* About */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>

          <Text style={styles.aboutText}>
            PicBox Inventory Management System - A comprehensive solution for managing sound systems rental business operations, including inventory, employees, jobs, and payments.
          </Text>
        </Card>

        {/* Developer Information */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code-slash-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Developer</Text>
          </View>

          <View style={styles.developerInfo}>
            <View style={styles.developerRow}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <View style={styles.developerTextContainer}>
                <Text style={styles.developerLabel}>Name</Text>
                <Text style={styles.developerValue}>Jasil Meledath</Text>
              </View>
            </View>

            <View style={styles.developerRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <View style={styles.developerTextContainer}>
                <Text style={styles.developerLabel}>Email</Text>
                <Text style={styles.developerValue}>jasilmeledath@gmail.com</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 PicBox. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Edit URL Modal */}
      <Modal
        visible={isEditingUrl}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingUrl(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit API Base URL</Text>
              <TouchableOpacity onPress={() => setIsEditingUrl(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter the complete API base URL including protocol (http/https) and /api suffix.
            </Text>

            <TextInput
              style={styles.urlInput}
              value={tempUrl}
              onChangeText={setTempUrl}
              placeholder="http://192.168.0.111:3000/api"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={styles.urlHint}>
              Example: http://192.168.0.111:3000/api
            </Text>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setTempUrl(apiBaseUrl);
                  setIsEditingUrl(false);
                }}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleSaveUrl}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  settingItem: {
    marginBottom: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  settingValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  aboutText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  backupInfoContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  backupStat: {
    flex: 1,
    alignItems: 'center',
  },
  backupStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  backupStatValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  backupStatDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  backupDetails: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backupDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backupDetailText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  backupButton: {
    marginBottom: spacing.xs,
  },
  developerInfo: {
    gap: spacing.md,
  },
  developerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  developerTextContainer: {
    flex: 1,
  },
  developerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  developerValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: spacing.md,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 500,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  urlInput: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  urlHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
