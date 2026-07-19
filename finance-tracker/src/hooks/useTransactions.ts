import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useGlobalDateRange } from "@/contexts/DateRangeContext";
import { api } from "@/lib/api";
import type { Transaction } from "@/types";

export function useTransactionsList(page = 1, pageSize = 50) {
  const { dateRange } = useGlobalDateRange();
  
  return useQuery({
    queryKey: ["transactions", dateRange, page, pageSize],
    queryFn: async () => {
      const params: any = { page, page_size: pageSize };
      if (dateRange?.from && dateRange?.to) {
        params.from_date = format(dateRange.from, "yyyy-MM-dd");
        params.to_date = format(dateRange.to, "yyyy-MM-dd");
      }
      const { data } = await api.get("/transactions", { params });
      return data.items; // Return just the items array for the table
    }
  });
}

export function useTransactionMutations() {
  const queryClient = useQueryClient();

  const updateTransaction = useMutation({
    mutationFn: async (payload: Partial<Transaction> & { id: string }) => {
      const { id, ...patchData } = payload;
      const { data } = await api.patch(`/transactions/${id}`, patchData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] }); // Refresh overview 
      queryClient.invalidateQueries({ queryKey: ["categorySpend"] });
    }
  });

  const addTransaction = useMutation({
    mutationFn: async (payload: Omit<Transaction, 'id'>) => {
      const { data } = await api.post("/transactions", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] }); // Refresh balances
    }
  });

  return { updateTransaction, addTransaction };
}