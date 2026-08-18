import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinance } from '../context/FinanceContext';
import { BudgetStatus } from '../lib/types';
import { budgetStatuses } from '../lib/finance';
import { categoryMeta, EXPENSE_CATEGORIES } from '../lib/categories';
import { currentMonthKey, fmtCents, monthLabel, parseAmountToCents } from '../lib/format';
import { colors, radius, cardShadow } from '../lib/theme';
import { AppButton, Card, EmptyState } from '../components/ui';

const LEVEL_META = {
  ok: { label: 'On track', color: colors.accent, bg: colors.accentSoft },
  warning: { label: '80% warning', color: colors.amber, bg: colors.amberSoft },
  over: { label: 'Over budget', color: colors.rose, bg: colors.roseSoft },
} as const;

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.min(pct, 1),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct, progress]);
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

function BudgetCard({ status, onPress }: { status: BudgetStatus; onPress: () => void }) {
  const meta = categoryMeta(status.category);
  const level = LEVEL_META[status.level];
  return (
    <Pressable onPress={onPress}>
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.cardTop}>
          <View style={[styles.catIcon, { backgroundColor: `${meta.color}1F` }]}>
            <MaterialCommunityIcons name={meta.icon as never} size={18} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.catTitle}>{meta.label}</Text>
            <Text style={styles.catSub}>
              {fmtCents(status.spentCents)} of {fmtCents(status.limitCents)}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: level.bg }]}>
            {status.level !== 'ok' ? (
              <Ionicons name={status.level === 'over' ? 'alert-circle' : 'warning'} size={12} color={level.color} />
            ) : null}
            <Text style={[styles.pillText, { color: level.color }]}>{level.label}</Text>
          </View>
        </View>
        <View style={{ marginTop: 14 }}>
          <ProgressBar pct={status.pct} color={level.color} />
          <View style={styles.cardBottom}>
            <Text style={styles.pctText}>{Math.round(status.pct * 100)}% used</Text>
            <Text style={[styles.remainingText, { color: status.remainingCents < 0 ? colors.rose : colors.textSub }]}>
              {status.remainingCents >= 0 ? `${fmtCents(status.remainingCents)} left` : `${fmtCents(-status.remainingCents)} over`}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

interface EditorState {
  mode: 'create' | 'edit';
  category: string | null;
  initialAmount: string;
}

