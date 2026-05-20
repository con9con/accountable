import { useAuth } from '@clerk/react';
import { useAccountStore } from '@/store/useAccountStore';
import type { Account } from '@/types';

async function getTokenOrThrow(getToken: () => Promise<string | null>): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}

export function useActions() {
  const { getToken } = useAuth();
  const store = useAccountStore();

  const tok = () => getTokenOrThrow(getToken);

  return {
    addAccount: async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balanceHistory'>) =>
      store.addAccount(await tok(), data),

    updateAccount: async (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) =>
      store.updateAccount(await tok(), id, data),

    deleteAccount: async (id: string) =>
      store.deleteAccount(await tok(), id),

    recordPayment: async (accountId: string, amount: number, date: string, note?: string) =>
      store.recordPayment(await tok(), accountId, amount, date, note),

    updatePayment: async (id: string, updates: { amount?: number; date?: string; note?: string }) =>
      store.updatePayment(await tok(), id, updates),

    deletePayment: async (id: string) =>
      store.deletePayment(await tok(), id),
  };
}
