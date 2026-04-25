import { SearchX } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  title = "Nenhum resultado encontrado",
  description = "Tente ajustar os filtros para ver mais dados.",
  icon,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 text-center ${compact ? "py-10" : "py-16"} animate-fade-in-up`}>
      <div className={`rounded-full bg-muted/50 flex items-center justify-center mb-4 ${compact ? "w-12 h-12" : "w-16 h-16"}`}>
        {icon || <SearchX className={compact ? "h-6 w-6 text-muted-foreground" : "h-8 w-8 text-muted-foreground"} />}
      </div>
      <h3 className={`font-medium text-foreground mb-1 ${compact ? "text-base" : "text-lg"}`}>{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
