import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AIScanStackParamList } from '../types';
import { FaceScannerScreen } from '../screens/scanner/FaceScannerScreen';
import { ScanResultScreen } from '../screens/scanner/ScanResultScreen';

const Stack = createNativeStackNavigator<AIScanStackParamList>();

export function AIScanNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FaceScanner" component={FaceScannerScreen} />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} />
    </Stack.Navigator>
  );
}
