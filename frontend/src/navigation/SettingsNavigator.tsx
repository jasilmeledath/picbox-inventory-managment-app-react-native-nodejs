import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';

// Import screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import CompanyCredentialsScreen from '../screens/settings/CompanyCredentialsScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  CompanyCredentials: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CompanyCredentials"
        component={CompanyCredentialsScreen}
        options={{ title: 'Company Credentials' }}
      />
    </Stack.Navigator>
  );
}
