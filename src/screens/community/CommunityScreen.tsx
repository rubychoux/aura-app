import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function CommunityScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>커뮤니티</Text>
        <Text style={styles.subtitle}>친구와 함께 꾸밈을 맞춰보세요 ✨</Text>

        <TouchableOpacity
          style={[styles.card, styles.glamCard]}
          onPress={() => navigation.navigate('GlamSyncList')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBadge, { backgroundColor: '#FF6B9D' }]}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>글램 싱크 ✨</Text>
            <Text style={styles.cardDesc}>
              친구와 만나기 전 꾸밈 정도를 맞춰봐요
            </Text>
            <Text style={[styles.cardCta, { color: '#FF6B9D' }]}>시작하기 →</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.pollCard]}
          onPress={() => navigation.navigate('LookPollList')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBadge, { backgroundColor: '#5BA3D9' }]}>
            <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>룩 투표 💄</Text>
            <Text style={styles.cardDesc}>
              고민되는 룩, 친구와 커뮤니티에 물어봐요
            </Text>
            <Text style={[styles.cardCta, { color: '#5BA3D9' }]}>시작하기 →</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFBFC' },
  content: { padding: 20, paddingBottom: 60, gap: 14 },

  title: { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 13, color: '#8A8A9A', marginBottom: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(220,220,230,0.5)',
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  glamCard: { borderLeftWidth: 4, borderLeftColor: '#FF6B9D' },
  pollCard: { borderLeftWidth: 4, borderLeftColor: '#5BA3D9' },

  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  cardDesc: { fontSize: 12, color: '#8A8A9A', marginTop: 2, lineHeight: 17 },
  cardCta: { fontSize: 12, fontWeight: '700', marginTop: 6 },
});
