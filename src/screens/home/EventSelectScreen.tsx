import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EventStackParamList } from '../../types';
import { EVENT_CONFIG, EventKey } from '../../constants/events';

type Nav = NativeStackNavigationProp<EventStackParamList, 'EventSelect'>;

const ICON_MAP: Record<EventKey, keyof typeof Ionicons.glyphMap> = {
  wedding: 'diamond-outline',
  date: 'heart-outline',
  graduation: 'school-outline',
  travel: 'airplane-outline',
};

const ROWS: EventKey[][] = [
  ['wedding', 'date'],
  ['graduation', 'travel'],
];

export function EventSelectScreen() {
  const navigation = useNavigation<Nav>();

  const selectEvent = (key: EventKey) => {
    navigation.navigate('EventSetup', { eventType: key });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDF6F9" />

      {/* Close */}
      <View style={styles.closeRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={24} color="#2D2D2D" />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <Text style={styles.title}>어떤 특별한 날인가요?</Text>
      <Text style={styles.subtitle}>준비하는 날에 맞게 케어 방향을 설계해드려요</Text>

      {/* 2×2 grid */}
      <View style={styles.grid}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key) => {
              const config = EVENT_CONFIG[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.card, { backgroundColor: config.themeColor }]}
                  onPress={() => selectEvent(key)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={ICON_MAP[key]} size={44} color={config.accentColor} />
                  <Text style={styles.cardLabel}>{config.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6F9',
    padding: 24,
  },
  closeRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
  },
  grid: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginTop: 12,
  },
});
