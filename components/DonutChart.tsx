import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BreakdownSlice } from '../lib/types';
import { categoryMeta } from '../lib/categories';
import { fmtCents } from '../lib/format';
import { colors } from '../lib/theme';

interface Props {
  slices: BreakdownSlice[];
  totalCents: number;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({ slices, totalCents, size = 172, strokeWidth = 25 }: Props) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 2.5 : 0;

  let acc = 0;
  const segments = slices.map((s) => {
    const start = acc;
    acc += s.pct;
    return { ...s, start };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={strokeWidth} fill="none" />
        {segments.map((seg) => {
          const meta = categoryMeta(seg.category);
          const len = Math.max(seg.pct * circumference - gap, 0.6);
          return (
            <Circle
              key={seg.category}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={meta.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${len} ${circumference}`}
              strokeDashoffset={-seg.start * circumference - gap / 2}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerLabel}>Spent</Text>
        <Text style={styles.centerValue} numberOfLines={1} adjustsFontSizeToFit>
          {fmtCents(totalCents)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  centerLabel: {
    color: colors.textSub,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  centerValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
