import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';
import { MainStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ProfileEdit'>;

type Gender = '여성' | '남성' | '선택 안 함';

const ACCENT = '#FF6B9D';

export function ProfileEditScreen() {
  const navigation = useNavigation<Nav>();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState<Gender>('선택 안 함');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        const { data } = await supabase
          .from('user_profiles')
          .select('display_name, birth_date, gender, avatar_url')
          .eq('id', user.id)
          .single();
        if (data) {
          setDisplayName(data.display_name ?? '');
          if (data.birth_date) setBirthDate(new Date(data.birth_date));
          if (data.gender) setGender(data.gender as Gender);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string, uid: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const path = `${uid}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return data.publicUrl;
    } catch (e: any) {
      console.warn('[avatar] upload failed:', e?.message ?? e);
      return null;
    }
  };

  const handleSave = async () => {
    const name = displayName.trim();
    if (name.length < 2 || name.length > 10) {
      Alert.alert('닉네임 확인', '닉네임은 2~10자 사이로 입력해주세요.');
      return;
    }
    if (!userId) {
      Alert.alert('로그인 필요', '다시 로그인한 후 시도해주세요.');
      return;
    }

    setSaving(true);
    try {
      let nextAvatarUrl = avatarUrl;
      if (localAvatarUri) {
        const uploaded = await uploadAvatar(localAvatarUri, userId);
        if (uploaded) nextAvatarUrl = uploaded;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: name,
          birth_date: birthDate ? birthDate.toISOString().slice(0, 10) : null,
          gender,
          avatar_url: nextAvatarUrl,
        })
        .eq('id', userId);
      if (error) throw error;

      // Propagate the new display name so screens using the store or
      // AsyncStorage reflect it without requiring a re-login / re-fetch.
      useAuthStore.getState().updateProfile({ displayName: name });
      try {
        await AsyncStorage.setItem('meve_display_name', name);
      } catch {}

      Alert.alert('저장 완료', '저장되었어요 ✨', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('저장 실패', e?.message ?? '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const formatBirthDate = (d: Date | null) => {
    if (!d) return '생년월일을 선택해주세요';
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const avatarSource = localAvatarUri ?? avatarUrl;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 80 }} color={ACCENT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.8}>
          {avatarSource ? (
            <Image source={{ uri: avatarSource }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color="#fff" />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Display name */}
        <Text style={styles.label}>닉네임</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="2~10자"
          placeholderTextColor="#B8AFB5"
          maxLength={10}
        />

        {/* Birth date */}
        <Text style={styles.label}>생년월일</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.75}
        >
          <Text style={[styles.inputText, !birthDate && styles.inputPlaceholder]}>
            {formatBirthDate(birthDate)}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={birthDate ?? new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(_event, date) => {
              if (Platform.OS !== 'ios') setShowDatePicker(false);
              if (date) setBirthDate(date);
            }}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.doneBtnText}>완료</Text>
          </TouchableOpacity>
        )}

        {/* Gender */}
        <Text style={styles.label}>성별</Text>
        <View style={styles.genderRow}>
          {(['여성', '남성', '선택 안 함'] as Gender[]).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => setGender(g)}
              activeOpacity={0.75}
            >
              <Text
                style={[styles.genderText, gender === g && styles.genderTextActive]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>저장하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FDF6F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#2D2D2D' },
  content: { padding: 20, paddingBottom: 60 },

  avatarWrap: { alignSelf: 'center', marginBottom: 28 },
  avatarImg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee' },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2A7C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDF6F9',
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: '#2D2D2D',
    borderWidth: 1,
    borderColor: '#F0E6EC',
    justifyContent: 'center',
    minHeight: 48,
  },
  inputText: { fontSize: 14, color: '#2D2D2D' },
  inputPlaceholder: { color: '#B8AFB5' },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
  },
  doneBtnText: { color: ACCENT, fontWeight: '600', fontSize: 14 },

  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0E6EC',
  },
  genderBtnActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  genderText: { fontSize: 14, color: '#2D2D2D' },
  genderTextActive: { color: '#fff', fontWeight: '700' },

  saveBtn: {
    marginTop: 32,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
