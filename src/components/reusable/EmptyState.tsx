import { SearchX, Upload } from "lucide-react";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  /**
   * Atalho declarativo para um botão de ação principal que navega para uma rota.
   * Útil para casos como "Importar Dados" → "/importar".
   * Só é renderizado quando `action` (custom) NÃO for fornecido.
   */
  actionLabel?: string;
  actionRoute?: string;
  actionIcon?: ReactNode;
}

export function EmptyState({
  title = "Nenhum resultado encontrado",
  description = "Tente ajustar os filtros para ver mais dados.",
  icon,
  action,
  compact = false,
  actionLabel,
  actionRoute,
  actionIcon,
}: EmptyStateProps) {
  const builtAction =
    !action && actionLabel && actionRoute ? (
      <Button asChild size={compact ? "sm" : "default"}>
        <Link to={actionRoute}>
          {actionIcon ?? <Upload className="h-4 w-4 mr-1" />}
          {actionLabel}
        </Link>
      </Button>
    ) : null;

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 text-center ${compact ? "py-10" : "py-16"} animate-fade-in-up`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`rounded-full bg-muted/50 flex items-center justify-center mb-4 ${compact ? "w-12 h-12" : "w-16 h-16"}`}
      >
        {icon || (
          <SearchX
            className={compact ? "h-6 w-6 text-muted-foreground" : "h-8 w-8 text-muted-foreground"}
          />
        )}
      </div>
      <h3 className={`font-medium text-foreground mb-1 ${compact ? "text-base" : "text-lg"}`}>
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {(action || builtAction) && <div className="mt-4">{action ?? builtAction}</div>}
    </div>
  );
}
