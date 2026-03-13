import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MainTabParamList } from '../types';
import { Colors, Typography } from '../constants/theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ScanScreen } from '../screens/scan/ScanScreen';
import { LogScreen } from '../screens/log/LogScreen';
import { InsightsScreen } from '../screens/insights/InsightsScreen';
import { ShopScreen } from '../screens/shop/ShopScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const icons: Record<string, string> = {
  Home: '🏠',
  Scan: '🔍',
  Log: '📓',
  Insights: '🧠',
  Shop: '🛍️',
};

const labels: Record<string, string> = {
  Home: '홈',
  Scan: '스캔',
  Log: '로그',
  Insights: '인사이트',
  Shop: '쇼핑',
};

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: () => (
          <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>
        ),
        tabBarLabel: labels[route.name],
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
    </Tab.Navigator>
  );
}
