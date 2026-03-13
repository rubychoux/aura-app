import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { PhoneAuthScreen } from '../screens/onboarding/PhoneAuthScreen';
import { OTPVerifyScreen } from '../screens/onboarding/OTPVerifyScreen';
import { SkinQuizScreen } from '../screens/onboarding/SkinQuizScreen';
import { PIAPConsentScreen } from '../screens/onboarding/PIAPConsentScreen';
import { NotificationPermissionScreen } from '../screens/onboarding/NotificationPermissionScreen';
import { OnboardingCompleteScreen } from '../screens/onboarding/OnboardingCompleteScreen';

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
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
      <Stack.Screen name="SkinQuiz" component={SkinQuizScreen} />
      <Stack.Screen name="PIAPConsent" component={PIAPConsentScreen} />
      <Stack.Screen name="NotificationPermission" component={NotificationPermissionScreen} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
}
