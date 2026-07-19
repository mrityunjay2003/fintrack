import { useState } from "react";
import { Plus, PieChart, AlertCircle, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AmountText } from "@/components/shared/AmountText";
import { EmptyState } from "@/components/shared/EmptyState";
import { BudgetFormModal } from "./components/BudgetFormModal";
import { useBudgetsList } from "@/hooks/useBudgets";
import type { Budget } from "@/types";

export function BudgetsView() {
  const { data: budgets, isLoading } = useBudgetsList();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your spending limits for the selected period.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          // Loading Skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></div>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))
        ) : budgets?.length === 0 ? (
          <div className="col-span-full py-12 border rounded-xl border-dashed border-border bg-card/50">
            <EmptyState 
              icon={PieChart} 
              title="No budgets set" 
              description="Create a budget to keep your spending in check."
              action={<Button variant="outline" onClick={openCreateModal}>Create First Budget</Button>}
            />
          </div>
        ) : (
          budgets?.map(budget => {
            const utilization = (budget.spent / budget.amount) * 100;
            const percentClamped = Math.min(100, Math.max(0, utilization));
            const isOver = utilization > 100;
            const isWarning = utilization > 85 && !isOver;

            return (
              <Card key={budget.categoryId} className={`relative overflow-hidden transition-colors ${isOver ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${budget.category.color}`} />
                    <CardTitle className="text-base">{budget.category.name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground" onClick={() => openEditModal(budget)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  
                  {/* Amounts Row */}
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold flex items-center gap-2">
                        <AmountText amount={budget.spent} className={isOver ? "text-rose-600 dark:text-rose-400" : ""} />
                        {isOver && <AlertCircle className="h-5 w-5 text-rose-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">spent of <AmountText amount={budget.amount} /> limit</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {isOver ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            <AmountText amount={budget.spent - budget.amount} showSign /> over
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            <AmountText amount={budget.amount - budget.spent} /> left
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{utilization.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <Progress 
                    value={percentClamped} 
                    className={`h-2 ${isOver ? '[&>div]:bg-rose-500' : isWarning ? '[&>div]:bg-amber-500' : `[&>div]:${budget.category.color}`}`}
                  />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <BudgetFormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        budgetToEdit={editingBudget} 
      />
    </div>
  );
}