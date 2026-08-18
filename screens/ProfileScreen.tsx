import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { wipeDB } from '../lib/db';
import { currentMonthKey, memberSince, monthLabel, fmtCents } from '../lib/format';
import { totalsForMonth } from '../lib/finance';
import { colors, radius, cardShadow } from '../lib/theme';
import { Card } from '../components/ui';
import { ConfirmModal } from '../components/ConfirmModal';

export function ProfileScreen() {
  const { user, signOut, clearUser } = useAuth();
  const { transactions } = useFinance();
  const [confirmWipe, setConfirmWipe] = useState(false);

  const monthKey = currentMonthKey();
  const stats = useMemo(() => {
    const t = totalsForMonth(transactions, monthKey);
    return { ...t, count: transactions.length };
  }, [transactions, monthKey]);

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const doWipe = async () => {
    setConfirmWipe(false);
    await wipeDB();
    clearUser();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.member}>Member since {user ? memberSince(user.createdAt) : ''}</Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.count}</Text>
            <Text style={styles.statLabel}>All entries</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{fmtCents(stats.incomeCents)}</Text>
            <Text style={styles.statLabel}>{monthLabel(monthKey).split(' ')[0]} income</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.rose }]}>{fmtCents(stats.expenseCents)}</Text>
            <Text style={styles.statLabel}>{monthLabel(monthKey).split(' ')[0]} spent</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Security</Text>
        <Card>
          <SecurityRow icon="key-outline" text="Passwords are salted & hashed before storage — never kept in plain text." />
          <SecurityRow icon="shield-checkmark-outline" text="Session tokens are generated per login and stored in device-secure storage." />
          <SecurityRow icon="cash-outline" text="Amounts are stored as integer cents to avoid floating-point rounding errors." />
          <SecurityRow icon="lock-closed-outline" text="Every data request is authenticated and scoped to your account only." last />
        </Card>

        <Text style={styles.sectionTitle}>Account</Text>
        <Pressable style={styles.actionRow} onPress={signOut}>
          <View style={[styles.actionIcon, { backgroundColor: colors.blueSoft }]}>
            <Ionicons name="log-out-outline" size={17} color={colors.blue} />
          </View>
          <Text style={styles.actionText}>Sign out</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
        </Pressable>

        <Pressable style={[styles.actionRow, { borderColor: 'rgba(251,113,133,0.25)' }]} onPress={() => setConfirmWipe(true)}>
          <View style={[styles.actionIcon, { backgroundColor: colors.roseSoft }]}>
            <Ionicons name="trash-outline" size={17} color={colors.rose} />
          </View>
          <Text style={[styles.actionText, { color: colors.rose }]}>Erase all data</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
        </Pressable>

        <Text style={styles.version}>Ledgerly v1.0 · On-device secure storage</Text>
      </ScrollView>

      <ConfirmModal
        visible={confirmWipe}
        title="Erase everything?"
        message="This permanently deletes your account, all transactions and budgets from this device. This cannot be undone."
        confirmLabel="Erase"
        danger
        onConfirm={doWipe}
        onCancel={() => setConfirmWipe(false)}
      />
    </SafeAreaView>
  );
}

function SecurityRow({ icon, text, last }: { icon: keyof typeof Ionicons.glyphMap; text: string; last?: boolean }) {
  return (
    <View style={[styles.securityRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={16} color={colors.accent} style={{ marginTop: 1 }} />
      <Text style={styles.securityText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...cardShadow,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  email: {
    color: colors.textSub,
    fontSize: 13,
    marginTop: 2,
  },
  member: {
    color: colors.textFaint,
    fontSize: 11.5,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSub,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 26,
    marginBottom: 12,
  },
  securityRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  securityText: {
    flex: 1,
    color: colors.textSub,
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 10,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  version: {
    color: colors.textFaint,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 22,
  },
});
