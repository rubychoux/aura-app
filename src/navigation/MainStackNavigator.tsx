import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { MainNavigator } from './MainNavigator';
import { EventStackNavigator } from './EventStackNavigator';
import { ScanResultScreen } from '../screens/scanner/ScanResultScreen';
import { PaywallScreen } from '../screens/paywall/PaywallScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainNavigator} />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="EventFlow"
        component={EventStackNavigator}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
