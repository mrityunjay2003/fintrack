import { Lightbulb, TrendingUp, TrendingDown, Landmark, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/StatCard";
import { BankBadge } from "@/components/shared/BankBadge";
import { CategoryChip } from "@/components/shared/CategoryChip";
import { AmountText } from "@/components/shared/AmountText";
import { TrendChart } from "@/components/shared/charts/TrendChart";
import { DonutChart } from "@/components/shared/charts/DonutChart";
import { formatDate } from "@/lib/utils";
import { BankBalanceCard } from "./components/BankBalanceCard";
import { 
  useAccounts, 
  useKPIs, 
  useCategorySpend, 
  useSpendTrend, 
  useDashboardTransactions, 
  useBudgetMini 
} from "@/hooks/useOverview";

export function OverviewDashboard() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: kpis, isLoading: kpisLoading } = useKPIs();
  const { data: categorySpend, isLoading: catLoading } = useCategorySpend();
  const { data: trendData, isLoading: trendLoading } = useSpendTrend();
  const { data: recentTxns, isLoading: txnsLoading } = useDashboardTransactions();
  const { data: budgets, isLoading: budgetsLoading } = useBudgetMini();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      
      {/* Insights Strip */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-300">
        <Lightbulb className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <p><strong>Insight:</strong> Dining spend is up 32% compared to last month. You have 2 recurring renewals coming up this week.</p>
      </div>

      {/* Accounts & KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accountsLoading ? (
          <>
            <BankBalanceCard loading />
            <BankBalanceCard loading />
          </>
        ) : (
          accounts?.map(acc => (
            <BankBalanceCard key={acc.id} account={acc} />
          ))
        )}
        
        <StatCard 
          title="Total Income" 
          amount={kpis?.income || 0} 
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} 
          loading={kpisLoading} 
        />
        <StatCard 
          title="Total Expenses" 
          amount={kpis?.expense || 0} 
          icon={<TrendingDown className="h-4 w-4 text-rose-500" />} 
          loading={kpisLoading} 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spending Trend</CardTitle>
            <CardDescription>Net outgoing funds across all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="h-[250px] w-full bg-muted/20 animate-pulse rounded-md" />
            ) : (
              <TrendChart data={trendData || []} xKey="date" series={[{ key: 'amount', colorHex: '#8b5cf6' }]} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
            <CardDescription>Where your money went</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {catLoading ? (
              <div className="h-[250px] w-[250px] rounded-full bg-muted/20 animate-pulse mt-4" />
            ) : (
              <DonutChart data={categorySpend || []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
            </div>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-0">
            {txnsLoading ? (
              <div className="space-y-4 px-6 pt-2">
                {[1,2,3,4].map(i => <div key={i} className="h-10 bg-muted/20 animate-pulse rounded-md" />)}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentTxns?.map(txn => (
                  <div key={txn.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium">{txn.label}</span>
                      <div className="flex items-center gap-2">
                        <BankBadge accountId={txn.accountId} className="text-[10px] py-0 h-5" />
                        <CategoryChip category={txn.category} className="text-[10px] py-0 h-5" />
                        <span className="text-xs text-muted-foreground ml-1">{formatDate(txn.date, "MMM d")}</span>
                      </div>
                    </div>
                    <AmountText amount={txn.amount} isExpense={txn.type === 'expense'} className="text-sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Budget Tracking</CardTitle>
            </div>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            {budgetsLoading ? (
               <div className="space-y-6">
                 {[1,2,3].map(i => <div key={i} className="h-8 bg-muted/20 animate-pulse rounded-md" />)}
               </div>
            ) : (
              <div className="space-y-6">
                {budgets?.map(budget => {
                  const percent = Math.min(100, (budget.spent / budget.amount) * 100);
                  const isOver = percent >= 100;
                  return (
                    <div key={budget.categoryId} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${budget.category.color}`} />
                          <span className="font-medium">{budget.category.name}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                          <AmountText amount={budget.spent} />
                          <span className="text-muted-foreground">/</span>
                          <AmountText amount={budget.amount} className="text-muted-foreground text-xs" />
                        </div>
                      </div>
                      <Progress value={percent} className={`h-2 ${isOver ? '[&>div]:bg-rose-500' : ''}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
