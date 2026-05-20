import { useEffect } from 'react';
import type { Account } from '@/types';
import { daysUntil } from '@/lib/utils';

const STORAGE_KEY = 'notified_due_dates';

function getNotified(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function markNotified(accountId: string, dueDate: string) {
  const map = getNotified();
  map[accountId] = dueDate;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function alreadyNotified(accountId: string, dueDate: string): boolean {
  return getNotified()[accountId] === dueDate;
}

export function useNotifications(accounts: Account[]) {
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') return;

    const dueAccounts = accounts.filter((a) => {
      if (a.status === 'closed' || !a.dueDate) return false;
      const d = daysUntil(a.dueDate);
      return d !== null && d >= 0 && d <= 3;
    });

    if (dueAccounts.length === 0) return;

    async function notify() {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') return;

      for (const account of dueAccounts) {
        if (alreadyNotified(account.id, account.dueDate!)) continue;
        const days = daysUntil(account.dueDate);
        const body = days === 0
          ? `${account.name} payment is due today.`
          : `${account.name} payment is due in ${days} day${days !== 1 ? 's' : ''}.`;
        new Notification('Accountable — Bill Due Soon', { body, icon: '/favicon.ico' });
        markNotified(account.id, account.dueDate!);
      }
    }

    notify();
  }, [accounts]);
}
