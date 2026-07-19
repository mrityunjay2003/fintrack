import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmountText } from "./AmountText";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  amount: number;
  trend?: { value: number; isPositive: boolean };
  icon?: ReactNode;
  loading?: boolean;
}

export function StatCard({ title, amount, trend, icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-32 mb-1" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <AmountText amount={amount} />
        </div>
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
