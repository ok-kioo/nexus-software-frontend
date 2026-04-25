import { useMemo, useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Check,
  AlertTriangle,
  X,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { StatusBadge } from "@/components/reusable/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  ENTITIES,
  ENTITY_ORDER,
  EntityKey,
} from "@/lib/importacao/schema";
import {
  ColumnMap,
  ParsedSheet,
  ParsedWorkbook,
  SheetValidationResult,
  buildInitialMappings,
  checkInitialDeploymentReady,
  downloadOfficialTemplate,
  parseExcelFile,
  validateSheet,
} from "@/lib/importacao/excel";
import { persistImport } from "@/lib/importacao/persist";
import { useQueryClient } from "@tanstack/react-query";
import { startBackendImport } from "@/hooks/useImportJob";
import { ImportJobProgress } from "@/components/reusable/ImportJobProgress";

const STORAGE_KEY = "nexus-initial-import-done";

type Step = "upload" | "review" | "validation" | "done";

interface SheetState extends ParsedSheet {
  assignedEntity: EntityKey | null;
  mappings: ColumnMap[];
  include: boolean;
}

export default function Importar() {
  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [sheets, setSheets] = useState<SheetState[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [validations, setValidations] = useState<
    Record<number, SheetValidationResult>
  >({});
  const [importing, setImporting] = useState(false);
  const [backendJobId, setBackendJobId] = useState<string | null>(null);
  const [submittingBackend, setSubmittingBackend] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const isInitialImport =
    typeof window !== "undefined" &&
    localStorage.getItem(STORAGE_KEY) !== "true";

  // ── Upload ─────────────────────────────────────────────
  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls"].includes(ext)) {
      toast.error("Formato inválido. Envie apenas planilhas .xlsx ou .xls.");
      return;
    }
    setParsing(true);
    setProgress(15);
    try {
      // pequena animação de progresso
      const tick = setInterval(
        () => setProgress((p) => Math.min(p + 12, 85)),
        120,
      );
      const wb = await parseExcelFile(file);
      clearInterval(tick);
      setProgress(100);

      const initial: SheetState[] = wb.sheets.map((s) => ({
        ...s,
        assignedEntity: s.detectedEntity,
        mappings: buildInitialMappings(s.headers, s.detectedEntity),
        include: !!s.detectedEntity && s.rowCount > 0,
      }));
      setWorkbook(wb);
      setSheets(initial);
      setActiveSheet(0);
      setStep("review");
      toast.success(
        `Arquivo lido: ${wb.sheets.length} aba(s) detectada(s).`,
      );
    } catch (e) {
      toast.error("Não foi possível ler o arquivo. Verifique e tente novamente.");
      console.error(e);
    } finally {
      setParsing(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Review (mapeamento) ────────────────────────────────
  const setSheet = (idx: number, patch: Partial<SheetState>) => {
    setSheets((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  };

  const changeEntity = (idx: number, entity: EntityKey | "ignorar") => {
    if (entity === "ignorar") {
      setSheet(idx, {
        assignedEntity: null,
        include: false,
        mappings: buildInitialMappings(sheets[idx].headers, null),
      });
    } else {
      setSheet(idx, {
        assignedEntity: entity,
        include: true,
        mappings: buildInitialMappings(sheets[idx].headers, entity),
      });
    }
  };

  const changeMapping = (idx: number, colIdx: number, target: string) => {
    setSheets((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const mappings = s.mappings.map((m, j) =>
          j === colIdx
            ? {
                ...m,
                target: target === "_ignore" ? "" : target,
                status:
                  target === "_ignore"
                    ? ("ignored" as const)
                    : target
                      ? ("mapped" as const)
                      : ("pending" as const),
              }
            : m,
        );
        return { ...s, mappings };
      }),
    );
  };

  // ── Validação ──────────────────────────────────────────
  const initialCheck = useMemo(
    () =>
      checkInitialDeploymentReady(
        sheets
          .filter((s) => s.include)
          .map((s) => ({ entity: s.assignedEntity, rowCount: s.rowCount })),
      ),
    [sheets],
  );

  const handleValidate = () => {
    // Bloqueio: primeira importação precisa de todas as 7 entidades
    if (isInitialImport && !initialCheck.ready) {
      toast.error(
        "Na primeira importação do sistema é necessário enviar a base completa para inicialização dos dados.",
      );
      return;
    }

    const included = sheets
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.include && s.assignedEntity);
    if (included.length === 0) {
      toast.error("Nenhuma aba foi marcada para importação.");
      return;
    }

    const ctx = {
      existingMatriculas: new Set<string>(),
    };
    const results: Record<number, SheetValidationResult> = {};
    included.forEach(({ s, i }) => {
      results[i] = validateSheet(s, s.assignedEntity!, s.mappings, ctx);
    });
    setValidations(results);
    setStep("validation");
  };

  const totalErrors = Object.values(validations).reduce(
    (acc, v) => acc + v.errors.length,
    0,
  );
  const totalValid = Object.values(validations).reduce(
    (acc, v) => acc + v.validRows,
    0,
  );
  const totalRows = Object.values(validations).reduce(
    (acc, v) => acc + v.totalRows,
    0,
  );

  const handleImport = async () => {
    setImporting(true);
    setProgress(10);
    const tick = setInterval(
      () => setProgress((p) => Math.min(p + 8, 90)),
      300,
    );
    try {
      const selected = sheets
        .filter((s) => s.include && s.assignedEntity)
        .map((s) => ({
          sheet: s,
          entity: s.assignedEntity!,
          mappings: s.mappings,
        }));
      const results = await persistImport(selected);
      clearInterval(tick);
      setProgress(100);
      const totalInserted = results.reduce((a, r) => a + r.inserted, 0);
      const totalErrs = results.reduce((a, r) => a + r.errors.length, 0);
      if (isInitialImport) {
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch {
          /* ignora storage indisponível */
        }
      }
      // invalida caches para refletir nas telas
      await qc.invalidateQueries();
      setStep("done");
      if (totalErrs > 0) {
        toast.warning(
          `Importado com avisos: ${totalInserted} registros, ${totalErrs} linha(s) ignoradas.`,
        );
        results.forEach((r) => {
          if (r.errors.length > 0) {
            console.warn(`[importação ${r.entity}]`, r.errors.slice(0, 5));
          }
        });
      } else {
        toast.success(`Importação concluída: ${totalInserted} registros gravados.`);
      }
    } catch (e) {
      clearInterval(tick);
      console.error("[persistImport]", e);
      toast.error("Falha ao gravar dados no banco. Verifique o console.");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setWorkbook(null);
    setSheets([]);
    setValidations({});
    setActiveSheet(0);
    setProgress(0);
  };

  // ── Render ─────────────────────────────────────────────
  const stepIndex = ["upload", "review", "validation", "done"].indexOf(step);

  return (
    <div>
      <PageHeader
        title="Importação de Dados"
        subtitle="Envie uma planilha Excel com até 7 abas — Unidades, Cursos, Turmas, Alunos, Matrículas, Frequência e Notas"
      />

      {/* Banner de implantação inicial */}
      {isInitialImport && step !== "done" && (
        <Alert className="mb-6 border-primary/40 bg-primary/5">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">
            Implantação inicial do sistema
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Esta é a primeira importação. Envie a base completa, com{" "}
            <strong className="text-foreground">todas as 7 abas</strong>{" "}
            preenchidas (Unidades, Cursos, Turmas, Alunos, Matrículas,
            Frequência e Notas). Após esta etapa, será possível importar abas
            individualmente.
          </AlertDescription>
        </Alert>
      )}

      {/* Ações topo */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="outline" onClick={() => downloadOfficialTemplate()}>
          <Download className="h-4 w-4 mr-2" />
          Baixar Modelo Excel Oficial
        </Button>
        {step !== "upload" && (
          <Button variant="ghost" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Nova Importação
          </Button>
        )}
      </div>

      {/* Progresso da importação assíncrona em servidor */}
      {backendJobId && (
        <div className="mb-6">
          <ImportJobProgress
            jobId={backendJobId}
            onFinished={() => qc.invalidateQueries()}
          />
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
        {["Upload", "Mapeamento", "Validação", "Concluído"].map((label, i) => {
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              )}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone && <Check className="h-3 w-3 inline mr-1" />}
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Barra de progresso global */}
      {(parsing || importing) && (
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {parsing ? "Lendo planilha…" : "Importando dados…"}
          </p>
        </div>
      )}

      {/* STEP 1 — Upload */}
      {step === "upload" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {/* Atalho: enviar direto para o backend (assíncrono, paralelizado) */}
          <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Importar no servidor</strong>{" "}
              — recomendado para arquivos grandes. O processamento roda em
              segundo plano e você pode continuar usando o sistema.
            </div>
            <div>
              <input
                id="backend-file"
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setSubmittingBackend(true);
                  try {
                    const { job_id } = await startBackendImport(f);
                    setBackendJobId(job_id);
                    toast.success("Arquivo enviado. Processando em segundo plano.");
                  } catch (err) {
                    toast.error((err as Error).message);
                  } finally {
                    setSubmittingBackend(false);
                  }
                }}
              />
              <Button
                variant="default"
                disabled={submittingBackend}
                onClick={() =>
                  document.getElementById("backend-file")?.click()
                }
              >
                <Upload className="h-4 w-4 mr-2" />
                {submittingBackend ? "Enviando…" : "Enviar para servidor (assíncrono)"}
              </Button>
            </div>
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
            }}
            aria-label="Área para enviar arquivo Excel"
            className={`rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors mb-6 ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-primary/40 hover:border-primary hover:bg-primary/5"
            }`}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-primary" />
            <p className="text-foreground font-medium">
              Arraste sua planilha Excel aqui
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou clique para selecionar — apenas <strong>.xlsx</strong> ou{" "}
              <strong>.xls</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Você pode enviar uma planilha com várias abas. Cada aba deve
              representar uma entidade (Unidades, Cursos, Turmas, Alunos,
              Matrículas, Frequência ou Notas).
            </p>
          </div>

          {/* Cards informativos das 7 entidades */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Estrutura oficial — 7 entidades suportadas
              </CardTitle>
              <CardDescription>
                Use o modelo oficial para garantir compatibilidade total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ENTITY_ORDER.map((k) => {
                  const ent = ENTITIES[k];
                  return (
                    <div
                      key={k}
                      className="rounded-md border border-border p-3 bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {ent.label}
                        </p>
                        <Badge variant="outline" className="text-[10px]">
                          {ent.columns.length} cols
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {ent.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 font-mono leading-relaxed">
                        {ent.columns.join(", ")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* STEP 2 — Review (abas + mapeamento) */}
      {step === "review" && workbook && (
        <div className="space-y-6">
          {/* Resumo das abas detectadas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Abas detectadas em{" "}
                <span className="font-mono text-xs">{workbook.fileName}</span>
              </CardTitle>
              <CardDescription>
                Confirme a entidade de cada aba e ajuste o mapeamento de
                colunas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status implantação inicial */}
              {isInitialImport && (
                <div
                  className={`mb-4 p-3 rounded-md border text-xs flex items-start gap-2 ${
                    initialCheck.ready
                      ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                      : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                  }`}
                >
                  {initialCheck.ready ? (
                    <Check className="h-4 w-4 text-green-700 dark:text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {initialCheck.ready
                        ? "Base completa pronta para implantação inicial."
                        : "Faltam abas obrigatórias para a implantação inicial."}
                    </p>
                    {!initialCheck.ready && (
                      <p className="text-muted-foreground">
                        Faltando:{" "}
                        {initialCheck.missing
                          .map((k) => ENTITIES[k].label)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tabs de abas */}
              <div className="flex flex-wrap gap-2 mb-4">
                {sheets.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSheet(i)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      activeSheet === i
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    {s.originalName}
                    <span className="opacity-70">({s.rowCount})</span>
                    {s.assignedEntity ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1.5"
                      >
                        {ENTITIES[s.assignedEntity].label}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5"
                      >
                        ignorada
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              {/* Detalhe da aba ativa */}
              {sheets[activeSheet] && (
                <SheetEditor
                  key={activeSheet}
                  sheet={sheets[activeSheet]}
                  onChangeEntity={(e) => changeEntity(activeSheet, e)}
                  onChangeMapping={(c, v) =>
                    changeMapping(activeSheet, c, v)
                  }
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <Button onClick={handleValidate}>
              Validar e Prosseguir
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — Validação */}
      {step === "validation" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-xs text-muted-foreground">Registros válidos</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {totalValid}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-muted-foreground">Erros encontrados</p>
              <p className="text-2xl font-bold text-destructive">
                {totalErrors}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">Total de linhas</p>
              <p className="text-2xl font-bold text-foreground">{totalRows}</p>
            </div>
          </div>

          {Object.entries(validations).map(([idx, v]) => {
            const sheet = sheets[Number(idx)];
            return (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      {sheet.originalName}
                      <Badge variant="secondary" className="text-[10px]">
                        {ENTITIES[v.entity].label}
                      </Badge>
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {v.validRows}/{v.totalRows} válidas
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {v.errors.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                      <Check className="h-4 w-4" /> Nenhum erro encontrado
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {v.errors.slice(0, 30).map((err, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 rounded bg-destructive/5 border border-destructive/20 text-xs"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                          <span>
                            {err.row > 0 && (
                              <>
                                Linha {err.row} —{" "}
                              </>
                            )}
                            <span className="font-medium">{err.field}</span>:{" "}
                            {err.message}
                          </span>
                        </div>
                      ))}
                      {v.errors.length > 30 && (
                        <p className="text-xs text-muted-foreground italic">
                          + {v.errors.length - 30} erros adicionais…
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStep("review")}>
              Voltar ao Mapeamento
            </Button>
            <Button
              onClick={handleImport}
              disabled={totalValid === 0 || importing}
            >
              <Check className="h-4 w-4 mr-2" />
              Importar {totalValid} Registros
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4 — Done */}
      {step === "done" && (
        <Card className="text-center">
          <CardContent className="p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-700 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              Importação concluída
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {totalValid} registros importados em{" "}
              {Object.keys(validations).length} aba(s).
              {totalErrors > 0 &&
                ` ${totalErrors} linha(s) com erro foram ignoradas.`}
            </p>
            <Button onClick={handleReset}>Nova Importação</Button>
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Histórico de Importações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Linhas</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">
                  Nenhuma importação registrada ainda.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Sub-componente: editor de uma aba
// ────────────────────────────────────────────────────────
function SheetEditor({
  sheet,
  onChangeEntity,
  onChangeMapping,
}: {
  sheet: SheetState;
  onChangeEntity: (e: EntityKey | "ignorar") => void;
  onChangeMapping: (colIdx: number, target: string) => void;
}) {
  const ent = sheet.assignedEntity ? ENTITIES[sheet.assignedEntity] : null;
  const mappedTargets = new Set(
    sheet.mappings.filter((m) => m.status === "mapped").map((m) => m.target),
  );
  const missingRequired = ent
    ? ent.required.filter((r) => !mappedTargets.has(r))
    : [];

  return (
    <div className="space-y-4">
      {/* Seletor de entidade */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Entidade desta aba
          </label>
          <Select
            value={sheet.assignedEntity ?? "ignorar"}
            onValueChange={(v) => onChangeEntity(v as EntityKey | "ignorar")}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_ORDER.map((k) => (
                <SelectItem key={k} value={k}>
                  {ENTITIES[k].label}
                </SelectItem>
              ))}
              <SelectItem value="ignorar">Ignorar esta aba</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          {sheet.rowCount} linha(s) · {sheet.headers.length} coluna(s)
        </div>
      </div>

      {!ent && (
        <div className="p-3 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground">
          Esta aba será ignorada na importação.
        </div>
      )}

      {ent && (
        <>
          {missingRequired.length > 0 && (
            <div className="p-2.5 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 text-xs flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
              <span className="text-foreground">
                Colunas obrigatórias ainda não mapeadas:{" "}
                <strong>{missingRequired.join(", ")}</strong>
              </span>
            </div>
          )}

          {/* Tabela de mapeamento */}
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Coluna do arquivo</TableHead>
                  <TableHead className="w-[35%]">Amostra</TableHead>
                  <TableHead className="w-[30%]">Campo do sistema</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheet.mappings.map((m, i) => {
                  const samples = sheet.sample
                    .map((r) => r[m.original])
                    .filter((v) => v !== undefined && v !== null && v !== "")
                    .slice(0, 3)
                    .map(String);
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">
                        {m.original}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {samples.join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={m.target || "_ignore"}
                          onValueChange={(v) => onChangeMapping(i, v)}
                        >
                          <SelectTrigger
                            className={`h-8 text-xs ${
                              m.status === "mapped"
                                ? "border-primary/30"
                                : m.status === "ignored"
                                  ? "border-border opacity-70"
                                  : "border-amber-400"
                            }`}
                          >
                            <SelectValue placeholder="Selecione…" />
                          </SelectTrigger>
                          <SelectContent>
                            {ent.columns.map((c) => (
                              <SelectItem
                                key={c}
                                value={c}
                                className="text-xs"
                              >
                                {c}
                                {ent.required.includes(c) && (
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                            <SelectItem value="_ignore" className="text-xs">
                              — ignorar coluna —
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pré-visualização */}
          {sheet.sample.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Pré-visualização (primeiras {sheet.sample.length} linhas)
              </p>
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {sheet.headers.map((h) => (
                        <TableHead key={h} className="text-xs whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sheet.sample.map((row, i) => (
                      <TableRow key={i}>
                        {sheet.headers.map((h) => (
                          <TableCell
                            key={h}
                            className="text-xs whitespace-nowrap"
                          >
                            {String(row[h] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
