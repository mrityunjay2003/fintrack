import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useGlobalDateRange } from "@/contexts/DateRangeContext";
import { api } from "@/lib/api";

// Helper to safely format dates for the API
const getParams = (dateRange: any) => {
  if (!dateRange?.from || !dateRange?.to) return {};
  return {
    start: format(dateRange.from, "yyyy-MM-dd"),
    end: format(dateRange.to, "yyyy-MM-dd"),
  };
};

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await api.get("/overview/accounts");
      return data;
    }
  });
}

export function useKPIs() {
  const { dateRange } = useGlobalDateRange();
  return useQuery({
    queryKey: ["kpis", dateRange],
    queryFn: async () => {
      const { data } = await api.get("/overview/kpis", { params: getParams(dateRange) });
      return data;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });
}

export function useCategorySpend() {
  const { dateRange } = useGlobalDateRange();
  return useQuery({
    queryKey: ["categorySpend", dateRange],
    queryFn: async () => {
      const { data } = await api.get("/overview/category-spend", { params: getParams(dateRange) });
      return data;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });
}

export function useSpendTrend() {
  const { dateRange } = useGlobalDateRange();
  return useQuery({
    queryKey: ["spendTrend", dateRange],
    queryFn: async () => {
      const { data } = await api.get("/overview/trend", { params: getParams(dateRange) });
      return data;
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });
}

export function useDashboardTransactions() {
  return useQuery({
    queryKey: ["recentTransactions"],
    queryFn: async () => {
      // The backend handles the limits and related models (category/account) natively!
      const { data } = await api.get("/transactions", { params: { page_size: 5 } });
      return data.items; 
    }
  });
}

export function useBudgetMini() {
  return useQuery({
    queryKey: ["budgetMini"],
    queryFn: async () => {
      const currentMonth = format(new Date(), "yyyy-MM");
      const { data } = await api.get("/budgets", { params: { month: currentMonth } });
      return data;
    }
  });
}