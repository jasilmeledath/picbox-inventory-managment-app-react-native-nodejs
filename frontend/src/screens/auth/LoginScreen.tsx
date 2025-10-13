import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { storage } from '../../utils/storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [currentApiUrl, setCurrentApiUrl] = useState('');

  const { login, isLoading, error, clearError } = useAuthStore();

  // Load current API URL on mount
  useEffect(() => {
    loadCurrentApiUrl();
  }, []);

  const loadCurrentApiUrl = async () => {
    const url = await storage.getApiBaseUrl();
    setCurrentApiUrl(url);
    setApiUrl(url);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    clearError();

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      await login(email.trim(), password);
      // Navigation happens automatically via RootNavigator
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid email or password',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid API URL');
      return;
    }

    // Basic validation
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with http:// or https://');
      return;
    }

    try {
      await storage.setApiBaseUrl(apiUrl.trim());
      setCurrentApiUrl(apiUrl.trim());
      setShowApiSettings(false);
      Alert.alert(
        'Success',
        'API URL updated successfully!\n\nPlease restart the app for changes to take effect.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reload the app would be ideal here
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save API URL');
    }
  };

  const handleResetToDefault = () => {
    const defaultUrl = 'http://192.168.0.102:3000/api';
    setApiUrl(defaultUrl);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Settings Icon */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowApiSettings(true)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>

        {/* Logo/Brand Section */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/logos/picbox-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Inventory Management System</Text>
          <Text style={styles.apiUrlDisplay}>📡 {currentApiUrl}</Text>
        </View>

        {/* Login Form */}
        <Card style={styles.card}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>
            Sign in to manage your inventory
          </Text>

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            onBlur={() => validateEmail(email)}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) validatePassword(text);
            }}
            onBlur={() => validatePassword(password)}
            error={passwordError}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            editable={!isLoading}
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <Button
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          />
        </Card>

        {/* Footer */}
        <Text style={styles.footer}>
          Version 0.1.0 • Tablet Optimized
        </Text>
      </ScrollView>

      {/* API Settings Modal */}
      <Modal
        visible={showApiSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApiSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚙️ API Configuration</Text>
            <Text style={styles.modalSubtitle}>
              Configure the backend server URL
            </Text>

            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>API Base URL</Text>
              <TextInput
                style={styles.textInput}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="http://192.168.x.x:3000/api"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <View style={styles.infoBox2}>
                <Text style={styles.infoText2}>
                  💡 Find your Mac's IP address:
                </Text>
                <Text style={styles.infoText2}>
                  Terminal: ipconfig getifaddr en0
                </Text>
                <Text style={styles.infoText2}>
                  System Settings → Network → WiFi → Details
                </Text>
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetToDefault}
              >
                <Text style={styles.resetButtonText}>
                  🔄 Reset to Default (192.168.0.102)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setApiUrl(currentApiUrl);
                  setShowApiSettings(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveApiUrl}
              >
                <Text style={styles.saveButtonText}>Save & Restart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  settingsButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    padding: spacing.sm,
    zIndex: 10,
  },
  settingsIcon: {
    fontSize: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoImage: {
    height: 100,
    width: '100%',
    maxWidth: 350,
    marginBottom: spacing.md,
  },
  apiUrlDisplay: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.lg,
  },
  formTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  errorContainer: {
    backgroundColor: colors.error + '15',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: spacing.md,
  },
  infoBox: {
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  footer: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Modal Styles
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
    padding: spacing.xl,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalForm: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textInput: {
    ...typography.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoBox2: {
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  infoText2: {
    ...typography.caption,
    color: colors.text,
    marginBottom: 4,
  },
  resetButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
  },
  resetButtonText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
});
