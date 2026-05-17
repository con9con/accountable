import type { Account, Payment, BalanceEntry } from '@/types';

// Shape returned by the API (numeric fields come back as strings from Postgres)
interface RawAccount {
  id: string; userId: string; type: string; name: string; issuer: string | null;
  totalDue: string; minimumDue: string; interestRate: string;
  dueDate: string | null; originalBalance: string | null; notes: string | null;
  createdAt: string; updatedAt: string;
  balanceHistory: { id: string; accountId: string; date: string; balance: string }[];
}

interface RawPayment {
  id: string; userId: string; accountId: string;
  amount: string; date: string; note: string | null; createdAt: string;
}

function parseAccount(r: RawAccount): Account {
  return {
    id: r.id,
    type: r.type as Account['type'],
    name: r.name,
    issuer: r.issuer ?? undefined,
    totalDue: Number(r.totalDue),
    minimumDue: Number(r.minimumDue),
    interestRate: Number(r.interestRate),
    dueDate: r.dueDate ?? undefined,
    originalBalance: r.originalBalance ? Number(r.originalBalance) : undefined,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    balanceHistory: r.balanceHistory
      .map((h): BalanceEntry => ({ date: h.date, balance: Number(h.balance) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function parsePayment(r: RawPayment): Payment {
  return {
    id: r.id,
    accountId: r.accountId,
    amount: Number(r.amount),
    date: r.date,
    note: r.note ?? undefined,
  };
}

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

export async function fetchAccounts(token: string): Promise<Account[]> {
  const data = await apiFetch('/api/accounts', token);
  return (data as RawAccount[]).map(parseAccount);
}

export async function createAccount(token: string, account: Omit<Account, 'createdAt' | 'updatedAt' | 'balanceHistory'>): Promise<Account> {
  const data = await apiFetch('/api/accounts', token, {
    method: 'POST',
    body: JSON.stringify(account),
  });
  return parseAccount(data as RawAccount);
}

export async function updateAccount(token: string, id: string, updates: Partial<Account>): Promise<Account> {
  const data = await apiFetch(`/api/accounts/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return parseAccount(data as RawAccount);
}

export async function deleteAccount(token: string, id: string): Promise<void> {
  await apiFetch(`/api/accounts/${id}`, token, { method: 'DELETE' });
}

export async function fetchPayments(token: string): Promise<Payment[]> {
  const data = await apiFetch('/api/payments', token);
  return (data as RawPayment[]).map(parsePayment);
}

export async function createPayment(token: string, payment: Omit<Payment, 'createdAt'>): Promise<Payment> {
  const data = await apiFetch('/api/payments', token, {
    method: 'POST',
    body: JSON.stringify(payment),
  });
  return parsePayment(data as RawPayment);
}

export async function deletePayment(token: string, id: string): Promise<void> {
  await apiFetch(`/api/payments/${id}`, token, { method: 'DELETE' });
}
