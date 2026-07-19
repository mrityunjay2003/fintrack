import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BankBadge } from "@/components/shared/BankBadge";
import { AmountText } from "@/components/shared/AmountText";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { Search, ReceiptText } from "lucide-react";
import { useTransactionsList, useTransactionMutations } from "@/hooks/useTransactions";
import { useSettingsData } from "@/hooks/useSettings";

export function TransactionsView() {
  const { data: transactions, isLoading } = useTransactionsList();
  const { updateTransaction } = useTransactionMutations();
  const { categoriesQuery } = useSettingsData(); // <-- ADD THIS
  const [search, setSearch] = useState("");

  const filtered = transactions?.filter(t => t.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-500">
      
      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border/50 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[140px] h-9 bg-muted/50 border-transparent"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-12 text-center"><Checkbox /></TableHead>
                <TableHead className="w-28 text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="w-36 text-xs uppercase tracking-wider">Account</TableHead>
                <TableHead className="min-w-[200px] text-xs uppercase tracking-wider">Label</TableHead>
                <TableHead className="w-48 text-xs uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded-full" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                    <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <EmptyState icon={ReceiptText} title="No transactions found" description="Try adjusting your filters or date range." />
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map((txn) => (
                  <TableRow key={txn.id} className="group hover:bg-muted/10">
                    <TableCell className="text-center align-middle"><Checkbox className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100" /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(txn.date, "MMM d, yyyy")}</TableCell>
                    <TableCell><BankBadge accountId={txn.accountId} className="h-5 py-0 text-[10px]" /></TableCell>
                    <TableCell>
                      {/* Inline Editable Label */}
                      <Input 
                        defaultValue={txn.label}
                        onBlur={(e) => {
                          if (e.target.value !== txn.label) updateTransaction.mutate({ id: txn.id, label: e.target.value });
                        }}
                        className="h-7 px-2 text-sm border-transparent bg-transparent hover:border-input focus-visible:bg-background focus-visible:border-input shadow-none"
                      />
                    </TableCell>
                    <TableCell>
                      {/* Inline Editable Category */}
                      <Select 
                        defaultValue={txn.categoryId} 
                        onValueChange={(val) => updateTransaction.mutate({ id: txn.id, categoryId: val })}
                      >
                        <SelectTrigger className="h-7 px-2 text-sm border-transparent bg-transparent hover:border-input focus:ring-0 shadow-none data-[state=open]:border-input">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${txn.category?.color || 'bg-slate-400'}`} />
                            <span>{txn.category?.name || 'Uncategorized'}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesQuery.data?.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${c.color}`} />
                                {c.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right align-middle pr-4">
                      <AmountText amount={txn.amount} isExpense={txn.type === 'expense'} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}