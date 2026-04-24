import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { PrimaryButton } from '../../components/ui';
import { CommunityStackParamList } from '../../types';
import { PremiumUpsellModal } from '../../components/PremiumUpsellModal';
import { isPremiumNow } from '../../services/premium';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'CreatePost'>;

const BUCKET = 'community-images';

export function CreatePostScreen() {
  const navigation = useNavigation<Nav>();
  const [content, setContent] = useState('');
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [mime, setMime] = useState<string>('image/jpeg');
  const [submitting, setSubmitting] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근을 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setLocalUri(asset.uri);
      setMime(asset.mimeType ?? 'image/jpeg');
    }
  };

  const removeImage = () => {
    setLocalUri(null);
  };

  const uploadAndCreate = async () => {
    if (!isPremiumNow()) {
      setUpsellOpen(true);
      return;
    }

    const text = content.trim();
    if (!text && !localUri) {
      Alert.alert('내용 필요', '글을 입력하거나 사진을 선택해 주세요.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('로그인', '로그인 후 이용할 수 있어요.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (localUri) {
        const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const response = await fetch(localUri);
        const arrayBuffer = await response.arrayBuffer();

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, arrayBuffer, {
            contentType: mime,
            upsert: false,
          });

        if (upErr) throw new Error(upErr.message);

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

      const { error: insErr } = await supabase.from('posts').insert({
        user_id: user.id,
        content: text || '',
        image_url: imageUrl,
      });

      if (insErr) throw new Error(insErr.message);

      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '다시 시도해 주세요.';
      Alert.alert('업로드 실패', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <PremiumUpsellModal
        visible={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        onUpgrade={() => {
          setUpsellOpen(false);
          (navigation as any).getParent?.()?.navigate?.('Paywall', { source: 'community_post' });
        }}
        subtitle="커뮤니티 글/댓글 작성은 프리미엄 기능이에요."
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={styles.input}
            placeholder="오늘의 피부 루틴, 팁, 질문을 남겨보세요"
            placeholderTextColor={Colors.textDisabled}
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={2000}
            textAlignVertical="top"
          />

          <Text style={styles.label}>사진 (선택)</Text>
          {localUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: localUri }} style={styles.preview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImg} onPress={removeImage}>
                <Ionicons name="close-circle" size={28} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickBox} onPress={pickImage} activeOpacity={0.8}>
              <Ionicons name="image-outline" size={36} color={Colors.textSecondary} />
              <Text style={styles.pickText}>갤러리에서 선택</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="게시하기"
            onPress={uploadAndCreate}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  input: {
    minHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  pickBox: {
    height: 160,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  pickText: { ...Typography.bodySecondary },
  previewWrap: { position: 'relative', borderRadius: Radius.md, overflow: 'hidden' },
  preview: { width: '100%', aspectRatio: 4 / 3, backgroundColor: Colors.borderMuted },
  removeImg: { position: 'absolute', top: 8, right: 8 },
  footer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
});
