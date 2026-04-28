import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useActiveImportJob } from "@/contexts/ImportJobContext";
import { TERMINAL_STATUSES } from "@/hooks/useImportJob";

/**
 * Indicador discreto na sidebar mostrando que existe uma importação assíncrona
 * em andamento. Aparece apenas quando há job ativo (não terminal).
 * Alimentado pelo provider global — sem polling.
 */
export function SidebarImportIndicator() {
  const { activeJob } = useActiveImportJob();
  if (!activeJob) return null;
  if (TERMINAL_STATUSES.includes(activeJob.status)) return null;

  return (
    <Link
      to="/importar"
      className="mx-2 mb-2 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-xs text-foreground hover:bg-primary/10 transition-colors"
      aria-label={`Importação em andamento: ${activeJob.progress_pct}%`}
    >
      <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
      <span className="truncate flex-1">Importando… {activeJob.progress_pct}%</span>
    </Link>
  );
}
