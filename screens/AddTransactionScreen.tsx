import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
import { TxType } from '../lib/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories';
import { friendlyDate, parseAmountToCents, todayISO } from '../lib/format';
import { colors, radius } from '../lib/theme';
import { AppButton } from '../components/ui';
import { CalendarModal } from '../components/CalendarModal';

export function AddTransactionScreen() {
  const navigation = useNavigation();
  const { addTransaction } = useFinance();

  const [type, setType] = useState<TxType>('expense');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const categories = useMemo(
    () => (type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    [type],
  );

  const switchType = (t: TxType) => {
    setType(t);
    setCategory(null);
  };

  const save = async () => {
    setError(null);
    const cents = parseAmountToCents(amountText);
    if (!cents) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    if (!category) {
      setError('Pick a category for this transaction.');
      return;
    }
    setSaving(true);
    try {
      await addTransaction({ type, amountCents: cents, category, note: note.trim() || undefined, date });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={19} color={colors.textSub} />
          </Pressable>
          <Text style={styles.headerTitle}>New transaction</Text>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Type toggle */}
          <View style={styles.typeRow}>
            {(['expense', 'income'] as TxType[]).map((t) => {
              const active = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => switchType(t)}
                  style={[
                    styles.typeBtn,
                    active && { backgroundColor: t === 'expense' ? colors.roseSoft : colors.accentSoft, borderColor: t === 'expense' ? 'rgba(251,113,133,0.4)' : 'rgba(52,211,153,0.4)' },
                  ]}
                >
                  <Ionicons
                    name={t === 'expense' ? 'arrow-up' : 'arrow-down'}
                    size={15}
                    color={active ? (t === 'expense' ? colors.rose : colors.accent) : colors.textSub}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      { color: active ? (t === 'expense' ? colors.rose : colors.accent) : colors.textSub },
                    ]}
                  >
                    {t === 'expense' ? 'Expense' : 'Income'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Amount */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={(v) => {
                  setAmountText(v.replace(/[^0-9.]/g, ''));
                  setError(null);
                }}
                placeholder="0.00"
                placeholderTextColor={colors.textFaint}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>

          {/* Category grid */}
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.grid}>
            {categories.map((c) => {
              const active = category === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => {
                    setCategory(c.key);
                    setError(null);
                  }}
                  style={[
                    styles.catBtn,
                    active && { borderColor: c.color, backgroundColor: `${c.color}1A` },
                  ]}
                >
                  <View style={[styles.catIcon, { backgroundColor: `${c.color}${active ? '33' : '1F' }` }]}>
                    <MaterialCommunityIcons name={c.icon as never} size={17} color={c.color} />
                  </View>
                  <Text style={[styles.catLabel, active && { color: colors.text }]} numberOfLines={1}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Date + note */}
          <Text style={styles.fieldLabel}>Date</Text>
          <Pressable style={styles.dateBtn} onPress={() => setCalendarOpen(true)}>
            <Ionicons name="calendar-outline" size={17} color={colors.accent} />
            <Text style={styles.dateText}>{friendlyDate(date)}</Text>
            <Ionicons name="chevron-down" size={15} color={colors.textFaint} />
          </Pressable>

          <Text style={styles.fieldLabel}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Coffee with Sam"
            placeholderTextColor={colors.textFaint}
            maxLength={80}
            returnKeyType="done"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.rose} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <AppButton label="Save transaction" icon="checkmark" onPress={save} loading={saving} style={{ marginTop: 18 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CalendarModal
        visible={calendarOpen}
        selectedISO={date}
        onClose={() => setCalendarOpen(false)}
        onSelect={setDate}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  amountBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 20,
  },
  amountLabel: {
    color: colors.textSub,
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    color: colors.textSub,
    fontSize: 28,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    paddingVertical: 0,
    outlineStyle: 'none',
  } as object,
  fieldLabel: {
    color: colors.textSub,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  catBtn: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 7,
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    color: colors.textSub,
    fontSize: 11.5,
    fontWeight: '600',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  dateText: {
    flex: 1,
    color: colors.text,
    fontSize: 14.5,
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 14.5,
    outlineStyle: 'none',
  } as object,
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.roseSoft,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: colors.rose,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
