import { useState, useMemo } from "react";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useEventos, useCreateEvento, useDeleteEvento } from "@/hooks/useNovasFeatures";
import { useUnidades } from "@/hooks/useEntities";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tipoLabel: Record<string, string> = {
  evento: "Evento", prova: "Prova", feriado: "Feriado", reuniao: "Reunião",
  inicio_semestre: "Início Semestre", fim_semestre: "Fim Semestre",
};
const tipoColor: Record<string, string> = {
  evento: "bg-secondary/15 text-secondary",
  prova: "bg-destructive/15 text-destructive",
  feriado: "bg-success/15 text-success",
  reuniao: "bg-primary/15 text-primary",
  inicio_semestre: "bg-accent/15 text-accent",
  fim_semestre: "bg-warning/15 text-warning",
};

export default function Calendario() {
  const { role } = useAuth();
  const podeCriar = role === "administrador" || role === "gestor";
  const { data: eventos, isLoading } = useEventos();
  const { data: unidades } = useUnidades();
  const create = useCreateEvento();
  const del = useDeleteEvento();

  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("evento");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(new Date());
  const [unidadeId, setUnidadeId] = useState<string>("");
  const [selecionada, setSelecionada] = useState<Date | undefined>(new Date());
  const [filtroUnidade, setFiltroUnidade] = useState<string>("todas");

  const eventosFiltrados = useMemo(() => {
    return (eventos ?? []).filter((e: any) => filtroUnidade === "todas" || !e.unidade_id || e.unidade_id === filtroUnidade);
  }, [eventos, filtroUnidade]);

  const diasComEventos = useMemo(() => eventosFiltrados.map((e: any) => new Date(e.data_inicio + "T00:00:00")), [eventosFiltrados]);
  const eventosDoDia = useMemo(() => {
    if (!selecionada) return [];
    const d = selecionada.toISOString().slice(0, 10);
    return eventosFiltrados.filter((e: any) => e.data_inicio === d);
  }, [selecionada, eventosFiltrados]);

  return (
    <div>
      <PageHeader
        title="Calendário Acadêmico"
        subtitle="Eventos, provas, feriados e reuniões"
        action={podeCriar && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/> Novo evento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar evento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150}/></div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {Object.entries(tipoLabel).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data</Label>
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                    className={cn("p-3 pointer-events-auto rounded-md border")}
                  />
                </div>
                <div>
                  <Label>Unidade (opcional)</Label>
                  <Select value={unidadeId} onValueChange={setUnidadeId}>
                    <SelectTrigger><SelectValue placeholder="Todas"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {(unidades ?? []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.nome_unidade}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} maxLength={1000}/></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={async () => {
                  if (!titulo.trim()) { toast.error("Informe o título do evento."); return; }
                  if (!dataInicio) { toast.error("Selecione a data do evento."); return; }
                  const isoData = dataInicio.toISOString().slice(0, 10);
                  if (isoData < new Date().toISOString().slice(0, 10)) {
                    toast.error("A data do evento não pode estar no passado.");
                    return;
                  }
                  await create.mutateAsync({
                    titulo, descricao, tipo,
                    data_inicio: isoData,
                    unidade_id: unidadeId && unidadeId !== "all" ? unidadeId : null,
                  });
                  setTitulo(""); setDescricao(""); setTipo("evento"); setUnidadeId(""); setOpen(false);
                }}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="mb-4 flex gap-2">
        <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
          <SelectTrigger className="w-64"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as unidades</SelectItem>
            {(unidades ?? []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.nome_unidade}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <Skeleton className="h-64"/> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selecionada}
                onSelect={setSelecionada}
                modifiers={{ evento: diasComEventos }}
                modifiersClassNames={{ evento: "bg-primary/20 text-primary font-bold" }}
                className={cn("p-3 pointer-events-auto w-full")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="h-4 w-4 text-primary"/>
                <h3 className="font-medium text-sm">{selecionada?.toLocaleDateString("pt-BR")}</h3>
              </div>
              <div className="space-y-2">
                {eventosDoDia.map((e: any) => (
                  <div key={e.id} className="border rounded-md p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge className={`text-[10px] ${tipoColor[e.tipo]}`}>{tipoLabel[e.tipo]}</Badge>
                          {e.unidade && <Badge variant="outline" className="text-[10px]">{e.unidade.nome_unidade}</Badge>}
                        </div>
                        <div className="font-medium text-sm mt-1">{e.titulo}</div>
                        {e.descricao && <p className="text-xs text-muted-foreground mt-1">{e.descricao}</p>}
                      </div>
                      {podeCriar && <Button size="icon" variant="ghost" onClick={() => del.mutate(e.id)}><Trash2 className="h-3 w-3"/></Button>}
                    </div>
                  </div>
                ))}
                {eventosDoDia.length === 0 && <div className="text-xs text-muted-foreground">Nenhum evento.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}