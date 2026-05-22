import { create } from 'zustand';
import type { Account, AccountType, Payment, Toast } from '@/types';
import { generateId, formatCurrency } from '@/lib/utils';
import * as api from '@/lib/apiClient';
import { buildDemoState } from '@/lib/demoData';

interface AccountStore {
  accounts: Account[];
  payments: Payment[];
  toasts: Toast[];
  loading: boolean;
  initialized: boolean;
  demoMode: boolean;

  // Data lifecycle
  init: (token: string) => Promise<void>;
  initDemo: () => void;
  reset: () => void;

  // Account actions
  addAccount: (token: string, data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balanceHistory'>) => Promise<void>;
  updateAccount: (token: string, id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => Promise<void>;
  deleteAccount: (token: string, id: string) => Promise<void>;

  // Payment actions
  recordPayment: (token: string, accountId: string, amount: number, date: string, note?: string) => Promise<void>;
  updatePayment: (token: string, id: string, updates: { amount?: number; date?: string; note?: string }) => Promise<void>;
  deletePayment: (token: string, id: string) => Promise<void>;

  // Toast
  toast: (msg: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;

  // Computed helpers (synchronous, derived from state)
  getAccountsByType: (type: AccountType) => Account[];
  getTotalDebt: () => number;
  getTotalMinimum: () => number;
  getTotalOriginal: () => number;
  getAvgAPR: () => number;
}

export const useAccountStore = create<AccountStore>()((set, get) => ({
  accounts: [],
  payments: [],
  toasts: [],
  loading: false,
  initialized: false,
  demoMode: false,

  init: async (token) => {
    if (get().initialized) return;
    set({ loading: true });
    try {
      const [accounts, payments] = await Promise.all([
        api.fetchAccounts(token),
        api.fetchPayments(token),
      ]);
      set({ accounts, payments, initialized: true });
    } catch (err) {
      console.error('[init] failed to load data:', err);
      set({ initialized: true }); // unblock the UI even on error
      get().toast('Failed to load data. Please refresh.', 'error');
    } finally {
      set({ loading: false });
    }
  },

  reset: () => set({ accounts: [], payments: [], initialized: false, demoMode: false }),

  initDemo: () => {
    const { accounts, payments } = buildDemoState();
    set({ accounts, payments, initialized: true, demoMode: true });
  },

  addAccount: async (token, data) => {
    if (get().demoMode) {
      const now = new Date().toISOString();
      const account: Account = { id: generateId(), ...data, createdAt: now, updatedAt: now };
      set((s) => ({ accounts: [...s.accounts, account] }));
      return;
    }
    try {
      const id = generateId();
      const account = await api.createAccount(token, { id, ...data });
      set((s) => ({ accounts: [...s.accounts, account] }));
    } catch (err) {
      console.error('[addAccount]', err);
      get().toast(err instanceof Error ? err.message : 'Failed to add account', 'error');
    }
  },

  updateAccount: async (token, id, data) => {
    if (get().demoMode) {
      const now = new Date().toISOString();
      set((s) => ({ accounts: s.accounts.map((a) => a.id === id ? { ...a, ...data, updatedAt: now } : a) }));
      return;
    }
    try {
      const updated = await api.updateAccount(token, id, data);
      set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? updated : a)) }));
    } catch (err) {
      console.error('[updateAccount]', err);
      get().toast(err instanceof Error ? err.message : 'Failed to update account', 'error');
    }
  },

  deleteAccount: async (token, id) => {
    if (get().demoMode) {
      set((s) => ({
        accounts: s.accounts.filter((a) => a.id !== id),
        payments: s.payments.filter((p) => p.accountId !== id),
      }));
      return;
    }
    try {
      await api.deleteAccount(token, id);
      set((s) => ({
        accounts: s.accounts.filter((a) => a.id !== id),
        payments: s.payments.filter((p) => p.accountId !== id),
      }));
    } catch (err) {
      console.error('[deleteAccount]', err);
      get().toast(err instanceof Error ? err.message : 'Failed to delete account', 'error');
    }
  },

  recordPayment: async (token, accountId, amount, date, note = '') => {
    const account = get().accounts.find((a) => a.id === accountId);
    const applyPayment = (payment: Payment) => {
      set((s) => ({
        payments: [...s.payments, payment],
        accounts: s.accounts.map((a) => {
          if (a.id !== accountId) return a;
          const newBalance = Math.max(0, a.totalDue - amount);
          let newDueDate = a.dueDate;
          if (a.dueDate) {
            const d = new Date(a.dueDate + 'T00:00:00');
            d.setMonth(d.getMonth() + 1);
            newDueDate = d.toISOString().split('T')[0];
          }
          return {
            ...a,
            totalDue: newBalance,
            dueDate: newDueDate,
            balanceHistory: [...(a.balanceHistory ?? []), { date, balance: newBalance }],
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      if (account) get().toast(`Payment of ${formatCurrency(amount)} recorded for ${account.name}`);
    };

    if (get().demoMode) {
      applyPayment({ id: generateId(), accountId, amount, date, note });
      return;
    }
    try {
      const payment = await api.createPayment(token, { id: generateId(), accountId, amount, date, note });
      applyPayment(payment);
    } catch (err) {
      console.error('[recordPayment]', err);
      get().toast(err instanceof Error ? err.message : 'Failed to record payment', 'error');
    }
  },

  updatePayment: async (token, id, updates) => {
    const old = get().payments.find((p) => p.id === id);
    const applyUpdate = (updated: Payment) => {
      set((s) => ({
        payments: s.payments.map((p) => (p.id === id ? updated : p)),
        accounts: updates.amount !== undefined && old
          ? s.accounts.map((a) => {
              if (a.id !== updated.accountId) return a;
              const delta = old.amount - updates.amount!;
              return { ...a, totalDue: Math.max(0, a.totalDue + delta) };
            })
          : s.accounts,
      }));
    };

    if (get().demoMode) {
      if (old) applyUpdate({ ...old, ...updates });
      return;
    }
    try {
      const updated = await api.updatePayment(token, id, updates);
      applyUpdate(updated);
    } catch (err) {
      console.error('[updatePayment]', err);
      get().toast(err instanceof Error ? err.message : 'Failed to update payment', 'error');
    }
  },

  deletePayment: async (token, id) => {
    if (get().demoMode) {
      set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
      return;
    }
    try {
      await api.deletePayment(token, id);
      set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
    } catch (err) {
      console.error('[deletePayment]', err);
      get().toast(err instanceof Error ? err.message : 'Failed to delete payment', 'error');
    }
  },

  toast: (msg, type = 'success') => {
    const id = generateId();
    set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(() => get().dismissToast(id), 3500);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  getAccountsByType: (type) => get().accounts.filter((a) => a.type === type),
  getTotalDebt: () => get().accounts.reduce((s, a) => s + a.totalDue, 0),
  getTotalMinimum: () => get().accounts.reduce((s, a) => s + a.minimumDue, 0),
  getTotalOriginal: () => get().accounts.reduce((s, a) => s + (a.originalBalance ?? a.totalDue), 0),
  getAvgAPR: () => {
    const accs = get().accounts;
    return accs.length ? accs.reduce((s, a) => s + a.interestRate, 0) / accs.length : 0;
  },
}));
