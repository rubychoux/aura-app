import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventStackParamList } from '../types';
import { EventSelectScreen } from '../screens/home/EventSelectScreen';
import { EventSetupScreen } from '../screens/home/EventSetupScreen';

const Stack = createNativeStackNavigator<EventStackParamList>();

export function EventStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventSelect" component={EventSelectScreen} />
      <Stack.Screen name="EventSetup" component={EventSetupScreen} />
    </Stack.Navigator>
  );
}
