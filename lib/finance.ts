import { BreakdownSlice, Budget, BudgetStatus, Transaction, TrendPoint } from './types';
import { monthKeyOf, currentMonthKey, shiftMonthKey, monthShortLabel } from './format';

/** All-time balance = lifetime income − lifetime expenses (integer cents). */
export function allTimeBalance(transactions: Transaction[]): number {
  let bal = 0;
  for (const t of transactions) {
    bal += t.type === 'income' ? t.amountCents : -t.amountCents;
  }
  return bal;
}

export function totalsForMonth(transactions: Transaction[], monthKey: string): { incomeCents: number; expenseCents: number } {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of transactions) {
    if (monthKeyOf(t.date) !== monthKey) continue;
    if (t.type === 'income') incomeCents += t.amountCents;
    else expenseCents += t.amountCents;
  }
  return { incomeCents, expenseCents };
}

export function breakdownForMonth(transactions: Transaction[], monthKey: string): BreakdownSlice[] {
  const sums = new Map<string, number>();
  let total = 0;
  for (const t of transactions) {
    if (t.type !== 'expense' || monthKeyOf(t.date) !== monthKey) continue;
    sums.set(t.category, (sums.get(t.category) ?? 0) + t.amountCents);
    total += t.amountCents;
  }
  if (total === 0) return [];
  return Array.from(sums.entries())
    .map(([category, cents]) => ({ category, cents, pct: cents / total }))
    .sort((a, b) => b.cents - a.cents);
}

export function budgetStatuses(budgets: Budget[], transactions: Transaction[], monthKey: string): BudgetStatus[] {
  const spent = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense' || monthKeyOf(t.date) !== monthKey) continue;
    spent.set(t.category, (spent.get(t.category) ?? 0) + t.amountCents);
  }
  return budgets
    .map((b) => {
      const spentCents = spent.get(b.category) ?? 0;
      const pct = b.limitCents > 0 ? spentCents / b.limitCents : 0;
      const level: BudgetStatus['level'] = pct > 1 ? 'over' : pct >= 0.8 ? 'warning' : 'ok';
      return {
        category: b.category,
        limitCents: b.limitCents,
        spentCents,
        pct,
        remainingCents: b.limitCents - spentCents,
        level,
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

/** Categories at ≥ 80% of budget — powers dashboard alerts & tab badge. */
export function budgetAlerts(statuses: BudgetStatus[]): BudgetStatus[] {
  return statuses.filter((s) => s.level !== 'ok');
}

export function trend(transactions: Transaction[], months = 6): TrendPoint[] {
  const current = currentMonthKey();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) keys.push(shiftMonthKey(current, -i));

  return keys.map((key) => {
    const { incomeCents, expenseCents } = totalsForMonth(transactions, key);
    return { monthKey: key, label: monthShortLabel(key), incomeCents, expenseCents, isCurrent: key === current };
  });
}

export function transactionsForMonth(transactions: Transaction[], monthKey: string): Transaction[] {
  return transactions.filter((t) => monthKeyOf(t.date) === monthKey);
}
