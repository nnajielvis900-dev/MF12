import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../lib/theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ visible, title, message, confirmLabel, danger, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={[styles.iconWrap, { backgroundColor: danger ? colors.roseSoft : colors.accentSoft }]}>
            <Ionicons name={danger ? 'trash-outline' : 'help-circle-outline'} size={24} color={danger ? colors.rose : colors.accent} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onCancel}>
              <Text style={[styles.btnText, { color: colors.textSub }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, danger ? styles.confirmDanger : styles.confirmPrimary]}
              onPress={onConfirm}
            >
              <Text style={[styles.btnText, { color: danger ? colors.rose : colors.accentDark, fontWeight: '800' }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  message: {
    color: colors.textSub,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancel: {
    backgroundColor: colors.surfaceAlt,
  },
  confirmPrimary: {
    backgroundColor: colors.accent,
  },
  confirmDanger: {
    backgroundColor: colors.roseSoft,
  },
  btnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
});
