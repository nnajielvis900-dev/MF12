import React, { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../lib/types';
import { currentMonthKey, dayLabel, fmtCents, monthLabel, shiftMonthKey } from '../lib/format';
import { totalsForMonth, transactionsForMonth } from '../lib/finance';
import { colors, radius } from '../lib/theme';
import { Card, EmptyState } from '../components/ui';
import { TransactionRow } from '../components/TransactionRow';
import { ConfirmModal } from '../components/ConfirmModal';

export function TransactionsScreen() {
  const { transactions, deleteTransaction, refreshing, refresh } = useFinance();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const isCurrentMonth = monthKey >= currentMonthKey();

  const { sections, totals, count } = useMemo(() => {
    const monthTxs = transactionsForMonth(transactions, monthKey);
    const byDate = new Map<string, Transaction[]>();
    for (const tx of monthTxs) {
      const list = byDate.get(tx.date) ?? [];
      list.push(tx);
      byDate.set(tx.date, list);
    }
    const secs = Array.from(byDate.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, data]) => ({ title: dayLabel(date), data }));
    return { sections: secs, totals: totalsForMonth(transactions, monthKey), count: monthTxs.length };
  }, [transactions, monthKey]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    await deleteTransaction(id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <View style={styles.monthNav}>
          <Pressable hitSlop={8} onPress={() => setMonthKey((k) => shiftMonthKey(k, -1))} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={17} color={colors.textSub} />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel(monthKey)}</Text>
          <Pressable
            hitSlop={8}
            onPress={() => setMonthKey((k) => shiftMonthKey(k, 1))}
            disabled={isCurrentMonth}
            style={[styles.navBtn, isCurrentMonth && { opacity: 0.3 }]}
          >
            <Ionicons name="chevron-forward" size={17} color={colors.textSub} />
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Ionicons name="arrow-down" size={14} color={colors.accent} />
          <Text style={styles.summaryLabel}>In</Text>
          <Text style={[styles.summaryValue, { color: colors.accent }]}>{fmtCents(totals.incomeCents)}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Ionicons name="arrow-up" size={14} color={colors.rose} />
          <Text style={styles.summaryLabel}>Out</Text>
          <Text style={[styles.summaryValue, { color: colors.rose }]}>{fmtCents(totals.expenseCents)}</Text>
        </View>
        <View style={styles.countChip}>
          <Text style={styles.countText}>
            {count} {count === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 40 }}
        refreshControl={undefined}
        onRefresh={refresh}
        refreshing={refreshing}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item, section, index }) => (
          <Card style={styles.rowCard}>
            <TransactionRow tx={item} onDelete={setPendingDelete} />
            {index < section.data.length - 1 ? <View style={styles.rowDivider} /> : null}
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Nothing logged this month"
            subtitle="Tap the + button to record your first income or expense for this period."
          />
        }
      />

      <ConfirmModal
        visible={pendingDelete !== null}
        title="Delete transaction?"
        message={
          pendingDelete
            ? `"${pendingDelete.note || pendingDelete.category}" (${fmtCents(pendingDelete.amountCents)}) will be permanently removed.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 104,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 14,
    alignItems: 'center',
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryLabel: {
    color: colors.textSub,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  countChip: {
    marginLeft: 'auto',
  },
  countText: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    color: colors.textSub,
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  rowCard: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
