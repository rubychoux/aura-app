import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AIScanStackParamList } from '../types';
import { SkincareScreen } from '../screens/skincare/SkincareScreen';
import { DailyLogScreen } from '../screens/skincare/DailyLogScreen';
import { FaceScannerScreen } from '../screens/scanner/FaceScannerScreen';
import { IngredientScannerScreen } from '../screens/scanner/IngredientScannerScreen';
import { IngredientResultScreen } from '../screens/scanner/IngredientResultScreen';

const Stack = createNativeStackNavigator<AIScanStackParamList>();

export function AIScanNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SkinHome" component={SkincareScreen} />
      <Stack.Screen name="DailyLog" component={DailyLogScreen} />
      <Stack.Screen name="FaceScanner" component={FaceScannerScreen} />
      <Stack.Screen name="IngredientScanner" component={IngredientScannerScreen} />
      <Stack.Screen name="IngredientResult" component={IngredientResultScreen} />
    </Stack.Navigator>
  );
}
