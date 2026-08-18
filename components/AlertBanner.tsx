import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BudgetStatus } from '../lib/types';
import { categoryMeta } from '../lib/categories';
import { fmtCents } from '../lib/format';
import { colors, radius } from '../lib/theme';

export function AlertBanner({ alerts }: { alerts: BudgetStatus[] }) {
  if (alerts.length === 0) return null;
  const worst = alerts[0];
  const meta = categoryMeta(worst.category);
  const isOver = worst.level === 'over';
  const pct = Math.round(worst.pct * 100);

  const message = isOver
    ? `${meta.label} is over budget by ${fmtCents(Math.abs(worst.remainingCents))}.`
    : `${meta.label} has reached ${pct}% of its monthly budget.`;
  const extra = alerts.length > 1 ? ` +${alerts.length - 1} more alert${alerts.length > 2 ? 's' : ''}` : '';

  return (
    <View style={[styles.banner, { backgroundColor: isOver ? colors.roseSoft : colors.amberSoft, borderColor: isOver ? 'rgba(251,113,133,0.35)' : 'rgba(251,191,36,0.32)' }]}>
      <View style={[styles.iconWrap, { backgroundColor: isOver ? 'rgba(251,113,133,0.18)' : 'rgba(251,191,36,0.16)' }]}>
        <Ionicons name={isOver ? 'alert-circle' : 'warning'} size={18} color={isOver ? colors.rose : colors.amber} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{isOver ? 'Budget exceeded' : 'Budget alert'}</Text>
        <Text style={styles.message}>
          {message}
          {extra}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    color: colors.textSub,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
