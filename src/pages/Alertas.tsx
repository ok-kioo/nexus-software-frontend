import { useMemo, useState } from "react";
import { AlertTriangle, AlertCircle, Info, X, History, Target, CheckCircle2, MinusCircle } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { FilterBar } from "@/components/reusable/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlertas, useAlertaDetalhe, useUpdateAlertaStatus, usePromoteAlerta } from "@/hooks/useAlertas";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelative } from "@/lib/utils";
import { isFutureOrToday, todayIso } from "@/lib/dates";
import { toast } from "sonner";
import type { Alerta, AlertaStatus } from "@/lib/api/alertas";

const severityConfig = {
  critico:     { icon: AlertTriangle, label: "Crítico",     color: "bg-accent/15 text-accent border-accent/30",       dotColor: "bg-accent",    textColor: "text-orange-700 dark:text-accent",        descColor: "text-orange-600 dark:text-accent/80",   metaColor: "text-orange-500 dark:text-accent/60" },
  atencao:     { icon: AlertCircle,   label: "Atenção",     color: "bg-warning/15 text-warning border-warning/30",   dotColor: "bg-warning",   textColor: "text-amber-700 dark:text-amber-400",      descColor: "text-amber-600 dark:text-amber-400/80", metaColor: "text-amber-500 dark:text-amber-400/60" },
  informativo: { icon: Info,          label: "Informativo", color: "bg-secondary/15 text-secondary border-secondary/30", dotColor: "bg-secondary", textColor: "text-blue-700 dark:text-secondary",       descColor: "text-blue-600 dark:text-secondary/80",  metaColor: "text-blue-500 dark:text-secondary/60" },
} as const;

const groups = [
  { key: "critico"     as const, label: "Crítico" },
  { key: "atencao"     as const, label: "Atenção" },
  { key: "informativo" as const, label: "Informativo" },
];

const statusLabel: Record<AlertaStatus, string> = {
  ativo: "Ativo",
  resolvido: "Resolvido",
  ignorado: "Ignorado",
  convertido: "Convertido em plano",
};

const eventoLabel: Record<string, string> = {
  detected: "Detectado",
  reseen: "Re-detectado",
  status_change: "Status alterado",
  promoted: "Promovido a plano",
};

