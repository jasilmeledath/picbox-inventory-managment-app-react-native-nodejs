import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { useCompanyCredentialStore } from '../../store/companyCredentialStore';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { CompanyCredentialInput } from '../../api/companyCredential.service';

type FormSection = 'address' | 'contact' | 'bank' | 'upi' | 'tax' | null;

export default function CompanyCredentialsScreen() {
  const {
    picboxCredential,
    echoCredential,
    isLoading,
    error,
    fetchCompanyCredentials,
    createCompanyCredential,
    updateCompanyCredential,
    clearError
  } = useCompanyCredentialStore();

  const [selectedCompany, setSelectedCompany] = useState<'Picbox' | 'Echo'>('Picbox');
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<FormSection>(null);

  // Form state
  const [formData, setFormData] = useState<CompanyCredentialInput>({
    company_name: 'Picbox',
    display_name: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
    },
    contact: {
      primary_phone: '',
      alternate_phone: '',
      email: '',
    },
    bank_details: {
      account_name: '',
      account_number: '',
      ifsc_code: '',
      bank_name: '',
      branch: '',
    },
    upi_details: {
      upi_id: '',
      google_pay_number: '',
      payee_name: '',
    },
    tax_details: {
      gstin: '',
      pan: '',
    },
    notes: '',
  });

  useEffect(() => {
    fetchCompanyCredentials();
  }, []);

  useEffect(() => {
    const credential = selectedCompany === 'Picbox' ? picboxCredential : echoCredential;
    if (credential && !isEditing) {
      setFormData({
        company_name: credential.company_name,
        display_name: credential.display_name,
        address: credential.address,
        contact: credential.contact,
        bank_details: credential.bank_details || {},
        upi_details: credential.upi_details || {},
        tax_details: credential.tax_details || {},
        notes: credential.notes || '',
      });
    } else if (!credential && !isEditing) {
      // Reset form for new company
      setFormData({
        company_name: selectedCompany,
        display_name: selectedCompany === 'Picbox' ? 'PIC BOX ADS & EVENTS' : 'ECHO SOUND SYSTEMS',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
        },
        contact: {
          primary_phone: '',
          alternate_phone: '',
          email: '',
        },
        bank_details: {
          account_name: '',
          account_number: '',
          ifsc_code: '',
          bank_name: '',
          branch: '',
        },
        upi_details: {
          upi_id: '',
          google_pay_number: '',
          payee_name: '',
        },
        tax_details: {
          gstin: '',
          pan: '',
        },
        notes: '',
      });
    }
  }, [selectedCompany, picboxCredential, echoCredential, isEditing]);

  const currentCredential = selectedCompany === 'Picbox' ? picboxCredential : echoCredential;

  const handleSave = async () => {
    try {
      // Validate required fields
      const errors: string[] = [];
      
      if (!formData.display_name?.trim()) {
        errors.push('Display Name');
      }
      if (!formData.address?.line1?.trim()) {
        errors.push('Address Line 1');
      }
      if (!formData.address?.city?.trim()) {
        errors.push('City');
      }
      if (!formData.address?.state?.trim()) {
        errors.push('State');
      }
      if (!formData.address?.pincode?.trim()) {
        errors.push('Pincode');
      }
      if (!formData.contact?.primary_phone?.trim()) {
        errors.push('Primary Phone');
      }

      if (errors.length > 0) {
        Alert.alert(
          'Validation Error',
          `Please fill in the following required fields:\n\n${errors.join('\n')}`
        );
        return;
      }

      if (currentCredential) {
        await updateCompanyCredential(currentCredential._id, formData);
        Alert.alert('Success', 'Company credentials updated successfully');
      } else {
        await createCompanyCredential(formData);
        Alert.alert('Success', 'Company credentials created successfully');
      }
      
      setIsEditing(false);
      fetchCompanyCredentials();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save company credentials');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form
    const credential = selectedCompany === 'Picbox' ? picboxCredential : echoCredential;
    if (credential) {
      setFormData({
        company_name: credential.company_name,
        display_name: credential.display_name,
        address: credential.address,
        contact: credential.contact,
        bank_details: credential.bank_details || {},
        upi_details: credential.upi_details || {},
        tax_details: credential.tax_details || {},
        notes: credential.notes || '',
      });
    }
  };

  const renderSectionHeader = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    section: FormSection
  ) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => setExpandedSection(expandedSection === section ? null : section)}
    >
      <View style={styles.sectionHeaderLeft}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Ionicons
        name={expandedSection === section ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  if (isLoading && !currentCredential) {
    return <LoadingSpinner message="Loading company credentials..." />;
  }

  return (
    <View style={styles.container}>
      {/* Company Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedCompany === 'Picbox' && styles.tabActive]}
          onPress={() => setSelectedCompany('Picbox')}
        >
          <Text style={[styles.tabText, selectedCompany === 'Picbox' && styles.tabTextActive]}>
            PicBox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedCompany === 'Echo' && styles.tabActive]}
          onPress={() => setSelectedCompany('Echo')}
        >
          <Text style={[styles.tabText, selectedCompany === 'Echo' && styles.tabTextActive]}>
            Echo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </Card>
        )}

        {!currentCredential && !isEditing && (
          <Card style={styles.emptyCard}>
            <Ionicons name="business-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No credentials configured for {selectedCompany}</Text>
            <Button
              title="Setup Company Details"
              onPress={() => setIsEditing(true)}
            />
          </Card>
        )}

        {(currentCredential || isEditing) && (
          <Card>
            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.label}>Display Name *</Text>
              <RNTextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.display_name}
                onChangeText={(text) => setFormData({ ...formData, display_name: text })}
                placeholder="Company Display Name"
                editable={isEditing}
              />
            </View>

            {/* Address Section */}
            {renderSectionHeader('Address Details', 'location', 'address')}
            {expandedSection === 'address' && (
              <View style={styles.sectionContent}>
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.address.line1}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address: { ...formData.address, line1: text } })
                  }
                  placeholder="Address Line 1 *"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.address.line2}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address: { ...formData.address, line2: text } })
                  }
                  placeholder="Address Line 2"
                  editable={isEditing}
                />
                <View style={styles.row}>
                  <RNTextInput
                    style={[styles.input, styles.flex1, !isEditing && styles.inputDisabled]}
                    value={formData.address.city}
                    onChangeText={(text) =>
                      setFormData({ ...formData, address: { ...formData.address, city: text } })
                    }
                    placeholder="City *"
                    editable={isEditing}
                  />
                  <View style={{ width: spacing.sm }} />
                  <RNTextInput
                    style={[styles.input, styles.flex1, !isEditing && styles.inputDisabled]}
                    value={formData.address.state}
                    onChangeText={(text) =>
                      setFormData({ ...formData, address: { ...formData.address, state: text } })
                    }
                    placeholder="State *"
                    editable={isEditing}
                  />
                </View>
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.address.pincode}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address: { ...formData.address, pincode: text } })
                  }
                  placeholder="Pincode *"
                  keyboardType="numeric"
                  editable={isEditing}
                />
              </View>
            )}

            {/* Contact Section */}
            {renderSectionHeader('Contact Details', 'call', 'contact')}
            {expandedSection === 'contact' && (
              <View style={styles.sectionContent}>
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.contact.primary_phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, contact: { ...formData.contact, primary_phone: text } })
                  }
                  placeholder="Primary Phone *"
                  keyboardType="phone-pad"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.contact.alternate_phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, contact: { ...formData.contact, alternate_phone: text } })
                  }
                  placeholder="Alternate Phone"
                  keyboardType="phone-pad"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.contact.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, contact: { ...formData.contact, email: text } })
                  }
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={isEditing}
                />
              </View>
            )}

            {/* Bank Details Section */}
            {renderSectionHeader('Bank Details', 'card', 'bank')}
            {expandedSection === 'bank' && (
              <View style={styles.sectionContent}>
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.bank_details?.account_name}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      bank_details: { ...formData.bank_details, account_name: text },
                    })
                  }
                  placeholder="Account Name"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.bank_details?.account_number}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      bank_details: { ...formData.bank_details, account_number: text },
                    })
                  }
                  placeholder="Account Number"
                  keyboardType="numeric"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.bank_details?.ifsc_code}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      bank_details: { ...formData.bank_details, ifsc_code: text.toUpperCase() },
                    })
                  }
                  placeholder="IFSC Code"
                  autoCapitalize="characters"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.bank_details?.bank_name}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      bank_details: { ...formData.bank_details, bank_name: text },
                    })
                  }
                  placeholder="Bank Name"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.bank_details?.branch}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      bank_details: { ...formData.bank_details, branch: text },
                    })
                  }
                  placeholder="Branch"
                  editable={isEditing}
                />
              </View>
            )}

            {/* UPI Details Section */}
            {renderSectionHeader('UPI & Payment Details', 'wallet', 'upi')}
            {expandedSection === 'upi' && (
              <View style={styles.sectionContent}>
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.upi_details?.upi_id}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      upi_details: { ...formData.upi_details, upi_id: text.toLowerCase() },
                    })
                  }
                  placeholder="UPI ID (e.g., name@upi)"
                  autoCapitalize="none"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.upi_details?.google_pay_number}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      upi_details: { ...formData.upi_details, google_pay_number: text },
                    })
                  }
                  placeholder="Google Pay Number"
                  keyboardType="phone-pad"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.upi_details?.payee_name}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      upi_details: { ...formData.upi_details, payee_name: text },
                    })
                  }
                  placeholder="Payee Name"
                  editable={isEditing}
                />
              </View>
            )}

            {/* Tax Details Section */}
            {renderSectionHeader('Tax Details', 'receipt', 'tax')}
            {expandedSection === 'tax' && (
              <View style={styles.sectionContent}>
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.tax_details?.gstin}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      tax_details: { ...formData.tax_details, gstin: text.toUpperCase() },
                    })
                  }
                  placeholder="GSTIN"
                  autoCapitalize="characters"
                  editable={isEditing}
                />
                <RNTextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  value={formData.tax_details?.pan}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      tax_details: { ...formData.tax_details, pan: text.toUpperCase() },
                    })
                  }
                  placeholder="PAN"
                  autoCapitalize="characters"
                  maxLength={10}
                  editable={isEditing}
                />
              </View>
            )}

            {/* Action Buttons */}
            {isEditing ? (
              <View style={styles.buttonRow}>
                <Button
                  title="Cancel"
                  onPress={handleCancel}
                  variant="secondary"
                  style={styles.button}
                />
                <Button
                  title="Save"
                  onPress={handleSave}
                  loading={isLoading}
                  style={styles.button}
                />
              </View>
            ) : (
              <Button
                title="Edit Company Details"
                onPress={() => setIsEditing(true)}
              />
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginVertical: spacing.md,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  sectionContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
});
