import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction } from '../lib/types';
import { categoryMeta } from '../lib/categories';
import { fmtCentsSigned, friendlyDate } from '../lib/format';
import { colors } from '../lib/theme';

interface Props {
  tx: Transaction;
  showDate?: boolean;
  onDelete?: (tx: Transaction) => void;
}

export function TransactionRow({ tx, showDate, onDelete }: Props) {
  const meta = categoryMeta(tx.category);
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${meta.color}1F` }]}>
        <MaterialCommunityIcons name={meta.icon as never} size={19} color={meta.color} />
      </View>
      <View style={styles.mid}>
        <Text style={styles.title} numberOfLines={1}>
          {tx.note || meta.label}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {showDate ? `${friendlyDate(tx.date)} · ` : ''}
          {meta.label}
        </Text>
      </View>
      <Text style={[styles.amount, { color: tx.type === 'income' ? colors.accent : colors.text }]}>
        {fmtCentsSigned(tx.amountCents, tx.type)}
      </Text>
      {onDelete ? (
        <Pressable hitSlop={10} onPress={() => onDelete(tx)} style={styles.trash}>
          <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  sub: {
    color: colors.textSub,
    fontSize: 12.5,
    marginTop: 2,
  },
  amount: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  trash: {
    padding: 6,
    marginLeft: -2,
  },
});
