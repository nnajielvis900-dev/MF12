import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { AppButton, AppTextInput } from '../components/ui';
import { colors, radius, cardShadow } from '../lib/theme';

type Mode = 'login' | 'register';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: colors.textFaint };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const capped = Math.min(score, 4);
  if (capped <= 1) return { score: capped, label: 'Weak', color: colors.rose };
  if (capped === 2) return { score: capped, label: 'Fair', color: colors.amber };
  if (capped === 3) return { score: capped, label: 'Good', color: colors.blue };
  return { score: capped, label: 'Strong', color: colors.accent };
}

export function AuthScreen() {
  const { signIn, signUp, openDemo } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'submit' | 'demo' | null>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);

  const submit = async () => {
    setError(null);
    setBusy('submit');
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (name.trim().length < 2) throw new ApiError('Please enter your full name.');
        if (strength.score < 2) throw new ApiError('Choose a stronger password (8+ chars, mix cases & numbers).');
        await signUp(name, email, password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const demo = async () => {
    setError(null);
    setBusy('demo');
    try {
      await openDemo();
    } catch {
      setError('Could not load the demo account.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons name="wallet" size={26} color={colors.accentDark} />
            </View>
            <Text style={styles.appName}>Ledgerly</Text>
            <Text style={styles.tagline}>Your money, clearly in focus.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              {(['login', 'register'] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMode(m);
                    setError(null);
                  }}
                  style={[styles.tab, mode === m && styles.tabActive]}
                >
                  <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: 18 }}>
              {mode === 'register' ? (
                <AppTextInput
                  label="Full name"
                  icon="person-outline"
                  value={name}
                  onChangeText={setName}
                  placeholder="Alex Rivera"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              ) : null}
              <AppTextInput
                label="Email"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <AppTextInput
                label="Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                isPassword
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              {mode === 'register' && password.length > 0 ? (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          { backgroundColor: i <= strength.score ? strength.color : colors.surfaceAlt },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              ) : null}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.rose} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <AppButton
              label={mode === 'login' ? 'Sign in securely' : 'Create my account'}
              icon={mode === 'login' ? 'lock-closed' : 'shield-checkmark'}
              onPress={submit}
              loading={busy === 'submit'}
              style={{ marginTop: 6 }}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <AppButton
              label="Explore with demo data"
              icon="sparkles-outline"
              variant="outline"
              onPress={demo}
              loading={busy === 'demo'}
            />
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.textFaint} />
            <Text style={styles.securityText}>
              Passwords are salted & hashed — never stored in plain text. Sessions live in device-secure storage.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 40,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...cardShadow,
  },
  appName: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  tagline: {
    color: colors.textSub,
    fontSize: 13.5,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    ...cardShadow,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surfaceAlt,
  },
  tabText: {
    color: colors.textSub,
    fontSize: 13.5,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.text,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -6,
    marginBottom: 12,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 5,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
    width: 52,
    textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.roseSoft,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: colors.rose,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textFaint,
    fontSize: 12.5,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
    paddingHorizontal: 12,
  },
  securityText: {
    color: colors.textFaint,
    fontSize: 11.5,
    lineHeight: 16,
    flexShrink: 1,
  },
});
