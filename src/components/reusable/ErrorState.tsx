import { AlertCircle, RefreshCw } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
  compact?: boolean;
  action?: ReactNode;
}

/**
 * Consistent error state used across all CRUD/list pages.
 * Surfaces a clear title, an actionable description, and a retry CTA.
 */
export function ErrorState({
  title = "Não foi possível carregar os dados",
  description = "Ocorreu um erro ao buscar as informações. Verifique sua conexão e tente novamente.",
  error,
  onRetry,
  compact = false,
  action,
}: ErrorStateProps) {
  const detail =
    error instanceof Error ? error.message : typeof error === "string" ? error : null;

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center px-4 text-center ${
        compact ? "py-10" : "py-16"
      } animate-fade-in-up`}
    >
      <div
        className={`rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 ${
          compact ? "w-12 h-12" : "w-16 h-16"
        }`}
      >
        <AlertCircle className={compact ? "h-6 w-6" : "h-8 w-8"} />
      </div>
      <h3
        className={`font-medium text-foreground mb-1 ${
          compact ? "text-base" : "text-lg"
        }`}
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {detail && (
        <p className="mt-2 text-xs text-muted-foreground/80 max-w-md font-mono break-words">
          {detail}
        </p>
      )}
      <div className="mt-4 flex items-center gap-2">
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Tentar novamente
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}