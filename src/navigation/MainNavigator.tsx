import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { Colors, Typography } from '../constants/theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { AIScanNavigator } from './AIScanNavigator';
import { LookScreen } from '../screens/look/LookScreen';
import { CommunityStackNavigator } from './CommunityStackNavigator';
import { MyPageScreen } from '../screens/mypage/MyPageScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = keyof typeof Ionicons.glyphMap;

const tabIcons: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Home:      { active: 'home',          inactive: 'home-outline' },
  Skin:      { active: 'body',          inactive: 'body-outline' },
  Look:      { active: 'color-palette', inactive: 'color-palette-outline' },
  Community: { active: 'people',        inactive: 'people-outline' },
  MyPage:    { active: 'person',        inactive: 'person-outline' },
};

const labels: Record<string, string> = {
  Home:      '홈',
  Skin:      'SKIN',
  Look:      'LOOK',
  Community: '커뮤니티',
  MyPage:    '마이페이지',
};

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const icons = tabIcons[route.name];
          const name = icons ? (focused ? icons.active : icons.inactive) : 'ellipse-outline';
          return <Ionicons name={name} size={24} color={color} />;
        },
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
      <Tab.Screen name="Skin" component={AIScanNavigator} />
      <Tab.Screen name="Look" component={LookScreen} />
      <Tab.Screen name="Community" component={CommunityStackNavigator} />
      <Tab.Screen name="MyPage" component={MyPageScreen} />
    </Tab.Navigator>
  );
}
