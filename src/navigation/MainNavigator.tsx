import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { Typography } from '../constants/theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { AIScanNavigator } from './AIScanNavigator';
import { LookScreen } from '../screens/look/LookScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { MyPageScreen } from '../screens/mypage/MyPageScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = keyof typeof Ionicons.glyphMap;

const tabIcons: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Home:      { active: 'home',          inactive: 'home-outline' },
  Skin:      { active: 'body',          inactive: 'body-outline' },
  Look:      { active: 'color-palette', inactive: 'color-palette-outline' },
  Community: { active: 'sparkles',      inactive: 'sparkles-outline' },
  MyPage:    { active: 'person',        inactive: 'person-outline' },
};

const labels: Record<string, string> = {
  Home:      '홈',
  Skin:      'SKIN',
  Look:      'LOOK',
  Community: 'eve',
  MyPage:    '마이페이지',
};

const ACTIVE_TINT: Record<string, string> = {
  Home: '#FF6B9D',
  Skin: '#5BA3D9',
  Look: '#FF6B9D',
  Community: '#FF6B9D',
  MyPage: '#8A8A9A',
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
        tabBarActiveTintColor: ACTIVE_TINT[route.name] ?? '#8A8A9A',
        tabBarInactiveTintColor: '#C0C0CC',
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopColor: 'rgba(220,220,230,0.5)',
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
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
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="MyPage" component={MyPageScreen} />
    </Tab.Navigator>
  );
}
