import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatCurrencyShort(v: number): string {
  if (v >= 1000) return '$' + (v / 1000).toFixed(1).replace('.0', '') + 'k';
  return formatCurrency(v);
}

export function formatDate(s: string): string {
  return new Date(s + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(s: string): string {
  return new Date(s + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function daysUntil(s?: string): number | null {
  if (!s) return null;
  const d = new Date(s + 'T00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function isDueSoon(dueDateStr?: string): boolean {
  const d = daysUntil(dueDateStr);
  return d !== null && d >= 0 && d <= 7;
}

export function isPastDue(dueDateStr?: string): boolean {
  const d = daysUntil(dueDateStr);
  return d !== null && d < 0;
}

export function fmtMonths(m: number): string {
  const y = Math.floor(m / 12);
  const mo = m % 12;
  return [y ? y + 'y' : '', mo ? mo + 'mo' : ''].filter(Boolean).join(' ') || '0mo';
}

export interface PayoffResult {
  months: number;
  date: Date;
}

export function projectPayoffDate(balance: number, monthlyPayment: number, apr: number): PayoffResult | null {
  if (monthlyPayment <= 0 || balance <= 0) return null;
  const r = apr / 100 / 12;
  if (r === 0) {
    const months = Math.ceil(balance / monthlyPayment);
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return { months, date: d };
  }
  if (monthlyPayment <= balance * r) return null;
  const months = Math.ceil(Math.log(monthlyPayment / (monthlyPayment - balance * r)) / Math.log(1 + r));
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return { months, date: d };
}

export interface PayoffAccountResult {
  id: string;
  name: string;
  months: number;
  interestPaid: number;
  order: number;
}

export interface PayoffCalcResult {
  totalMonths: number;
  totalInterest: number;
  debtFreeDate: Date;
  accounts: PayoffAccountResult[];
  monthly: { month: number; balance: number }[];
}

export function calculatePayoff(
  accounts: { id: string; name: string; totalDue: number; minimumDue: number; interestRate: number }[],
  extraPayment = 0,
  strategy: 'avalanche' | 'snowball' = 'avalanche'
): PayoffCalcResult | null {
  if (accounts.length === 0) return null;
  const totalMin = accounts.reduce((s, a) => s + a.minimumDue, 0);
  const budget = totalMin + extraPayment;

  const debts = accounts.map((a, i) => ({
    ...a,
    balance: a.totalDue,
    rate: a.interestRate / 100 / 12,
    minPayment: a.minimumDue,
    order: i,
    monthsPaid: 0,
    interestPaid: 0,
  }));

  const results: PayoffAccountResult[] = [];
  const monthly: { month: number; balance: number }[] = [];
  let month = 0;
  const MAX_MONTHS = 600;

  while (debts.some((d) => d.balance > 0) && month < MAX_MONTHS) {
    month++;
    // sort for focus account
    const active = debts.filter((d) => d.balance > 0);
    if (strategy === 'avalanche') active.sort((a, b) => b.interestRate - a.interestRate);
    else active.sort((a, b) => a.balance - b.balance);

    // apply interest
    for (const d of active) {
      d.interestPaid += d.balance * d.rate;
      d.balance = d.balance * (1 + d.rate);
    }

    // pay minimums
    let remaining = budget;
    for (const d of active) {
      const pay = Math.min(d.balance, d.minPayment);
      d.balance -= pay;
      remaining -= pay;
      if (d.balance <= 0) {
        d.balance = 0;
        results.push({ id: d.id, name: d.name, months: month, interestPaid: d.interestPaid, order: results.length + 1 });
      }
    }

    // apply extra to focus account
    const focus = active.find((d) => d.balance > 0);
    if (focus && remaining > 0) {
      const pay = Math.min(focus.balance, remaining);
      focus.balance -= pay;
      if (focus.balance <= 0) {
        focus.balance = 0;
        if (!results.find((r) => r.id === focus.id)) {
          results.push({ id: focus.id, name: focus.name, months: month, interestPaid: focus.interestPaid, order: results.length + 1 });
        }
      }
    }

    monthly.push({ month, balance: debts.reduce((s, d) => s + d.balance, 0) });
  }

  const totalInterest = debts.reduce((s, d) => s + d.interestPaid, 0);
  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

  return { totalMonths: month, totalInterest, debtFreeDate, accounts: results, monthly };
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r =
      typeof crypto !== 'undefined' && crypto.getRandomValues
        ? crypto.getRandomValues(new Uint8Array(1))[0] % 16
        : ((Math.random() * 16) | 0);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
