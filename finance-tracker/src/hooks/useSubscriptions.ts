import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSubscriptionsList() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data } = await api.get("/subscriptions");
      // The main view filters out dismissed locally
      return data.filter((s: any) => s.status !== 'dismissed');
    }
  });
}

export function useSubscriptionMutations() {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'active' | 'dismissed' }) => {
      const { data } = await api.patch(`/subscriptions/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    }
  });

  return { updateStatus };
}