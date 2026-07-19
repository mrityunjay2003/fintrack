import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// amount is in minor units (cents/paisa). e.g., 1000 = ₹10.00
export function formatMoney(amountMinorUnits: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountMinorUnits / 100)
}

export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy'): string {
  return format(new Date(date), formatStr)
}

// Single source of truth for bank identity
export function getAccountTheme(accountId: string) {
  const themes: Record<string, { label: string, colorClass: string, bgClass: string, borderClass: string }> = {
    'acc_hdfc_1': { 
      label: 'HDFC Checking', 
      colorClass: 'text-blue-700 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/30',
      borderClass: 'border-blue-200 dark:border-blue-900'
    },
    'acc_sbi_1': { 
      label: 'SBI Credit', 
      colorClass: 'text-indigo-700 dark:text-indigo-400',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/30',
      borderClass: 'border-indigo-200 dark:border-indigo-900'
    },
  }
  
  return themes[accountId] || { 
    label: 'Unknown', 
    colorClass: 'text-gray-700 dark:text-gray-400',
    bgClass: 'bg-gray-50 dark:bg-gray-900',
    borderClass: 'border-gray-200 dark:border-gray-800'
  }
}
