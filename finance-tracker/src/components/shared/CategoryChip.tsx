import type{ Category } from "@/types";
import { cn } from "@/lib/utils";

export function CategoryChip({ category, className }: { category: Category; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/50 border border-border/50 text-xs text-muted-foreground", className)}>
      <span className={cn("w-2 h-2 rounded-full", category?.color || 'bg-slate-400')} />
      {category?.name || 'Uncategorized'}
    </div>
  );
}
