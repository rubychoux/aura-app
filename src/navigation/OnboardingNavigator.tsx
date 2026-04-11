import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { AuthGateScreen } from '../screens/onboarding/AuthGateScreen';
import { EmailSignUpScreen } from '../screens/onboarding/EmailSignUpScreen';
import { OTPVerifyScreen } from '../screens/onboarding/OTPVerifyScreen';
import { LoginScreen } from '../screens/onboarding/LoginScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="AuthGate" component={AuthGateScreen} />
      <Stack.Screen name="EmailSignUp" component={EmailSignUpScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
