import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, AccountType, Payment, Toast } from '@/types';
import { generateId, todayISO, formatCurrency } from '@/lib/utils';
import { buildDemoState } from '@/lib/demoData';

function advanceDueDate(dueDate: string): string {
  const d = new Date(dueDate + 'T00:00');
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

interface AccountStore {
  accounts: Account[];
  payments: Payment[];
  toasts: Toast[];

  addAccount: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balanceHistory'>) => void;
  updateAccount: (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => void;
  deleteAccount: (id: string) => void;
  addPayment: (data: Omit<Payment, 'id'>) => void;
  recordPayment: (accountId: string, amount: number, date: string, note?: string) => void;
  updatePayment: (id: string, data: Partial<Omit<Payment, 'id' | 'accountId'>>) => void;
  deletePayment: (id: string) => void;
  dismissToast: (id: string) => void;

  getAccountsByType: (type: AccountType) => Account[];
  getTotalDebt: () => number;
  getTotalMinimum: () => number;
  getTotalOriginal: () => number;
  getAvgAPR: () => number;

  loadDemo: () => void;
  clearAll: () => void;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      payments: [],
      toasts: [],

      addAccount: (data) => {
        const now = new Date().toISOString();
        const today = todayISO();
        set((s) => ({
          accounts: [
            ...s.accounts,
            {
              ...data,
              id: generateId(),
              originalBalance: data.originalBalance ?? data.totalDue,
              balanceHistory: [{ date: today, balance: data.totalDue }],
              createdAt: now,
              updatedAt: now,
            },
          ],
        }));
      },

      updateAccount: (id, data) => {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
          ),
        }));
      },

      deleteAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          payments: s.payments.filter((p) => p.accountId !== id),
        }));
      },

      addPayment: (data) => {
        const payment: Payment = { ...data, id: generateId() };
        set((s) => {
          const account = s.accounts.find((a) => a.id === data.accountId);
          const updatedAccounts = account
            ? s.accounts.map((a) => {
                if (a.id !== data.accountId) return a;
                const newBalance = Math.max(0, a.totalDue - data.amount);
                return {
                  ...a,
                  totalDue: newBalance,
                  balanceHistory: [...(a.balanceHistory ?? []), { date: data.date, balance: newBalance }],
                  ...(a.dueDate ? { dueDate: advanceDueDate(a.dueDate) } : {}),
                  updatedAt: new Date().toISOString(),
                };
              })
            : s.accounts;
          return { payments: [...s.payments, payment], accounts: updatedAccounts };
        });
      },

      recordPayment: (accountId, amount, date, note = '') => {
        const account = get().accounts.find((a) => a.id === accountId);
        get().addPayment({ accountId, amount, date, note });
        if (account) {
          const msg = `Payment of ${formatCurrency(amount)} recorded for ${account.name}`;
          const id = generateId();
          set((s) => ({ toasts: [...s.toasts, { id, msg, type: 'success' }] }));
          setTimeout(() => get().dismissToast(id), 3500);
        }
      },

      updatePayment: (id, data) => {
        set((s) => {
          const oldPayment = s.payments.find((p) => p.id === id);
          if (!oldPayment) return s;
          const amountDelta = (data.amount ?? oldPayment.amount) - oldPayment.amount;
          const updatedPayments = s.payments.map((p) => (p.id === id ? { ...p, ...data } : p));
          const updatedAccounts = s.accounts.map((a) => {
            if (a.id !== oldPayment.accountId) return a;
            return { ...a, totalDue: Math.max(0, a.totalDue - amountDelta), updatedAt: new Date().toISOString() };
          });
          return { payments: updatedPayments, accounts: updatedAccounts };
        });
      },

      deletePayment: (id) => {
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
      },

      dismissToast: (id) => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },

      getAccountsByType: (type) => get().accounts.filter((a) => a.type === type),
      getTotalDebt: () => get().accounts.reduce((sum, a) => sum + a.totalDue, 0),
      getTotalMinimum: () => get().accounts.reduce((sum, a) => sum + a.minimumDue, 0),
      getTotalOriginal: () => get().accounts.reduce((sum, a) => sum + (a.originalBalance ?? a.totalDue), 0),
      getAvgAPR: () => {
        const accs = get().accounts;
        return accs.length ? accs.reduce((s, a) => s + a.interestRate, 0) / accs.length : 0;
      },

      loadDemo: () => set(buildDemoState()),
      clearAll: () => set({ accounts: [], payments: [] }),
    }),
    { name: 'accountable-store' }
  )
);
