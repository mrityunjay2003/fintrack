import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { DateRangePicker } from "../shared/DateRangePicker";
import { TransactionFormModal } from "@/features/transactions/components/TransactionFormModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./Navigation";

export function AppLayout() {
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">Vault</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                location.pathname === item.href 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold md:hidden">Vault</h2>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker className="hidden sm:grid" />
            <Button size="sm" className="rounded-full md:rounded-md h-9 px-4" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Add Transaction</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                location.pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <TransactionFormModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </div>
  );
}