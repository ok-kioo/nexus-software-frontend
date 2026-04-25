import { useState, useMemo } from "react";
import { Plus, Target, CheckCircle2, Clock, AlertCircle, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/reusable/Combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlanosAcao, useCreatePlano, useUpdatePlano, useDeletePlano } from "@/hooks/useNovasFeatures";
import { TableSkeleton } from "@/components/reusable/TableSkeleton";
import { EmptyState } from "@/components/reusable/EmptyState";
import { useAlunos } from "@/hooks/useEntities";
import { useAuth } from "@/contexts/AuthContext";

const statusCfg: Record<string, { label: string; color: string; icon: any }> = {
  aberto: { label: "Aberto", color: "bg-secondary/15 text-secondary", icon: AlertCircle },
  andamento: { label: "Andamento", color: "bg-warning/15 text-warning", icon: Clock },
  concluido: { label: "Concluído", color: "bg-success/15 text-success", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-muted text-muted-foreground", icon: Trash2 },
};
const prioCfg: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-secondary/15 text-secondary",
  alta: "bg-destructive/15 text-destructive",
};

export default function PlanosAcao() {
  const { role } = useAuth();
  const podeCriar = role === "administrador" || role === "gestor";
  const { data: planos, isLoading } = usePlanosAcao();
  const { data: alunos } = useAlunos();
  const create = useCreatePlano();
  const update = useUpdatePlano();
  const del = useDeletePlano();

  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [form, setForm] = useState({ aluno_id: "", titulo: "", descricao: "", prazo: "", prioridade: "media" });

  const filtrados = useMemo(() => (planos ?? []).filter((p: any) => filtro === "todos" || p.status === filtro), [planos, filtro]);

  const stats = useMemo(() => {
    const arr = planos ?? [];
    const hoje = new Date().toISOString().slice(0,10);
    return {
      abertos: arr.filter((p: any) => p.status === "aberto" || p.status === "andamento").length,
      vencidos: arr.filter((p: any) => p.prazo && p.prazo < hoje && p.status !== "concluido" && p.status !== "cancelado").length,
      concluidos: arr.filter((p: any) => p.status === "concluido").length,
      total: arr.length,
    };
  }, [planos]);

  return (
    <div>
      <PageHeader
        title="Planos de Ação"
        subtitle="Tratativas para alunos em risco"
        action={podeCriar && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/> Novo plano</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar plano de ação</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Aluno</Label>
                  <Combobox
                    value={form.aluno_id}
                    onChange={(v) => setForm({...form, aluno_id: v})}
                    options={(alunos ?? []).map((a) => ({ value: a.id, label: a.nome_aluno, hint: a.documento }))}
                    placeholder="Selecionar aluno…"
                    searchPlaceholder="Buscar por nome ou documento…"
                  />
                </div>
                <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({...form, titulo: e.target.value})} maxLength={150}/></div>
                <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({...form, descricao: e.target.value})} rows={3} maxLength={1000}/></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Prazo</Label><Input type="date" value={form.prazo} onChange={(e) => setForm({...form, prazo: e.target.value})}/></div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={form.prioridade} onValueChange={(v) => setForm({...form, prioridade: v})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
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
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={async () => {
                  if (!form.aluno_id || !form.titulo.trim()) return;
                  await create.mutateAsync({ ...form, prazo: form.prazo || null });
                  setForm({ aluno_id: "", titulo: "", descricao: "", prazo: "", prioridade: "media" });
                  setOpen(false);
                }}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Em aberto</div><div className="text-2xl font-bold text-secondary">{stats.abertos}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Vencidos</div><div className="text-2xl font-bold text-destructive">{stats.vencidos}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Concluídos</div><div className="text-2xl font-bold text-success">{stats.concluidos}</div></CardContent></Card>
      </div>

      <div className="mb-3">
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-48"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            {Object.entries(statusCfg).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-0"><TableSkeleton columns={6} rows={6} /></CardContent></Card>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Target className="h-7 w-7 text-muted-foreground" />}
          title={filtro !== "todos" ? "Nenhum plano com esse status" : "Nenhum plano de ação"}
          description={filtro !== "todos" ? "Mude o filtro para ver outros planos." : "Crie planos para acompanhar alunos em risco."}
          action={podeCriar && filtro === "todos" && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Target className="h-4 w-4 mr-1" /> Novo plano
            </Button>
          )}
        />
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Aluno</TableHead><TableHead>Título</TableHead><TableHead>Prazo</TableHead>
              <TableHead>Prioridade</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtrados.map((p: any) => {
                const Cfg = statusCfg[p.status];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.aluno?.nome_aluno ?? "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{p.titulo}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{p.descricao}</div>
                    </TableCell>
                    <TableCell className="text-sm">{p.prazo ? new Date(p.prazo + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${prioCfg[p.prioridade]}`}>{p.prioridade}</Badge></TableCell>
                    <TableCell>
                      <Select value={p.status} onValueChange={(v) => update.mutate({ id: p.id, status: v })}>
                        <SelectTrigger className="h-7 text-xs w-32"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusCfg).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{role === "administrador" && <Button size="icon" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4"/></Button>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </div>
  );
}