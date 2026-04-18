import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SKIP_GUIDE_KEY = 'meve_skip_scan_guide';

const LIGHT_BLUE = '#B8D8F0';
const ACCENT_PINK = '#FF6B9D';

const DEFAULT_TITLE = '정확한 분석을 위해 확인해주세요 ✨';
const DEFAULT_CONFIRM_LABEL = '확인하고 촬영하기';
const DEFAULT_CHECKS: { emoji: string; text: string }[] = [
  { emoji: '💆', text: '메이크업을 지운 맨얼굴 상태인가요?' },
  { emoji: '💡', text: '밝고 자연광이 잘 드는 곳에 있나요?' },
  { emoji: '🪞', text: '정면을 바라보고 있나요?' },
  { emoji: '💇', text: '앞머리가 이마를 가리지 않나요?' },
];

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  confirmLabel?: string;
  checks?: { emoji: string; text: string }[];
  skipKey?: string;
}

export function SkinScanGuideModal({
  visible,
  onCancel,
  onConfirm,
  title = DEFAULT_TITLE,
  confirmLabel = DEFAULT_CONFIRM_LABEL,
  checks = DEFAULT_CHECKS,
  skipKey = SKIP_GUIDE_KEY,
}: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = async () => {
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem(skipKey, 'true');
      } catch {}
    }
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.list}>
            {checks.map((item) => (
              <View key={item.text} style={styles.row}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={styles.rowText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setDontShowAgain((v) => !v)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                dontShowAgain && styles.checkboxChecked,
              ]}
            >
              {dontShowAgain && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>다시 보지 않기</Text>
          </TouchableOpacity>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45,45,45,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    shadowColor: ACCENT_PINK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 24,
  },
  list: {
    backgroundColor: '#FFF5F9',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: '#2D2D2D',
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingVertical: 6,
    marginBottom: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D8C8D0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: ACCENT_PINK,
    borderColor: ACCENT_PINK,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#9A8F97',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: LIGHT_BLUE + '33',
    borderWidth: 1,
    borderColor: LIGHT_BLUE,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6DA5C4',
  },
  confirmBtn: {
    backgroundColor: ACCENT_PINK,
    shadowColor: ACCENT_PINK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
