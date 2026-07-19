import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { OverviewDashboard } from "./features/overview/OverviewDashboard";
import { TransactionsView } from "./features/transactions/TransactionsView";
import { ImportView } from "./features/import/ImportView";
import { BudgetsView } from "./features/budgets/BudgetsView";
import { SubscriptionsView } from "./features/subscriptions/SubscriptionsView";
import { SettingsView } from "./features/settings/SettingsView";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <OverviewDashboard /> },
      { path: "transactions", element: <TransactionsView /> },
      { path: "import", element: <ImportView /> },
      { path: "budgets", element: <BudgetsView /> },
      { path: "subscriptions", element: <SubscriptionsView /> },
      { path: "settings", element: <SettingsView /> },
    ],
  },
]);