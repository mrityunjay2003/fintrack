import { cn, formatMoney } from "@/lib/utils";

interface AmountTextProps {
  amount: number; // minor units
  currency?: string;
  showSign?: boolean;
  className?: string;
  isExpense?: boolean; // Force red even if positive (useful for budget limits)
}

export function AmountText({ amount, currency = "INR", showSign = false, className, isExpense }: AmountTextProps) {
  const isNegative = amount < 0 || isExpense;
  const displayAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "+";

  return (
    <span className={cn(
      "font-medium tabular-nums tracking-tight",
      isNegative ? "text-foreground" : "text-foreground", // Default neutral for dense tables
      className
    )}>
      {showSign && sign}
      {formatMoney(displayAmount, currency)}
    </span>
  );
}
