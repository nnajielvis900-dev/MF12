import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../lib/theme';
import { pad2, toISODate, todayISO } from '../lib/format';

interface Props {
  visible: boolean;
  selectedISO: string;
  onClose: () => void;
  onSelect: (iso: string) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function CalendarModal({ visible, selectedISO, onClose, onSelect }: Props) {
  const today = todayISO();
  const [tY, tM] = today.split('-').map(Number);
  const [viewYear, setViewYear] = useState(() => Number(selectedISO.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(selectedISO.slice(5, 7)));

  const atCurrentMonth = viewYear === tY && viewMonth === tM;

  const cells = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [viewYear, viewMonth]);

  const go = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable hitSlop={10} onPress={() => go(-1)} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.textSub} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[viewMonth - 1]} {viewYear}
            </Text>
            <Pressable hitSlop={10} onPress={() => go(1)} disabled={atCurrentMonth} style={[styles.navBtn, atCurrentMonth && { opacity: 0.3 }]}>
              <Ionicons name="chevron-forward" size={18} color={colors.textSub} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={`b${i}`} style={styles.cell} />;
              const iso = toISODate(viewYear, viewMonth, day);
              const isSelected = iso === selectedISO;
              const isToday = iso === today;
              const disabled = iso > today;
              return (
                <Pressable
                  key={iso}
                  disabled={disabled}
                  onPress={() => {
                    onSelect(iso);
                    onClose();
                  }}
                  style={[
                    styles.cell,
                    isSelected && styles.cellSelected,
                    isToday && !isSelected && styles.cellToday,
                    disabled && { opacity: 0.25 },
                  ]}
                >
                  <Text style={[styles.dayText, isSelected && { color: colors.accentDark, fontWeight: '800' }, isToday && !isSelected && { color: colors.accent }]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={styles.todayBtn}
            onPress={() => {
              onSelect(today);
              onClose();
            }}
          >
            <Text style={styles.todayText}>Use today</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    paddingBottom: 30,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  todayBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
  },
  todayText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 14,
  },
});
