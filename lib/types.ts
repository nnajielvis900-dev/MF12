export type TxType = 'income' | 'expense';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TxType;
  /** Integer cents — never store floats for money. */
  amountCents: number;
  category: string;
  note?: string;
  /** ISO date (YYYY-MM-DD) the transaction occurred on. */
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limitCents: number;
}

export interface CategoryMeta {
  key: string;
  label: string;
  icon: string;
  color: string;
  type: TxType;
}

export type BudgetLevel = 'ok' | 'warning' | 'over';

export interface BudgetStatus {
  category: string;
  limitCents: number;
  spentCents: number;
  /** 0..N ratio of limit consumed */
  pct: number;
  remainingCents: number;
  level: BudgetLevel;
}

export interface TrendPoint {
  monthKey: string;
  label: string;
  incomeCents: number;
  expenseCents: number;
  isCurrent: boolean;
}

export interface BreakdownSlice {
  category: string;
  cents: number;
  pct: number;
}
