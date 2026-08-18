import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Budget, Transaction } from './types';

/**
 * On-device data layer. Mirrors the PostgreSQL schema in /server/db/schema.sql
 * (users, sessions, transactions, budgets) so the app can be pointed at the
 * real Express API without touching UI code.
 */

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  emailLower: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

export interface DBShape {
  users: UserRecord[];
  sessions: SessionRecord[];
  transactions: Transaction[];
  budgets: Budget[];
}

const DB_KEY = '@ledgerly/db/v1';

const EMPTY: DBShape = { users: [], sessions: [], transactions: [], budgets: [] };

let memory: DBShape | null = null;

export async function getDB(): Promise<DBShape> {
  if (memory) return memory;
  try {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DBShape>;
      memory = {
        users: parsed.users ?? [],
        sessions: parsed.sessions ?? [],
        transactions: parsed.transactions ?? [],
        budgets: parsed.budgets ?? [],
      };
      return memory;
    }
  } catch {
    // fall through to empty DB
  }
  memory = { ...EMPTY, users: [], sessions: [], transactions: [], budgets: [] };
  return memory;
}

export async function commit(db: DBShape): Promise<void> {
  memory = db;
  await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
}

/** Load → mutate → persist atomically (single writer model). */
export async function mutateDB<T>(fn: (db: DBShape) => T): Promise<T> {
  const db = await getDB();
  const result = fn(db);
  await commit(db);
  return result;
}

export function uid(): string {
  return Crypto.randomUUID();
}

export async function wipeDB(): Promise<void> {
  memory = { ...EMPTY, users: [], sessions: [], transactions: [], budgets: [] };
  await AsyncStorage.removeItem(DB_KEY);
}
