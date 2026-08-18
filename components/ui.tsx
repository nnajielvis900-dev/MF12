import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../lib/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({ label, onPress, variant = 'primary', loading, disabled, icon, style }: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.buttonPrimary,
        variant === 'outline' && styles.buttonOutline,
        isDanger && styles.buttonDanger,
        (pressed || disabled || loading) && { opacity: pressed ? 0.82 : 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.accentDark : isDanger ? colors.rose : colors.text} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={17}
              style={{ marginRight: 8 }}
              color={isPrimary ? colors.accentDark : isDanger ? colors.rose : colors.text}
            />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              isPrimary && { color: colors.accentDark },
              isDanger && { color: colors.rose },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

interface AppTextInputProps extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  isPassword?: boolean;
}

export function AppTextInput({ label, icon, error, isPassword, style, ...rest }: AppTextInputProps) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrap, error ? { borderColor: colors.rose } : null]}>
        {icon ? <Ionicons name={icon} size={17} color={colors.textFaint} style={{ marginRight: 10 }} /> : null}
        <TextInput
          {...rest}
          style={[styles.input, { flex: 1 }]}
          placeholderTextColor={colors.textFaint}
          secureTextEntry={isPassword ? hidden : rest.secureTextEntry}
        />
        {isPassword ? (
          <Pressable hitSlop={8} onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.inputError}>{error}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable hitSlop={8} onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.textSub} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={{ marginTop: 16, alignSelf: 'center' }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    minHeight: 50,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  buttonDanger: {
    backgroundColor: colors.roseSoft,
  },
  buttonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  inputLabel: {
    color: colors.textSub,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as object,
  inputError: {
    color: colors.rose,
    fontSize: 12.5,
    marginTop: 6,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionAction: {
    color: colors.accent,
    fontSize: 13.5,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: colors.textSub,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },
});
