export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  bankName: string;
  type: 'checking' | 'credit' | 'savings';
  balance: number; // Stored in minor units (paisa)
  mask: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // ISO 8601 YYYY-MM-DD
  amount: number; // Stored in minor units (paisa). Positive for income/refunds, negative for expenses.
  type: TransactionType;
  label: string;
  categoryId: string;
  notes?: string;
  isSubscription?: boolean;
}

export interface Budget {
  categoryId: string;
  amount: number; // Minor units
}