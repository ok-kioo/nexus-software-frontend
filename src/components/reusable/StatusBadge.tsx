import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  "Ativa": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Completa": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Abaixo do mínimo": "bg-red-500/15 text-red-400 border-red-500/20",
  "Concluído": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Erro": "bg-red-500/15 text-red-400 border-red-500/20",
  "Processando": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "PDF": "bg-red-500/15 text-red-400 border-red-500/20",
  "Excel": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium", variants[status] || "bg-muted text-muted-foreground border-border")}>
      {status}
    </span>
  );
}
