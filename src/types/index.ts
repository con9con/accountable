export type AccountType = 'credit_card' | 'car_loan' | 'personal_loan';

export interface BalanceEntry {
  date: string;
  balance: number;
}

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  totalDue: number;
  minimumDue: number;
  interestRate: number;
  dueDate?: string;
  originalBalance?: number;
  notes?: string;
  balanceHistory?: BalanceEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  note?: string;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  credit_card: 'Credit Card',
  car_loan: 'Car Loan',
  personal_loan: 'Personal Loan',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  credit_card: 'blue',
  car_loan: 'green',
  personal_loan: 'purple',
};
