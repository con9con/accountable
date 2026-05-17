import type { Account, Payment } from '@/types';

const now = new Date().toISOString();

export const demoAccounts: Omit<Account, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'demo-1',
    type: 'credit_card',
    name: 'Chase Sapphire',
    totalDue: 4250.75,
    minimumDue: 85,
    interestRate: 24.99,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    originalBalance: 5500,
    notes: 'Primary travel card',
    balanceHistory: [
      { date: '2026-01-15', balance: 5500 },
      { date: '2026-02-01', balance: 5200 },
      { date: '2026-03-01', balance: 4900 },
      { date: '2026-04-01', balance: 4535.75 },
      { date: '2026-05-01', balance: 4250.75 },
    ],
  },
  {
    id: 'demo-2',
    type: 'credit_card',
    name: 'Apple Card',
    totalDue: 1830.42,
    minimumDue: 37,
    interestRate: 19.99,
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    originalBalance: 2500,
    balanceHistory: [
      { date: '2026-01-15', balance: 2500 },
      { date: '2026-02-15', balance: 2300 },
      { date: '2026-03-15', balance: 2050 },
      { date: '2026-04-28', balance: 1930.42 },
      { date: '2026-05-01', balance: 1830.42 },
    ],
  },
  {
    id: 'demo-3',
    type: 'credit_card',
    name: 'Discover It',
    totalDue: 620.00,
    minimumDue: 25,
    interestRate: 22.49,
    originalBalance: 800,
    balanceHistory: [
      { date: '2026-02-01', balance: 800 },
      { date: '2026-03-15', balance: 720 },
      { date: '2026-04-15', balance: 670 },
      { date: '2026-05-01', balance: 620 },
    ],
  },
  {
    id: 'demo-4',
    type: 'car_loan',
    name: '2022 Honda Accord',
    totalDue: 18450.00,
    minimumDue: 412,
    interestRate: 5.9,
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    originalBalance: 22000,
    notes: '60-month loan, started Jan 2024',
    balanceHistory: [
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
    totalDue: 7200.00,
    minimumDue: 215,
    interestRate: 11.5,
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    originalBalance: 9000,
    notes: 'Home improvement project',
    balanceHistory: [
      { date: '2026-01-01', balance: 8785 },
      { date: '2026-02-01', balance: 8355 },
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
  { id: 'dp-4', accountId: 'demo-2', amount: 100, date: '2026-04-28', note: 'Extra payment' },
  { id: 'dp-5', accountId: 'demo-1', amount: 364.25, date: '2026-04-01', note: 'Monthly payment' },
  { id: 'dp-6', accountId: 'demo-3', amount: 50, date: '2026-05-01' },
];

export function buildDemoState() {
  const accounts: Account[] = demoAccounts.map((a) => ({
    ...a,
    createdAt: now,
    updatedAt: now,
  }));
  return { accounts, payments: demoPayments };
}
