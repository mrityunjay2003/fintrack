import { Badge } from "@/components/ui/badge";
import { getAccountTheme, cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

interface BankBadgeProps {
  accountId: string;
  className?: string;
  showIcon?: boolean;
}

export function BankBadge({ accountId, className, showIcon = false }: BankBadgeProps) {
  const theme = getAccountTheme(accountId);

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-normal",
        theme.bgClass,
        theme.colorClass,
        theme.borderClass,
        className
      )}
    >
      {showIcon && <Wallet className="w-3 h-3 mr-1.5 opacity-70" />}
      {theme.label}
    </Badge>
  );
}
