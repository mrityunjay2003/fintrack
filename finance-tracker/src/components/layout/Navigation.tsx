import { LayoutDashboard, ReceiptText, ArrowLeftRight, PieChart, Repeat, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ReceiptText },
  { label: "Import", href: "/import", icon: ArrowLeftRight },
  { label: "Budgets", href: "/budgets", icon: PieChart },
  { label: "Subscriptions", href: "/subscriptions", icon: Repeat },
  { label: "Settings", href: "/settings", icon: Settings },
];
