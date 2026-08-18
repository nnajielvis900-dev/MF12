import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Budget, Transaction, TxType } from '../lib/types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface FinanceContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;
  refreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  addTransaction: (input: { type: TxType; amountCents: number; category: string; note?: string; date: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setBudget: (category: string, limitCents: number) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [txs, bds] = await Promise.all([api.listTransactions(user.id), api.listBudgets(user.id)]);
    setTransactions(txs);
    setBudgets(bds);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    load().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [load]);

  const reload = useCallback(async () => {
    await load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const addTransaction = useCallback(
    async (input: { type: TxType; amountCents: number; category: string; note?: string; date: string }) => {
      if (!user) return;
      await api.createTransaction(user.id, input);
      await load();
    },
    [user, load],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      await api.deleteTransaction(user.id, id);
      await load();
    },
    [user, load],
  );

  const setBudget = useCallback(
    async (category: string, limitCents: number) => {
      if (!user) return;
      await api.setBudget(user.id, category, limitCents);
      await load();
    },
    [user, load],
  );

  const value = useMemo(
    () => ({ transactions, budgets, loading, refreshing, reload, refresh, addTransaction, deleteTransaction, setBudget }),
    [transactions, budgets, loading, refreshing, reload, refresh, addTransaction, deleteTransaction, setBudget],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider');
  return ctx;
}
