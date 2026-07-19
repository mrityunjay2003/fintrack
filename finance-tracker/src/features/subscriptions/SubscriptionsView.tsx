import { Repeat, CalendarClock, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AmountText } from "@/components/shared/AmountText";
import { BankBadge } from "@/components/shared/BankBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { useSubscriptionsList, useSubscriptionMutations } from "@/hooks/useSubscriptions";

export function SubscriptionsView() {
  const { data: subscriptions, isLoading } = useSubscriptionsList();
  const { updateStatus } = useSubscriptionMutations();

  // Calculate totals (normalized to monthly and yearly)
  const stats = subscriptions?.reduce((acc, sub) => {
    if (sub.status === 'pending') return acc; // Only count active towards totals
    
    const monthlyAmount = sub.cadence === 'yearly' ? sub.amount / 12 : sub.cadence === 'weekly' ? sub.amount * 4.33 : sub.amount;
    const yearlyAmount = sub.cadence === 'monthly' ? sub.amount * 12 : sub.cadence === 'weekly' ? sub.amount * 52 : sub.amount;
    
    return {
      monthly: acc.monthly + monthlyAmount,
      yearly: acc.yearly + yearlyAmount
    };
  }, { monthly: 0, yearly: 0 }) || { monthly: 0, yearly: 0 };

  const pendingCount = subscriptions?.filter(s => s.status === 'pending').length || 0;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      
      {/* Header & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 flex flex-col justify-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Manage your recurring expenses.</p>
        </div>
        
        <Card className="bg-primary text-primary-foreground border-transparent">
          <CardHeader className="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Monthly Run Rate</CardTitle>
            <Repeat className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32 bg-primary-foreground/20" /> : (
              <div className="text-2xl font-bold"><AmountText amount={stats.monthly} /></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annualized Total</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold"><AmountText amount={stats.yearly} /></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Triage Alert */}
      {pendingCount > 0 && !isLoading && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-amber-800 dark:text-amber-300">
            <strong>{pendingCount} new recurring charges detected.</strong> Review them below to ensure your run rate is accurate.
          </p>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-48 text-xs uppercase tracking-wider">Merchant</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Next Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Cadence</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Account</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="w-32 text-center text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : subscriptions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <EmptyState icon={Repeat} title="No subscriptions found" description="We couldn't detect any recurring expenses." />
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions?.map((sub) => {
                  const isPending = sub.status === 'pending';
                  
                  return (
                    <TableRow key={sub.id} className={`group ${isPending ? 'bg-muted/10' : ''}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {sub.merchant}
                          {isPending && <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">Detected</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(sub.nextDate, "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <span className="text-xs capitalize font-medium text-muted-foreground border border-border/50 bg-secondary/50 px-2 py-1 rounded-md">
                          {sub.cadence}
                        </span>
                      </TableCell>
                      <TableCell><BankBadge accountId={sub.accountId} className="h-5 py-0 text-[10px]" /></TableCell>
                      <TableCell className="text-right align-middle">
                        <AmountText amount={sub.amount} isExpense={true} />
                      </TableCell>
                      <TableCell className="text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              onClick={() => updateStatus.mutate({ id: sub.id, status: 'active' })}
                              title="Confirm Subscription"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => updateStatus.mutate({ id: sub.id, status: 'dismissed' })}
                              title="Dismiss (Not recurring)"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground border-transparent">
                            Confirmed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}