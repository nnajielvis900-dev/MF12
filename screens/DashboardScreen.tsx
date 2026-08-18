import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import {
  allTimeBalance,
  breakdownForMonth,
  budgetAlerts,
  budgetStatuses,
  totalsForMonth,
  trend,
} from '../lib/finance';
import { currentMonthKey, fmtCents, friendlyDate, greeting, monthLabel, todayISO } from '../lib/format';
import { categoryMeta } from '../lib/categories';
import { colors, radius, cardShadow } from '../lib/theme';
import { Card, SectionTitle } from '../components/ui';
import { DonutChart } from '../components/DonutChart';
import { TrendChart } from '../components/TrendChart';
import { AlertBanner } from '../components/AlertBanner';
import { TransactionRow } from '../components/TransactionRow';

export function DashboardScreen() {
  const { user } = useAuth();
  const { transactions, budgets, refreshing, refresh } = useFinance();
  const navigation = useNavigation();

  const monthKey = currentMonthKey();

  const data = useMemo(() => {
    const balance = allTimeBalance(transactions);
    const month = totalsForMonth(transactions, monthKey);
    const breakdown = breakdownForMonth(transactions, monthKey);
    const statuses = budgetStatuses(budgets, transactions, monthKey);
    const alerts = budgetAlerts(statuses);
    const trendData = trend(transactions, 6);
    const recent = transactions.slice(0, 5);
    return { balance, month, breakdown, alerts, trendData, recent };
  }, [transactions, budgets, monthKey]);

  const firstName = (user?.name ?? 'there').split(' ')[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greeting()}, {firstName}
            </Text>
            <Text style={styles.date}>{friendlyDate(todayISO())}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? '?').slice(0, 1).toUpperCase()}</Text>
          </View>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceDeco} />
          <Text style={styles.balanceLabel}>Total balance</Text>
          <Text style={styles.balanceValue}>{fmtCents(data.balance)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balancePill}>
              <View style={[styles.pillIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="arrow-down" size={13} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.pillLabel}>Income · {monthLabel(monthKey).split(' ')[0]}</Text>
                <Text style={[styles.pillValue, { color: colors.accent }]}>{fmtCents(data.month.incomeCents)}</Text>
              </View>
            </View>
            <View style={styles.balancePill}>
              <View style={[styles.pillIcon, { backgroundColor: colors.roseSoft }]}>
                <Ionicons name="arrow-up" size={13} color={colors.rose} />
              </View>
              <View>
                <Text style={styles.pillLabel}>Expenses · {monthLabel(monthKey).split(' ')[0]}</Text>
                <Text style={[styles.pillValue, { color: colors.rose }]}>{fmtCents(data.month.expenseCents)}</Text>
              </View>
            </View>
          </View>
        </View>

        {data.alerts.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <AlertBanner alerts={data.alerts} />
          </View>
        ) : null}

        {/* Spending breakdown */}
        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Spending breakdown" />
          <Card>
            {data.breakdown.length === 0 ? (
              <View style={styles.miniEmpty}>
                <Ionicons name="pie-chart-outline" size={22} color={colors.textFaint} />
                <Text style={styles.miniEmptyText}>No expenses logged this month yet.</Text>
              </View>
            ) : (
              <View style={styles.donutRow}>
                <DonutChart slices={data.breakdown} totalCents={data.month.expenseCents} />
                <View style={styles.legend}>
                  {data.breakdown.slice(0, 5).map((s) => {
                    const meta = categoryMeta(s.category);
                    return (
                      <View key={s.category} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: meta.color }]} />
                        <Text style={styles.legendLabel} numberOfLines={1}>
                          {meta.label}
                        </Text>
                        <Text style={styles.legendPct}>{Math.round(s.pct * 100)}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Cash flow */}
        <View style={{ marginTop: 24 }}>
          <SectionTitle title="Cash flow · last 6 months" />
          <Card>
            <TrendChart data={data.trendData} />
          </Card>
        </View>

        {/* Recent activity */}
        <View style={{ marginTop: 24 }}>
          <SectionTitle
            title="Recent activity"
            action="See all"
            onAction={() => navigation.navigate('Activity' as never)}
          />
          <Card style={{ paddingVertical: 6 }}>
            {data.recent.length === 0 ? (
              <View style={styles.miniEmpty}>
                <Ionicons name="receipt-outline" size={22} color={colors.textFaint} />
                <Text style={styles.miniEmptyText}>Your transactions will appear here.</Text>
              </View>
            ) : (
              data.recent.map((tx, i) => (
                <View key={tx.id}>
                  {i > 0 ? <View style={styles.rowDivider} /> : null}
                  <TransactionRow tx={tx} showDate />
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  greeting: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
  },
  date: {
    color: colors.textSub,
    fontSize: 13,
    marginTop: 3,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '800',
  },
  balanceCard: {
    backgroundColor: '#0E2A22',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.28)',
    padding: 22,
    overflow: 'hidden',
    ...cardShadow,
  },
  balanceDeco: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(52,211,153,0.07)',
    top: -110,
    right: -60,
  },
  balanceLabel: {
    color: 'rgba(209, 250, 229, 0.65)',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#ECFDF5',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  balancePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    padding: 10,
  },
  pillIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    color: colors.textSub,
    fontSize: 10.5,
    fontWeight: '600',
  },
  pillValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  legend: {
    flex: 1,
    gap: 9,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    color: colors.textSub,
    fontSize: 12.5,
    fontWeight: '600',
  },
  legendPct: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: '800',
  },
  miniEmpty: {
    alignItems: 'center',
    paddingVertical: 26,
    gap: 8,
  },
  miniEmptyText: {
    color: colors.textFaint,
    fontSize: 13,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
