const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function fmtCents(cents: number): string {
  return usd.format(cents / 100);
}

export function fmtCentsSigned(cents: number, type: 'income' | 'expense'): string {
  const base = usd.format(Math.abs(cents) / 100);
  return type === 'income' ? `+${base}` : `-${base}`;
}

/** Parse a user-typed amount like "1,234.56" into integer cents. Null if invalid. */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  if (!cleaned || !/^\d*(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toISODate(year: number, month1to12: number, day: number): string {
  return `${year}-${pad2(month1to12)}-${pad2(day)}`;
}

export function todayISO(): string {
  const d = new Date();
  return toISODate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function monthKeyOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKeyOf(todayISO());
}

export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${pad2(nm)}`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function monthShortLabel(key: string): string {
  const [, m] = key.split('-').map(Number);
  return MONTHS_SHORT[m - 1];
}

export function dayLabel(isoDate: string): string {
  const today = todayISO();
  if (isoDate === today) return 'Today';
  const d = parseISODate(isoDate);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isoDate === toISODate(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate())) {
    return 'Yesterday';
  }
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function friendlyDate(isoDate: string): string {
  const d = parseISODate(isoDate);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function memberSince(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
