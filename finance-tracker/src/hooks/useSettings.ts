import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category } from "@/types";

export interface Rule {
  id: string;
  matchField: string;
  pattern: string;
  categoryId: string;
  category?: Category;
}

export function useSettingsData() {
  const accountsQuery = useQuery({
    queryKey: ["settings", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/accounts");
      return data;
    }
  });

  const categoriesQuery = useQuery({
    queryKey: ["settings", "categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    }
  });

  const rulesQuery = useQuery({
    queryKey: ["settings", "rules"],
    queryFn: async () => {
      const { data } = await api.get("/rules");
      return data;
    }
  });

  return { accountsQuery, categoriesQuery, rulesQuery };
}

export function useSettingsMutations() {
  const queryClient = useQueryClient();

  // --- ACCOUNTS ---
  const addAccount = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/accounts", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] }); // Refreshes the dashboard
    }
  });

  const updateAccount = useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...patch } = payload;
      const { data } = await api.patch(`/accounts/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    }
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/accounts/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    }
  });

  // --- CATEGORIES ---
  const addCategory = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/categories", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "categories"] })
  });

  const updateCategory = useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...patch } = payload;
      const { data } = await api.patch(`/categories/${id}`, patch);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "categories"] })
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/categories/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "categories"] })
  });

  // --- RULES ---
  const addRule = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/rules", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "rules"] })
  });

  const updateRule = useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...patch } = payload;
      const { data } = await api.patch(`/rules/${id}`, patch);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "rules"] })
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/rules/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "rules"] })
  });

  return {
    addAccount, updateAccount, deleteAccount,
    addCategory, updateCategory, deleteCategory,
    addRule, updateRule, deleteRule
  };
}