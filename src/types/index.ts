export type AccountType = 'credit_card' | 'car_loan' | 'personal_loan' | 'student_loan' | 'mortgage';

export interface BalanceEntry {
  date: string;
  balance: number;
}

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  issuer?: string;
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

export interface Toast {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'info';
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  credit_card: 'Credit Card',
  car_loan: 'Car Loan',
  personal_loan: 'Personal Loan',
  student_loan: 'Student Loan',
  mortgage: 'Mortgage',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  credit_card: '#2563EB',
  car_loan: '#16A34A',
  personal_loan: '#7C3AED',
  student_loan: '#D97706',
  mortgage: '#0891B2',
};

export const ACCOUNT_TYPES: { key: AccountType; label: string; color: string; icon: string }[] = [
  { key: 'credit_card',   label: 'Credit Card',    color: '#2563EB', icon: 'card' },
  { key: 'car_loan',      label: 'Car Loan',        color: '#16A34A', icon: 'car' },
  { key: 'personal_loan', label: 'Personal Loan',   color: '#7C3AED', icon: 'person' },
  { key: 'student_loan',  label: 'Student Loan',    color: '#D97706', icon: 'graduation' },
  { key: 'mortgage',      label: 'Mortgage',        color: '#0891B2', icon: 'home2' },
];
