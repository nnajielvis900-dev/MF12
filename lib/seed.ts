import { getDB, commit, uid, UserRecord } from './db';
import { hashPassword, randomHex } from './crypto';
import { Transaction, Budget } from './types';
import { toISODate, todayISO } from './format';

export const DEMO_EMAIL = 'demo@ledgerly.app';
export const DEMO_PASSWORD = 'Demo1234!';

/** Deterministic PRNG so demo data is stable between runs. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Template {
  category: string;
  type: 'income' | 'expense';
  min: number; // dollars
  max: number;
  countMin: number;
  countMax: number;
  notes: string[];
}

const TEMPLATES: Template[] = [
  { category: 'groceries', type: 'expense', min: 24, max: 110, countMin: 5, countMax: 7, notes: ['Whole Foods', 'Trader Joe\u2019s', 'Costco run', 'Farmers market', 'Safeway'] },
  { category: 'dining', type: 'expense', min: 12, max: 62, countMin: 5, countMax: 8, notes: ['Lunch with team', 'Ramen night', 'Coffee & pastry', 'Pizza Friday', 'Sushi date', 'Brunch'] },
  { category: 'transport', type: 'expense', min: 8, max: 42, countMin: 4, countMax: 6, notes: ['Uber', 'Metro card', 'Gas refill', 'Parking', 'Lyft'] },
  { category: 'shopping', type: 'expense', min: 25, max: 170, countMin: 1, countMax: 3, notes: ['New sneakers', 'Amazon order', 'Uniqlo', 'Home goods'] },
  { category: 'health', type: 'expense', min: 15, max: 85, countMin: 0, countMax: 2, notes: ['Pharmacy', 'Gym day pass', 'Vitamins'] },
  { category: 'entertainment', type: 'expense', min: 9, max: 45, countMin: 2, countMax: 4, notes: ['Cinema tickets', 'Steam sale', 'Concert', 'Bowling'] },
  { category: 'freelance', type: 'income', min: 280, max: 850, countMin: 1, countMax: 2, notes: ['Design gig', 'Consulting invoice', 'Side project'] },
];

/**
 * Creates (once) a demo account with ~3 months of realistic history and
 * budgets tuned so at least one category trips the 80% alert.
 */
export async function ensureDemoAccount(): Promise<void> {
  const db = await getDB();
  if (db.users.some((u) => u.emailLower === DEMO_EMAIL)) return;

  const rand = mulberry32(42);
  const salt = randomHex(16);
  const passwordHash = await hashPassword(DEMO_PASSWORD, salt);

  const now = new Date();
  const user: UserRecord = {
    id: uid(),
    name: 'Alex Rivera',
    email: DEMO_EMAIL,
    emailLower: DEMO_EMAIL,
    passwordHash,
    salt,
    createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
  };

  const transactions: Transaction[] = [];
  const today = todayISO();
  const todayDay = now.getDate();

  const push = (monthOffset: number, day: number, category: string, type: 'income' | 'expense', dollars: number, note?: string) => {
    const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const d = Math.min(day, lastDay);
    const iso = toISODate(base.getFullYear(), base.getMonth() + 1, d);
    if (iso > today) return; // never fabricate future entries
    transactions.push({
      id: uid(),
      userId: user.id,
      type,
      amountCents: Math.round(dollars * 100),
      category,
      note,
      date: iso,
      createdAt: new Date().toISOString(),
    });
  };

  for (let offset = -2; offset <= 0; offset++) {
    const isCurrent = offset === 0;
    // Fixed income & housing
    push(offset, 1, 'salary', 'income', 5200, 'Monthly salary');
    push(offset, 2, 'housing', 'expense', 1450, 'Rent');
    push(offset, 5, 'bills', 'expense', 96.4, 'Electricity');
    push(offset, 7, 'bills', 'expense', 59.99, 'Internet');
    push(offset, 12, 'investments', 'income', 40 + Math.round(rand() * 90), 'Dividends');

    for (const tpl of TEMPLATES) {
      const count = tpl.countMin + Math.floor(rand() * (tpl.countMax - tpl.countMin + 1));
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(rand() * 27);
        if (isCurrent && day > todayDay) continue;
        const dollars = tpl.min + rand() * (tpl.max - tpl.min);
        const note = tpl.notes[Math.floor(rand() * tpl.notes.length)];
        push(offset, day, tpl.category, tpl.type, Math.round(dollars * 100) / 100, note);
      }
    }
  }

  // Guarantee the Dining budget crosses the 80% alert threshold this month.
  const diningBudgetCents = 26000;
  const diningSpent = transactions
    .filter((t) => t.category === 'dining' && t.date.slice(0, 7) === today.slice(0, 7))
    .reduce((s, t) => s + t.amountCents, 0);
  const target = Math.round(diningBudgetCents * 0.86);
  if (diningSpent < target) {
    transactions.push({
      id: uid(),
      userId: user.id,
      type: 'expense',
      amountCents: target - diningSpent,
      category: 'dining',
      note: 'Anniversary dinner',
      date: today,
      createdAt: new Date().toISOString(),
    });
  }

  const mkBudget = (category: string, dollars: number): Budget => ({
    id: uid(),
    userId: user.id,
    category,
    limitCents: dollars * 100,
  });
  const budgets: Budget[] = [
    mkBudget('housing', 1500),
    mkBudget('groceries', 450),
    mkBudget('dining', 260),
    mkBudget('transport', 160),
    mkBudget('shopping', 300),
    mkBudget('entertainment', 120),
    mkBudget('bills', 200),
  ];

  db.users.push(user);
  db.transactions.push(...transactions);
  db.budgets.push(...budgets);
  await commit(db);
}
