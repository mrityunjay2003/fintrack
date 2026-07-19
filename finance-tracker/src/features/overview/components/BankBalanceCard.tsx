import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BankBadge } from "@/components/shared/BankBadge";
import { AmountText } from "@/components/shared/AmountText";
import { Skeleton } from "@/components/ui/skeleton";
import type { Account } from "@/types";

interface BankBalanceCardProps {
  account?: Account & { monthChangePercent: number };
  loading?: boolean;
}

export function BankBalanceCard({ account, loading }: BankBalanceCardProps) {
  if (loading || !account) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-28 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = account.monthChangePercent >= 0;

  return (
    <Card className="overflow-hidden relative group">
      <CardHeader className="pb-2 relative z-10">
        <div className="flex justify-between items-center">
          <BankBadge accountId={account.id} showIcon />
          <span className="text-xs text-muted-foreground font-medium border border-border/50 px-2 py-0.5 rounded">
            ••• {account.mask}
          </span>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold mt-1">
          <AmountText amount={account.balance} />
        </div>
        <p className={`text-xs mt-1 font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(account.monthChangePercent)}% this month
        </p>
      </CardContent>
    </Card>
  );
}
