import { CategoryMeta } from './types';

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { key: 'groceries', label: 'Groceries', icon: 'cart', color: '#4ADE80', type: 'expense' },
  { key: 'dining', label: 'Dining Out', icon: 'food-fork-drink', color: '#FB923C', type: 'expense' },
  { key: 'transport', label: 'Transport', icon: 'car', color: '#60A5FA', type: 'expense' },
  { key: 'housing', label: 'Housing', icon: 'home', color: '#A78BFA', type: 'expense' },
  { key: 'shopping', label: 'Shopping', icon: 'shopping', color: '#F472B6', type: 'expense' },
  { key: 'health', label: 'Health', icon: 'heart-pulse', color: '#2DD4BF', type: 'expense' },
  { key: 'entertainment', label: 'Fun', icon: 'popcorn', color: '#FACC15', type: 'expense' },
  { key: 'bills', label: 'Bills', icon: 'receipt', color: '#FB7185', type: 'expense' },
  { key: 'other-expense', label: 'Other', icon: 'dots-horizontal', color: '#94A3B8', type: 'expense' },
];

export const INCOME_CATEGORIES: CategoryMeta[] = [
  { key: 'salary', label: 'Salary', icon: 'briefcase', color: '#34D399', type: 'income' },
  { key: 'freelance', label: 'Freelance', icon: 'laptop', color: '#38BDF8', type: 'income' },
  { key: 'investments', label: 'Investments', icon: 'chart-line', color: '#C084FC', type: 'income' },
  { key: 'other-income', label: 'Other', icon: 'cash', color: '#94A3B8', type: 'income' },
];

export const ALL_CATEGORIES: CategoryMeta[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const FALLBACK: CategoryMeta = {
  key: 'other-expense',
  label: 'Other',
  icon: 'dots-horizontal',
  color: '#94A3B8',
  type: 'expense',
};

export function categoryMeta(key: string): CategoryMeta {
  return ALL_CATEGORIES.find((c) => c.key === key) ?? FALLBACK;
}

export function isValidCategory(type: 'income' | 'expense', category: string): boolean {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.some((c) => c.key === category);
}