export function BudgetScreen() {
  const { budgets, transactions, setBudget } = useFinance();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [amountText, setAmountText] = useState('');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const monthKey = currentMonthKey();
  const statuses = useMemo(() => budgetStatuses(budgets, transactions, monthKey), [budgets, transactions, monthKey]);

  const totals = useMemo(() => {
    const limit = statuses.reduce((s, b) => s + b.limitCents, 0);
    const spent = statuses.reduce((s, b) => s + Math.min(b.spentCents, b.limitCents), 0);
    const rawSpent = statuses.reduce((s, b) => s + b.spentCents, 0);
    return { limit, spent: rawSpent, capped: spent };
  }, [statuses]);

  const availableCategories = useMemo(
    () => EXPENSE_CATEGORIES.filter((c) => !budgets.some((b) => b.category === c.key)),
    [budgets],
  );

  const openCreate = () => {
    if (availableCategories.length === 0) return;
    setAmountText('');
    setEditorError(null);
    setEditor({ mode: 'create', category: availableCategories[0].key, initialAmount: '' });
  };

  const openEdit = (status: BudgetStatus) => {
    const text = (status.limitCents / 100).toFixed(2);
    setAmountText(text);
    setEditorError(null);
    setEditor({ mode: 'edit', category: status.category, initialAmount: text });
  };

  const saveEditor = async () => {
    if (!editor || !editor.category) return;
    const cents = parseAmountToCents(amountText);
    if (!cents) {
      setEditorError('Enter a valid monthly limit.');
      return;
    }
    setSaving(true);
    try {
      await setBudget(editor.category, cents);
      setEditor(null);
    } catch (e) {
      setEditorError(e instanceof Error ? e.message : 'Could not save budget.');
    } finally {
      setSaving(false);
    }
  };

  const removeEditor = async () => {
    if (!editor || !editor.category) return;
    setSaving(true);
    try {
      await setBudget(editor.category, 0);
      setEditor(null);
    } finally {
      setSaving(false);
    }
  };

  const editorMeta = editor?.category ? categoryMeta(editor.category) : null;
  const overallPct = totals.limit > 0 ? totals.spent / totals.limit : 0;
  const overallColor = overallPct > 1 ? colors.rose : overallPct >= 0.8 ? colors.amber : colors.accent;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budgets</Text>
          <Text style={styles.subtitle}>{monthLabel(monthKey)}</Text>
        </View>
        {availableCategories.length > 0 ? (
          <Pressable onPress={openCreate} style={styles.addBtn}>
            <Ionicons name="add" size={17} color={colors.accentDark} />
            <Text style={styles.addText}>New budget</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {statuses.length === 0 ? (
          <EmptyState
            icon="speedometer-outline"
            title="No budgets yet"
            subtitle="Set monthly spending limits per category and Ledgerly will alert you at 80% and when you go over."
            actionLabel="Create first budget"
            onAction={openCreate}
          />
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.summaryLabel}>Total monthly budget</Text>
                  <Text style={styles.summaryValue}>{fmtCents(totals.limit)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.summaryLabel}>Spent so far</Text>
                  <Text style={[styles.summaryValue, { color: overallColor, fontSize: 20 }]}>
                    {fmtCents(totals.spent)}
                  </Text>
                </View>
              </View>
              <ProgressBar pct={overallPct} color={overallColor} />
              <Text style={styles.summaryFoot}>
                {Math.round(overallPct * 100)}% of total budget used ·{' '}
                {totals.limit - totals.spent >= 0
                  ? `${fmtCents(totals.limit - totals.spent)} remaining`
                  : `${fmtCents(totals.spent - totals.limit)} over`}
              </Text>
            </View>

            {statuses.map((s) => (
              <BudgetCard key={s.category} status={s} onPress={() => openEdit(s)} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Editor modal */}
      <Modal visible={editor !== null} transparent animationType="slide" onRequestClose={() => setEditor(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEditor(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
              {editor?.mode === 'create' ? 'New monthly budget' : `Edit · ${editorMeta?.label ?? ''}`}
            </Text>

            {editor?.mode === 'create' ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={styles.chipRow}>
                  {availableCategories.map((c) => {
                    const active = editor.category === c.key;
                    return (
                      <Pressable
                        key={c.key}
                        onPress={() => setEditor({ ...editor, category: c.key })}
                        style={[styles.chip, active && { borderColor: c.color, backgroundColor: `${c.color}1A` }]}
                      >
                        <MaterialCommunityIcons name={c.icon as never} size={14} color={active ? c.color : colors.textSub} />
                        <Text style={[styles.chipText, active && { color: colors.text }]}>{c.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            ) : null}

            <Text style={styles.limitLabel}>Monthly limit</Text>
            <View style={styles.limitRow}>
              <Text style={styles.limitCurrency}>$</Text>
              <TextInput
                style={styles.limitInput}
                value={amountText}
                onChangeText={(v) => {
                  setAmountText(v.replace(/[^0-9.]/g, ''));
                  setEditorError(null);
                }}
                placeholder="0.00"
                placeholderTextColor={colors.textFaint}
                keyboardType="decimal-pad"
                autoFocus={editor?.mode === 'create'}
              />
            </View>

            {editorError ? <Text style={styles.editorError}>{editorError}</Text> : null}

            <AppButton label="Save budget" icon="checkmark" onPress={saveEditor} loading={saving} style={{ marginTop: 16 }} />
            {editor?.mode === 'edit' ? (
              <AppButton label="Remove budget" icon="trash-outline" variant="danger" onPress={removeEditor} disabled={saving} style={{ marginTop: 10 }} />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSub,
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addText: {
    color: colors.accentDark,
    fontSize: 13,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
    ...cardShadow,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryLabel: {
    color: colors.textSub,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 3,
  },
  summaryFoot: {
    color: colors.textSub,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: {
    color: colors.text,
    fontSize: 14.5,
    fontWeight: '800',
  },
  catSub: {
    color: colors.textSub,
    fontSize: 12.5,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pctText: {
    color: colors.textSub,
    fontSize: 12,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
  },
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
    padding: 22,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    color: colors.textSub,
    fontSize: 12.5,
    fontWeight: '700',
  },
  limitLabel: {
    color: colors.textSub,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  limitCurrency: {
    color: colors.textSub,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 4,
  },
  limitInput: {
    flex: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    paddingVertical: 12,
    outlineStyle: 'none',
  } as object,
  editorError: {
    color: colors.rose,
    fontSize: 12.5,
    marginTop: 8,
    fontWeight: '600',
  },
});
