import type { Account, Category, Transaction, Budget } from '../types';

export const mockAccounts: Account[] = [
  {
    id: 'acc_hdfc_1',
    name: 'Primary Checking',
    bankName: 'HDFC',
    type: 'checking',
    balance: 14500000, // ₹145,000.00
    mask: '4012'
  },
  {
    id: 'acc_sbi_1',
    name: 'Rewards Card',
    bankName: 'SBI',
    type: 'credit',
    balance: -2450000, // -₹24,500.00
    mask: '9088'
  }
];

export const mockCategories: Category[] = [
  { id: 'cat_housing', name: 'Housing', color: 'bg-emerald-500' },
  { id: 'cat_food', name: 'Food & Dining', color: 'bg-amber-500' },
  { id: 'cat_transport', name: 'Transportation', color: 'bg-sky-500' },
  { id: 'cat_utilities', name: 'Utilities', color: 'bg-purple-500' },
  { id: 'cat_income', name: 'Salary', color: 'bg-green-600' },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'txn_1',
    accountId: 'acc_hdfc_1',
    date: new Date().toISOString(),
    amount: 15500000, // ₹155,000.00
    type: 'income',
    label: 'Tech Corp Payroll',
    categoryId: 'cat_income',
  },
  {
    id: 'txn_2',
    accountId: 'acc_sbi_1',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    amount: -125000, // -₹1,250.00
    type: 'expense',
    label: 'Swiggy',
    categoryId: 'cat_food',
  },
  {
    id: 'txn_3',
    accountId: 'acc_hdfc_1',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    amount: -3500000, // -₹35,000.00
    type: 'expense',
    label: 'Landlord Rent',
    categoryId: 'cat_housing',
    isSubscription: true,
  },
  {
    id: 'txn_4',
    accountId: 'acc_sbi_1',
    date: new Date(Date.now() - 86400000 * 8).toISOString(),
    amount: -85000, // -₹850.00
    type: 'expense',
    label: 'Uber',
    categoryId: 'cat_transport',
  }
];

export const mockBudgets: Budget[] = [
  { categoryId: 'cat_food', amount: 1500000 }, // ₹15,000.00
  { categoryId: 'cat_transport', amount: 500000 }, // ₹5,000.00
];