export default function Alertas() {
  const { role } = useAuth();
  const podeAgir = role === "administrador" || role === "gestor";
  const [filters, setFilters] = useState<{ unit: string; severity: string; status: AlertaStatus | "all" }>({
    unit: "all",
    severity: "all",
    status: "ativo",
  });
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [promoteFor, setPromoteFor] = useState<Alerta | null>(null);

  const statusFilter = filters.status === "all" ? undefined : filters.status;
  const { data: alertas, isLoading } = useAlertas({ status: statusFilter });
  const updateStatus = useUpdateAlertaStatus();
  const promote = usePromoteAlerta();

  const filtrados = useMemo(() => {
    if (!alertas) return [];
    return alertas.filter((a) => {
      if (filters.severity !== "all" && a.severity !== filters.severity) return false;
      if (filters.unit !== "all" && a.unidade_id !== filters.unit) return false;
      return true;
    });
  }, [alertas, filters.severity, filters.unit]);

  const activeCount = (filters.unit !== "all" ? 1 : 0) + (filters.severity !== "all" ? 1 : 0) + (filters.status !== "ativo" ? 1 : 0);
  const handleFilterChange = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value } as typeof prev));
  const clearFilters = () => setFilters({ unit: "all", severity: "all", status: "ativo" });

  if (isLoading || !alertas) {
    return (
      <div>
        <PageHeader title="Alertas Inteligentes" subtitle="Notificações geradas a partir dos indicadores em tempo real" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Alertas Inteligentes" subtitle="Notificações geradas a partir dos indicadores em tempo real" />

      <div className="flex flex-wrap items-center gap-3 mb-2">
        <FilterBar
          config={{ severity: true, unit: true }}
          values={{ severity: filters.severity, unit: filters.unit }}
          onFilterChange={handleFilterChange}
        />
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
            <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="resolvido">Resolvidos</SelectItem>
              <SelectItem value="ignorado">Ignorados</SelectItem>
              <SelectItem value="convertido">Convertidos em plano</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">Filtros ativos: {activeCount}</Badge>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar filtros
          </Button>
        </div>
      )}

      {filtrados.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhum alerta para os filtros selecionados.</CardContent></Card>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const items = filtrados.filter((a) => a.severity === group.key);
            if (items.length === 0) return null;
            const cfg = severityConfig[group.key];
            return (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2.5 h-2.5 rounded-full animate-pulse-dot ${cfg.dotColor}`} />
                  <h2 className="font-semibold text-foreground">{group.label}</h2>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>
                <div className="space-y-3">
                  {items.map((alert) => {
                    const Icon = cfg.icon;
                    return (
                      <Card key={alert.id} className={`border ${cfg.color}`}>
                        <CardContent className={`p-4 ${cfg.textColor}`}>
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-medium text-sm ${cfg.textColor}`}>{alert.titulo}</h3>
                              <p className={`text-xs mt-1 ${cfg.descColor}`}>{alert.descricao}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-3">
                                {alert.unidade && <Badge variant="outline" className={`text-[10px] ${cfg.metaColor}`}>{alert.unidade}</Badge>}
                                <span className={`text-[10px] ${cfg.metaColor}`} title={new Date(alert.last_seen_at).toLocaleString("pt-BR")}>
                                  Detectado {formatRelative(alert.first_seen_at)}
                                  {alert.last_seen_at !== alert.first_seen_at && ` · visto ${formatRelative(alert.last_seen_at)}`}
                                </span>
                                {alert.status !== "ativo" && (
                                  <Badge variant="secondary" className="text-[10px]">{statusLabel[alert.status]}</Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className={`text-xs shrink-0 ${cfg.textColor}`} onClick={() => setOpenDetailId(alert.id)}>
                              Ver detalhes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sheet de detalhes */}
      <Sheet open={!!openDetailId} onOpenChange={(o) => !o && setOpenDetailId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {openDetailId && (
            <DetalheAlerta
              id={openDetailId}
              podeAgir={podeAgir}
              onClose={() => setOpenDetailId(null)}
              onPromote={(a) => { setPromoteFor(a); setOpenDetailId(null); }}
              onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
              updating={updateStatus.isPending}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de promoção a plano */}
      <PromoteDialog
        alerta={promoteFor}
        onClose={() => setPromoteFor(null)}
        onSubmit={(body) => {
          if (!promoteFor) return;
          promote.mutate(
            { id: promoteFor.id, body },
            { onSuccess: () => setPromoteFor(null) },
          );
        }}
        submitting={promote.isPending}
      />
    </div>
  );
}

/* ─────────────── Detalhe ─────────────── */
function DetalheAlerta({
  id,
  podeAgir,
  onClose,
  onPromote,
  onUpdateStatus,
  updating,
}: {
  id: string;
  podeAgir: boolean;
  onClose: () => void;
  onPromote: (a: Alerta) => void;
  onUpdateStatus: (id: string, status: Exclude<AlertaStatus, "convertido">) => void;
  updating: boolean;
}) {
  const { data, isLoading } = useAlertaDetalhe(id);
  if (isLoading || !data) return <div className="p-4"><Skeleton className="h-32" /></div>;
  const { alerta, historico } = data;
  if (!alerta) return <div className="p-4 text-sm text-muted-foreground">Alerta não encontrado.</div>;

  const cfg = severityConfig[alerta.severity];
  const metricsEntries = Object.entries(alerta.metricas ?? {});

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <Badge className={cfg.color}>{cfg.label}</Badge>
          <Badge variant="secondary" className="text-[10px]">{statusLabel[alerta.status]}</Badge>
        </div>
        <SheetTitle className="text-base mt-2">{alerta.titulo}</SheetTitle>
        <SheetDescription className="text-xs">{alerta.descricao}</SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div className="text-xs text-muted-foreground space-y-1">
          {alerta.unidade && <div>Unidade: <span className="text-foreground">{alerta.unidade}</span></div>}
          <div>Detectado pela 1ª vez: <span className="text-foreground" title={new Date(alerta.first_seen_at).toLocaleString("pt-BR")}>{formatRelative(alerta.first_seen_at)}</span></div>
          <div>Última detecção: <span className="text-foreground" title={new Date(alerta.last_seen_at).toLocaleString("pt-BR")}>{formatRelative(alerta.last_seen_at)}</span></div>
          {alerta.resolved_at && <div>Resolvido em: <span className="text-foreground">{formatRelative(alerta.resolved_at)}</span></div>}
        </div>

        {metricsEntries.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Métricas</h4>
            <div className="grid grid-cols-2 gap-2">
              {metricsEntries.map(([k, v]) => (
                <div key={k} className="rounded-md border border-border/50 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
                  <div className="text-sm font-medium">{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1">
            <History className="h-3.5 w-3.5" /> Histórico
          </h4>
          <ol className="space-y-2 border-l border-border pl-3">
            {historico.length === 0 ? (
              <li className="text-xs text-muted-foreground">Sem eventos registrados.</li>
            ) : (
              historico.map((h) => (
                <li key={h.id} className="text-xs">
                  <div className="font-medium">{eventoLabel[h.evento] ?? h.evento}</div>
                  <div className="text-muted-foreground" title={new Date(h.created_at).toLocaleString("pt-BR")}>
                    {formatRelative(h.created_at)}
                  </div>
                </li>
              ))
            )}
          </ol>
        </div>

        {podeAgir && alerta.status === "ativo" && (
          <div className="space-y-2 pt-2 border-t border-border">
            {alerta.entidade === "aluno" && (
              <Button className="w-full" onClick={() => onPromote(alerta)} disabled={updating}>
                <Target className="h-4 w-4 mr-2" /> Criar plano de ação
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={() => onUpdateStatus(alerta.id, "resolvido")} disabled={updating}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como resolvido
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => onUpdateStatus(alerta.id, "ignorado")} disabled={updating}>
              <MinusCircle className="h-4 w-4 mr-2" /> Ignorar alerta
            </Button>
          </div>
        )}

        {podeAgir && (alerta.status === "resolvido" || alerta.status === "ignorado") && (
          <div className="pt-2 border-t border-border">
            <Button variant="outline" className="w-full" onClick={() => onUpdateStatus(alerta.id, "ativo")} disabled={updating}>
              Reabrir alerta
            </Button>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full" onClick={onClose}>Fechar</Button>
      </div>
    </>
  );
}

/* ─────────────── Promote ─────────────── */
function PromoteDialog({
  alerta,
  onClose,
  onSubmit,
  submitting,
}: {
  alerta: Alerta | null;
  onClose: () => void;
  onSubmit: (body: { titulo: string; descricao: string; prazo: string | null; prioridade: "baixa" | "media" | "alta" }) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({ titulo: "", descricao: "", prazo: "", prioridade: "media" as "baixa" | "media" | "alta" });

  // Pré-popula quando abre
  useMemoEffect(() => {
    if (alerta) {
      setForm({
        titulo: alerta.titulo,
        descricao: alerta.descricao,
        prazo: "",
        prioridade: alerta.severity === "critico" ? "alta" : "media",
      });
    }
  }, [alerta?.id]);

  return (
    <Dialog open={!!alerta} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar plano de ação a partir do alerta</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} maxLength={150} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} maxLength={2000} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Prazo</Label><Input type="date" min={todayIso()} value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} /></div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v as "baixa" | "media" | "alta" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button
            disabled={submitting || !form.titulo.trim()}
            onClick={() => {
              if (!form.titulo.trim()) { toast.error("Informe o título do plano."); return; }
              if (!form.descricao.trim()) { toast.error("Informe a descrição do plano."); return; }
              if (form.prazo && !isFutureOrToday(form.prazo)) { toast.error("O prazo não pode estar no passado."); return; }
              onSubmit({
                titulo: form.titulo.trim(),
                descricao: form.descricao.trim(),
                prazo: form.prazo || null,
                prioridade: form.prioridade,
              });
            }}
          >
            Criar plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Pequeno helper para evitar import extra
import { useEffect as useMemoEffect } from "react";
