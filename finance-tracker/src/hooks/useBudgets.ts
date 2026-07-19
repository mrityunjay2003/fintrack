import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useGlobalDateRange } from "@/contexts/DateRangeContext";
import { api } from "@/lib/api";
import type { Budget } from "@/types";

export function useBudgetsList() {
  const { dateRange } = useGlobalDateRange();
  
  return useQuery({
    queryKey: ["budgets", dateRange],
    queryFn: async () => {
      // Use the selected date range month, or default to current month
      const month = dateRange?.from ? format(dateRange.from, "yyyy-MM") : format(new Date(), "yyyy-MM");
      const { data } = await api.get("/budgets", { params: { month } });
      
      // Sort by highest utilization percentage first
      return data.sort((a: Budget, b: Budget) => ((b.spent || 0) / b.amount) - ((a.spent || 0) / a.amount));
    }
  });
}

export function useBudgetMutations() {
  const queryClient = useQueryClient();

  const saveBudget = useMutation({
    mutationFn: async (payload: Budget) => {
      const currentMonth = format(new Date(), "yyyy-MM");
      const { data } = await api.post("/budgets", { ...payload, month: currentMonth });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budgetMini"] }); 
    }
  });

  return { saveBudget };
}