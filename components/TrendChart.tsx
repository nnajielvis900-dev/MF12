import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { TrendPoint } from '../lib/types';
import { colors } from '../lib/theme';

const CHART_HEIGHT = 120;

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 750,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const max = Math.max(1, ...data.map((d) => Math.max(d.incomeCents, d.expenseCents)));

  return (
    <View>
      <View style={styles.legendRow}>
        <LegendDot color={colors.accent} label="Income" />
        <LegendDot color={colors.rose} label="Spending" />
      </View>
      <View style={[styles.chart, { height: CHART_HEIGHT }]}>
        {data.map((d) => {
          const incomeH = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.max((d.incomeCents / max) * (CHART_HEIGHT - 8), d.incomeCents > 0 ? 6 : 2)],
          });
          const expenseH = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.max((d.expenseCents / max) * (CHART_HEIGHT - 8), d.expenseCents > 0 ? 6 : 2)],
          });
          return (
            <View key={d.monthKey} style={styles.col}>
              <View style={styles.bars}>
                <Animated.View style={[styles.bar, { backgroundColor: colors.accent, height: incomeH }]} />
                <Animated.View style={[styles.bar, { backgroundColor: colors.rose, height: expenseH }]} />
              </View>
              <Text style={[styles.label, d.isCurrent && { color: colors.text, fontWeight: '800' }]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textSub,
    fontSize: 12,
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    flex: 1,
  },
  bar: {
    width: 11,
    borderRadius: 5,
  },
  label: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
});
