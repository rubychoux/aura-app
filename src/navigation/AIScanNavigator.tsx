import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AIScanStackParamList } from '../types';
import { SkincareScreen } from '../screens/skincare/SkincareScreen';
import { FaceScannerScreen } from '../screens/scanner/FaceScannerScreen';

const Stack = createNativeStackNavigator<AIScanStackParamList>();

export function AIScanNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SkinHome" component={SkincareScreen} />
      <Stack.Screen name="FaceScanner" component={FaceScannerScreen} />
    </Stack.Navigator>
  );
}
