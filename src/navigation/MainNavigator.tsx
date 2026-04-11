import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { Colors, Typography } from '../constants/theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { FaceScannerScreen } from '../screens/scanner/FaceScannerScreen';
import { SkincareScreen } from '../screens/skincare/SkincareScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { MyPageScreen } from '../screens/mypage/MyPageScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabEmoji: Record<string, { active: string; inactive: string }> = {
  Home:      { active: '🏠', inactive: '🏠' },
  AIScan:    { active: '📸', inactive: '📸' },
  Skincare:  { active: '🧴', inactive: '🧴' },
  Community: { active: '👥', inactive: '👥' },
  MyPage:    { active: '👤', inactive: '👤' },
};

const labels: Record<string, string> = {
  Home: '홈',
  AIScan: 'AI 스캐너',
  Skincare: '스킨케어',
  Community: '커뮤니티',
  MyPage: '마이페이지',
};

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
            {tabEmoji[route.name]?.active ?? '●'}
          </Text>
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
      <Tab.Screen name="AIScan" component={FaceScannerScreen} />
      <Tab.Screen name="Skincare" component={SkincareScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="MyPage" component={MyPageScreen} />
    </Tab.Navigator>
  );
}
