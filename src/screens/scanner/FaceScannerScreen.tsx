import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { MainStackParamList, ScanAnalysisResult } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type ScanStep = 'idle' | 'analyzing';

const OPENAI_PROMPT = `You are a skincare analysis assistant.
Analyze the skin condition visible in this photo for cosmetic skincare purposes only.
This is not medical advice. Respond with ONLY a valid JSON object, no other text:
{
  "overallScore": <number 0-100 representing overall skin clarity>,
  "skinCondition": "<brief Korean description of skin type and condition>",
  "acneType": "<type of blemishes if any, in Korean, or 없음>",
  "severity": <1-5 where 1=very clear, 5=many blemishes>,
  "zones": {
    "forehead": <1-5>,
    "leftCheek": <1-5>,
    "rightCheek": <1-5>,
    "nose": <1-5>,
    "chin": <1-5>
  },
  "keyFindings": ["<finding in Korean>", "<finding>", "<finding>"],
  "recommendations": ["<skincare tip in Korean>", "<tip>", "<tip>"],
  "redness": {
    "detected": <true or false>,
    "zones": ["<affected zone name in Korean>"],
    "severity": <1-5>,
    "description": "<brief Korean description of redness or irritation>"
  }
}`;

const runAnalysis = async (base64String: string): Promise<ScanAnalysisResult> => {
  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64String}` },
          },
          {
            type: 'text',
            text: OPENAI_PROMPT,
          },
        ],
      }],
    }),
  });

  const openaiData = await openaiResponse.json();
  console.log('[OpenAI] response:', JSON.stringify(openaiData));

  if (!openaiResponse.ok) {
    throw new Error(openaiData.error?.message ?? `OpenAI ${openaiResponse.status}`);
  }

  const content = openaiData.choices[0].message.content.trim();
  console.log('[OpenAI] raw content:', content);
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  const result: ScanAnalysisResult = JSON.parse(jsonMatch[0]);

  // Save to skin_scans (best-effort — don't block navigation on failure)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('skin_scans').insert({
        user_id: user.id,
        scan_result: result,
      });
    }
  } catch (dbErr) {
    console.warn('[skin_scans] insert failed (non-fatal):', dbErr);
  }

  return result;
};

export function FaceScannerScreen() {
  const navigation = useNavigation<Nav>();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<ScanStep>('idle');
  const cameraRef = useRef<CameraView>(null);

  const ovalWidth = width * 0.62;
  const ovalHeight = ovalWidth * 1.35;

  const handleCapture = async () => {
    if (step !== 'idle' || !cameraRef.current) return;
    setStep('analyzing');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
      if (!photo.base64) throw new Error('base64 없음');
      const result = await runAnalysis(photo.base64);
      navigation.navigate('ScanResult', { result });
    } catch (e: any) {
      console.error('[handleCapture] error:', e);
      setStep('idle');
      Alert.alert('분석 실패', __DEV__ ? (e?.message ?? String(e)) : '다시 시도해 주세요.');
    }
  };

  const handleMockCapture = () => {
    const mockResult: ScanAnalysisResult = {
      overallScore: 72,
      skinCondition: '복합성 피부, T존 피지 과다',
      acneType: '좁쌀 여드름',
      severity: 3,
      zones: { forehead: 3, leftCheek: 2, rightCheek: 2, nose: 4, chin: 2 },
      keyFindings: ['T존 피지 분비 과다', '볼 부위 수분 부족', '코 주변 모공 확대'],
      recommendations: ['나이아신아마이드 토너 추천', '오일프리 수분크림 사용', '주 1회 클레이 마스크팩'],
      redness: {
        detected: true,
        zones: ['이마', '코'],
        severity: 3,
        description: '이마와 코 주변에 홍조 감지됨. 자극성 성분 주의 필요',
      },
    };
    navigation.navigate('ScanResult', { result: mockResult });
  };

  // ── 권한 미승인 ───────────────────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={styles.permissionTitle}>카메라 접근이 필요해요</Text>
        <Text style={styles.permissionDesc}>
          AI 피부 진단을 위해 카메라 권한을 허용해 주세요.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>권한 허용하기</Text>
        </TouchableOpacity>
        {__DEV__ && (
          <TouchableOpacity style={styles.mockBtn} onPress={handleMockCapture}>
            <Text style={styles.mockBtnText}>테스트 결과 보기 (DEV)</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // ── 카메라 뷰 ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
      />

      {/* 상단 헤더 */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>AI 피부 스캐너</Text>
        <Text style={styles.headerSub}>
          {step === 'analyzing'
            ? 'AI가 피부를 분석하고 있어요...'
            : '얼굴을 가이드 안에 맞춰 주세요'}
        </Text>
      </SafeAreaView>

      {/* 오발 페이스 가이드 + 딤 오버레이 */}
      <View style={styles.overlayWrapper}>
        {/* 상단 딤 */}
        <View style={[styles.dimBlock, { height: (height - ovalHeight) / 2 - 40 }]} />

        {/* 오발 행 */}
        <View style={{ flexDirection: 'row', height: ovalHeight }}>
          <View style={styles.dimBlock} />
          <View
            style={[
              styles.ovalCutout,
              { width: ovalWidth, height: ovalHeight, borderRadius: ovalWidth / 2 },
            ]}
          />
          <View style={styles.dimBlock} />
        </View>

        {/* 하단 딤 */}
        <View style={[styles.dimBlock, { flex: 1 }]} />
      </View>

      {/* 오발 테두리 */}
      <View
        pointerEvents="none"
        style={[
          styles.ovalBorder,
          {
            width: ovalWidth,
            height: ovalHeight,
            borderRadius: ovalWidth / 2,
          },
        ]}
      />

      {/* 분석 중 오버레이 */}
      {step === 'analyzing' && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator color={Colors.surface} size="large" />
          <Text style={styles.analyzingText}>AI가 피부를 분석하고 있어요...</Text>
        </View>
      )}

      {/* 하단 캡처 영역 */}
      {step === 'idle' && (
        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={handleCapture}
            activeOpacity={0.85}
          >
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          {__DEV__ && (
            <TouchableOpacity style={styles.mockBtn} onPress={handleMockCapture}>
              <Text style={styles.mockBtnText}>테스트 (DEV)</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#000' },

  // 권한 요청 화면
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  permissionEmoji: { fontSize: 48 },
  permissionTitle: { ...Typography.h2, textAlign: 'center' },
  permissionDesc: { ...Typography.bodySecondary, textAlign: 'center', lineHeight: 22 },
  permissionBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
  },
  permissionBtnText: { ...Typography.cta, color: Colors.surface },

  // 카메라 화면
  cameraContainer: { flex: 1, backgroundColor: '#000' },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.surface,
    letterSpacing: 0.3,
  },
  headerSub: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },

  // 딤 오버레이
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  dimBlock: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  ovalCutout: {
    backgroundColor: 'transparent',
  },

  // 오발 테두리
  ovalBorder: {
    position: 'absolute',
    alignSelf: 'center',
    top: '20%',
    borderWidth: 2.5,
    borderColor: Colors.accent,
    zIndex: 2,
  },

  // 분석 중 오버레이
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  analyzingText: {
    ...Typography.body,
    color: Colors.surface,
  },

  // 하단 캡처
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Spacing.xl,
    zIndex: 10,
    gap: Spacing.md,
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
  },
  mockBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.sm,
  },
  mockBtnText: {
    ...Typography.caption,
    color: Colors.surface,
  },
});
