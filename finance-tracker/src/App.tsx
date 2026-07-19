import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DateRangeProvider } from "./contexts/DateRangeContext";
import { router } from "./router";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DateRangeProvider>
        <RouterProvider router={router} />
      </DateRangeProvider>
    </QueryClientProvider>
  );
}