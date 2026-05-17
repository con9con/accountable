import type { Account, Payment } from '@/types';

const now = new Date().toISOString();

export const demoAccounts: Omit<Account, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'demo-1',
    type: 'credit_card',
    name: 'Chase Sapphire',
    issuer: 'Chase',
    totalDue: 4250.75,
    minimumDue: 85,
    interestRate: 24.99,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    originalBalance: 5500,
    notes: 'Primary travel card',
    balanceHistory: [
      { date: '2025-11-01', balance: 5500 },
      { date: '2025-12-01', balance: 5320 },
      { date: '2026-01-01', balance: 5100 },
      { date: '2026-02-01', balance: 4880 },
      { date: '2026-03-01', balance: 4620 },
      { date: '2026-04-01', balance: 4435.75 },
      { date: '2026-05-01', balance: 4250.75 },
    ],
  },
  {
    id: 'demo-2',
    type: 'credit_card',
    name: 'Apple Card',
    issuer: 'Goldman Sachs',
    totalDue: 1830.42,
    minimumDue: 37,
    interestRate: 19.99,
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    originalBalance: 2500,
    balanceHistory: [
      { date: '2025-12-01', balance: 2500 },
      { date: '2026-01-15', balance: 2350 },
      { date: '2026-02-15', balance: 2150 },
      { date: '2026-03-15', balance: 2000 },
      { date: '2026-04-15', balance: 1930.42 },
      { date: '2026-05-01', balance: 1830.42 },
    ],
  },
  {
    id: 'demo-3',
    type: 'credit_card',
    name: 'Discover It',
    issuer: 'Discover',
    totalDue: 620.00,
    minimumDue: 25,
    interestRate: 22.49,
    originalBalance: 1000,
    balanceHistory: [
      { date: '2025-11-01', balance: 1000 },
      { date: '2025-12-01', balance: 900 },
      { date: '2026-01-01', balance: 820 },
      { date: '2026-02-01', balance: 750 },
      { date: '2026-03-01', balance: 700 },
      { date: '2026-04-01', balance: 660 },
      { date: '2026-05-01', balance: 620 },
    ],
  },
  {
    id: 'demo-4',
    type: 'car_loan',
    name: '2022 Honda Accord',
    issuer: 'Honda Financial',
    totalDue: 18450.00,
    minimumDue: 412,
    interestRate: 5.9,
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    originalBalance: 24000,
    notes: '60-month loan, started Jan 2022',
    balanceHistory: [
      { date: '2025-11-01', balance: 20500 },
      { date: '2025-12-01', balance: 20090 },
      { date: '2026-01-01', balance: 19686 },
      { date: '2026-02-01', balance: 19274 },
      { date: '2026-03-01', balance: 18860 },
      { date: '2026-04-01', balance: 18450 },
      { date: '2026-05-01', balance: 18450 },
    ],
  },
  {
    id: 'demo-5',
    type: 'personal_loan',
    name: 'SoFi Personal Loan',
    issuer: 'SoFi',
    totalDue: 7200.00,
    minimumDue: 215,
    interestRate: 11.5,
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    originalBalance: 9000,
    notes: 'Home improvement project',
    balanceHistory: [
      { date: '2025-11-01', balance: 9000 },
      { date: '2025-12-01', balance: 8785 },
      { date: '2026-01-01', balance: 8570 },
      { date: '2026-02-01', balance: 8140 },
      { date: '2026-03-01', balance: 7855 },
      { date: '2026-04-01', balance: 7415 },
      { date: '2026-05-01', balance: 7200 },
    ],
  },
];

export const demoPayments: Payment[] = [
  { id: 'dp-1', accountId: 'demo-1', amount: 285, date: '2026-05-01', note: 'Monthly payment' },
  { id: 'dp-2', accountId: 'demo-4', amount: 412, date: '2026-05-01', note: 'Monthly payment' },
  { id: 'dp-3', accountId: 'demo-5', amount: 215, date: '2026-05-01', note: 'Monthly payment' },
  { id: 'dp-4', accountId: 'demo-2', amount: 100, date: '2026-04-15', note: 'Extra payment' },
  { id: 'dp-5', accountId: 'demo-1', amount: 185, date: '2026-04-01', note: 'Monthly payment' },
  { id: 'dp-6', accountId: 'demo-3', amount: 80, date: '2026-05-01' },
  { id: 'dp-7', accountId: 'demo-1', amount: 220, date: '2026-03-01', note: 'Monthly payment' },
  { id: 'dp-8', accountId: 'demo-4', amount: 412, date: '2026-04-01', note: 'Monthly payment' },
];

export function buildDemoState() {
  const accounts: Account[] = demoAccounts.map((a) => ({
    ...a,
    createdAt: now,
    updatedAt: now,
  }));
  return { accounts, payments: demoPayments };
}
