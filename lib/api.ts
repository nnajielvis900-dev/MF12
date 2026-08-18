import { Budget, Transaction, TxType, User } from './types';
import { getDB, commit, uid, UserRecord, SessionRecord } from './db';
import { secureStore } from './secure';
import { hashPassword, randomHex } from './crypto';
import { isValidCategory } from './categories';

/**
 * Service layer shaped like the Express REST API in /server:
 * every call validates its input, authenticates via session token,
 * and scopes all data access to the owning user.
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const TOKEN_KEY = '@ledgerly/session/token';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT_CENTS = 10_000_000_000; // $100M guard

function toPublicUser(rec: UserRecord): User {
  return { id: rec.id, name: rec.name, email: rec.email, createdAt: rec.createdAt };
}

async function requireSession(token: string | null): Promise<{ session: SessionRecord; user: UserRecord }> {
  if (!token) throw new ApiError('Not authenticated', 401);
  const db = await getDB();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) throw new ApiError('Session expired. Please sign in again.', 401);
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) throw new ApiError('Account not found', 401);
  return { session, user };
}

async function issueSession(userId: string): Promise<string> {
  const token = randomHex(32);
  const db = await getDB();
  db.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  await commit(db);
  await secureStore.setItem(TOKEN_KEY, token);
  return token;
}

export const api = {
  // ── POST /api/auth/register ─────────────────────────────────────────────
  async register(input: { name: string; email: string; password: string }): Promise<{ user: User; token: string }> {
    const name = (input.name ?? '').trim();
    const email = (input.email ?? '').trim().toLowerCase();
    const password = input.password ?? '';

    if (name.length < 2 || name.length > 80) throw new ApiError('Please enter your full name.');
    if (!EMAIL_RE.test(email)) throw new ApiError('Please enter a valid email address.');
    if (password.length < 8) throw new ApiError('Password must be at least 8 characters.');

    const db = await getDB();
    if (db.users.some((u) => u.emailLower === email)) {
      throw new ApiError('An account with this email already exists.', 409);
    }

    const salt = randomHex(16);
    const passwordHash = await hashPassword(password, salt);
    const record: UserRecord = {
      id: uid(),
      name,
      email,
      emailLower: email,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };
    db.users.push(record);
    await commit(db);
    const token = await issueSession(record.id);
    return { user: toPublicUser(record), token };
  },

  // ── POST /api/auth/login ────────────────────────────────────────────────
  async login(input: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const email = (input.email ?? '').trim().toLowerCase();
    const password = input.password ?? '';
    if (!EMAIL_RE.test(email) || !password) throw new ApiError('Enter your email and password.');

    const db = await getDB();
    const record = db.users.find((u) => u.emailLower === email);
    // Same generic error either way — never reveal which credential failed.
    if (!record) throw new ApiError('Invalid email or password.', 401);

    const candidate = await hashPassword(password, record.salt);
    if (candidate !== record.passwordHash) throw new ApiError('Invalid email or password.', 401);

    const token = await issueSession(record.id);
    return { user: toPublicUser(record), token };
  },

  // ── GET /api/auth/me (restore session on app start) ─────────────────────
  async restoreSession(): Promise<User | null> {
    const token = await secureStore.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const { user } = await requireSession(token);
      return toPublicUser(user);
    } catch {
      await secureStore.removeItem(TOKEN_KEY);
      return null;
    }
  },

  // ── POST /api/auth/logout ───────────────────────────────────────────────
  async logout(): Promise<void> {
    const token = await secureStore.getItem(TOKEN_KEY);
    if (token) {
      const db = await getDB();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      await commit(db);
    }
    await secureStore.removeItem(TOKEN_KEY);
  },

  // ── GET /api/transactions ───────────────────────────────────────────────
  async listTransactions(userId: string): Promise<Transaction[]> {
    const db = await getDB();
    return db.transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => (b.date === a.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
  },

  // ── POST /api/transactions ──────────────────────────────────────────────
  async createTransaction(
    userId: string,
    input: { type: TxType; amountCents: number; category: string; note?: string; date: string },
  ): Promise<Transaction> {
    const type = input.type;
    if (type !== 'income' && type !== 'expense') throw new ApiError('Invalid transaction type.');
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0 || input.amountCents > MAX_AMOUNT_CENTS) {
      throw new ApiError('Enter a valid amount.');
    }
    if (!isValidCategory(type, input.category)) throw new ApiError('Pick a category.');
    if (!DATE_RE.test(input.date) || Number.isNaN(new Date(input.date).getTime())) {
      throw new ApiError('Pick a valid date.');
    }
    const note = (input.note ?? '').trim().slice(0, 80);

    const tx: Transaction = {
      id: uid(),
      userId,
      type,
      amountCents: input.amountCents,
      category: input.category,
      note: note || undefined,
      date: input.date,
      createdAt: new Date().toISOString(),
    };
    const db = await getDB();
    db.transactions.push(tx);
    await commit(db);
    return tx;
  },

  // ── DELETE /api/transactions/:id ────────────────────────────────────────
  async deleteTransaction(userId: string, id: string): Promise<void> {
    const db = await getDB();
    const idx = db.transactions.findIndex((t) => t.id === id && t.userId === userId);
    if (idx === -1) throw new ApiError('Transaction not found', 404);
    db.transactions.splice(idx, 1);
    await commit(db);
  },

  // ── GET /api/budgets ────────────────────────────────────────────────────
  async listBudgets(userId: string): Promise<Budget[]> {
    const db = await getDB();
    return db.budgets.filter((b) => b.userId === userId);
  },

  // ── PUT /api/budgets/:category (upsert; limit ≤ 0 removes) ─────────────
  async setBudget(userId: string, category: string, limitCents: number): Promise<Budget | null> {
    if (!isValidCategory('expense', category)) throw new ApiError('Unknown budget category.');
    if (!Number.isInteger(limitCents) || limitCents > MAX_AMOUNT_CENTS) throw new ApiError('Enter a valid limit.');

    const db = await getDB();
    const existing = db.budgets.find((b) => b.userId === userId && b.category === category);

    if (limitCents <= 0) {
      if (existing) {
        db.budgets = db.budgets.filter((b) => b !== existing);
        await commit(db);
      }
      return null;
    }

    if (existing) {
      existing.limitCents = limitCents;
      await commit(db);
      return existing;
    }
    const budget: Budget = { id: uid(), userId, category, limitCents };
    db.budgets.push(budget);
    await commit(db);
    return budget;
  },
};
