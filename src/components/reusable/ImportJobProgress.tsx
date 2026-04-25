import { Loader2, CheckCircle2, AlertTriangle, XCircle, Ban } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useImportJob, cancelImportJob, type ImportJobStatus } from "@/hooks/useImportJob";
import { toast } from "sonner";

const STATUS_LABEL: Record<ImportJobStatus, string> = {
  queued: "Na fila",
  parsing: "Lendo planilha",
  validating: "Validando",
  persisting: "Gravando",
  completed: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
};

function statusIcon(s: ImportJobStatus) {
  switch (s) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "failed":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "cancelled":
      return <Ban className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
  }
}

interface Props {
  jobId: string;
  onFinished?: () => void;
}

export function ImportJobProgress({ jobId, onFinished }: Props) {
  const { job, error, isTerminal } = useImportJob(jobId);

  const handleCancel = async () => {
    try {
      await cancelImportJob(jobId);
      toast.success("Cancelamento solicitado.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (error && !job) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }
  if (!job) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Aguardando job…
        </CardContent>
      </Card>
    );
  }

  if (isTerminal && onFinished) {
    // dispara callback uma vez por mudança de status terminal
    queueMicrotask(onFinished);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {statusIcon(job.status)}
          Importação assíncrona
          <Badge variant="outline" className="ml-2 text-xs">
            {STATUS_LABEL[job.status]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={job.progress_pct} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{job.current_step ?? "—"}</span>
          <span>{job.progress_pct}%</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Linhas: </span>
            <span className="text-foreground font-medium">
              {job.processed_rows}
              {job.total_rows ? ` / ${job.total_rows}` : ""}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Lotes: </span>
            <span className="text-foreground font-medium">
              {job.processed_chunks}
              {job.total_chunks ? ` / ${job.total_chunks}` : ""}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Inseridos: </span>
            <span className="text-foreground font-medium">{job.inserted_count}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Ignorados: </span>
            <span className="text-foreground font-medium">{job.skipped_count}</span>
          </div>
        </div>
        {job.error_message && (
          <p className="text-xs text-destructive flex items-start gap-1">
            <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
            {job.error_message}
          </p>
        )}
        {!isTerminal && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <Ban className="h-3 w-3 mr-1" /> Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}