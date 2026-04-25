import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Combobox } from "@/components/reusable/Combobox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTurmasDoProfessor, useMatriculasDaTurma } from "@/hooks/useAnalytics";
import { frequenciaApi } from "@/lib/api/academico";
import { Search, CalendarCheck, AlertTriangle, Save, Filter, Users, Clock, Loader2, CheckCheck, XSquare } from "lucide-react";

const CRITICAL_THRESHOLD = 75;

export default function Frequencia() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const { data: turmas = [], isLoading: loadingTurmas } = useTurmasDoProfessor(user?.id);

  const initialTurma = params.get("turma") ?? "";
  const [selectedTurma, setSelectedTurma] = useState<string>(initialTurma);
  useEffect(() => { if (!selectedTurma && turmas.length) setSelectedTurma(turmas[0].id); }, [turmas, selectedTurma]);

  const { data: matriculas = [], isLoading: loadingMat } = useMatriculasDaTurma(selectedTurma);

  // Busca histórico de frequência da turma
  const { data: historico = [] } = useQuery({
    enabled: !!selectedTurma && matriculas.length > 0,
    queryKey: ["freq-turma", selectedTurma, matriculas.length, "api"],
    queryFn: async () => {
      const res = await frequenciaApi.byTurma(selectedTurma);
      return (res.registros ?? []) as any[];
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayBR = new Date().toLocaleDateString("pt-BR");

  const [search, setSearch] = useState("");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [tab, setTab] = useState("chamada");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  // inicializa chamada com presença marcada se já houver registro do dia
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    matriculas.forEach((m: any) => {
      const today_rec = historico.find((h: any) => h.matricula_id === m.id && h.data === today);
      initial[m.id] = today_rec?.presente ?? true;
    });
    setAttendance(initial);
  }, [matriculas, historico, today]);

  // estatísticas por aluno
  const stats = useMemo(() => {
    const m = new Map<string, { total: number; pres: number; lastPresent?: string; absences: number }>();
    historico.forEach((h: any) => {
      const cur = m.get(h.matricula_id) ?? { total: 0, pres: 0, absences: 0 };
      cur.total += 1;
      if (h.presente) { cur.pres += 1; if (!cur.lastPresent || h.data > cur.lastPresent) cur.lastPresent = h.data; }
      else cur.absences += 1;
      m.set(h.matricula_id, cur);
    });
    return m;
  }, [historico]);

  const filtered = useMemo(() => {
    let r = matriculas;
    if (search) r = r.filter((m: any) => m.aluno?.nome_aluno?.toLowerCase().includes(search.toLowerCase()));
    if (showCriticalOnly) r = r.filter((m: any) => {
      const s = stats.get(m.id); const rate = s?.total ? (s.pres / s.total) * 100 : 100;
      return rate < CRITICAL_THRESHOLD;
    });
    return r;
  }, [matriculas, search, showCriticalOnly, stats]);

  const totalPresent = Object.values(attendance).filter(Boolean).length;
  const totalAbsent = Object.values(attendance).filter((v) => !v).length;
  const criticalCount = matriculas.filter((m: any) => {
    const s = stats.get(m.id); const rate = s?.total ? (s.pres / s.total) * 100 : 100;
    return rate < CRITICAL_THRESHOLD;
  }).length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      // upsert manual via API: lista existentes do dia, deleta e recria
      const day = await frequenciaApi.byTurma(selectedTurma, today, today);
      await Promise.all((day.registros as any[]).map((r) => frequenciaApi.remove(r.id)));
      await Promise.all(
        matriculas.map((m: any) =>
          frequenciaApi.create({
            matricula_id: m.id,
            data: today,
            presente: attendance[m.id] ?? true,
            registrado_por: user?.id ?? null,
          }),
        ),
      );
    },
    onSuccess: () => {
      toast({ title: "Frequência salva", description: `Chamada de ${todayBR} registrada para ${matriculas.length} alunos.` });
      qc.invalidateQueries({ queryKey: ["freq-turma", selectedTurma] });
      qc.invalidateQueries({ queryKey: ["analytics-base"] });
    },
    onError: (e: Error) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  if (loadingTurmas) return <div><PageHeader title="Gestão de Frequência" subtitle="Carregando…" /><Skeleton className="h-32" /></div>;

  if (turmas.length === 0) {
    return (
      <div>
        <PageHeader title="Gestão de Frequência" subtitle="Registre e acompanhe a frequência dos seus alunos" />
        <Card className="text-center">
          <CardContent className="p-12">
            <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">Nenhuma turma atribuída</p>
            <p className="text-sm text-muted-foreground">Entre em contato com o administrador para atribuição de turmas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Gestão de Frequência" subtitle="Registre e acompanhe a frequência dos seus alunos" />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="w-full sm:w-64">
          <Label className="mb-1.5 text-xs text-muted-foreground">Turma</Label>
          <Combobox
            value={selectedTurma}
            onChange={setSelectedTurma}
            options={turmas.map((c: any) => ({ value: c.id, label: c.nome_turma, hint: c.curso?.nome_curso }))}
            placeholder="Selecione a turma…"
            searchPlaceholder="Buscar turma ou curso…"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <Card className="px-4 py-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><span className="text-sm font-medium">{matriculas.length} alunos</span></Card>
          <Card className="px-4 py-2 flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-green-500" /><span className="text-sm font-medium text-green-600 dark:text-green-400">{totalPresent} presentes</span></Card>
          <Card className="px-4 py-2 flex items-center gap-2"><Clock className="h-4 w-4 text-destructive" /><span className="text-sm font-medium text-destructive">{totalAbsent} ausentes</span></Card>
          {criticalCount > 0 && <Card className="px-4 py-2 flex items-center gap-2 border-warning/40"><AlertTriangle className="h-4 w-4 text-accent" /><span className="text-sm font-medium text-accent">{criticalCount} críticos</span></Card>}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="chamada">Chamada do Dia</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="chamada" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
            </div>
            <Button variant={showCriticalOnly ? "default" : "outline"} onClick={() => setShowCriticalOnly(!showCriticalOnly)} className="shrink-0">
              <Filter className="h-4 w-4 mr-2" /> Somente Críticos
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Chamada — {todayBR}</CardTitle>
                  <CardDescription>Registre a presença de cada aluno</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAttendance(Object.fromEntries(matriculas.map((m: any) => [m.id, true])))}
                    title="Marcar todos como presentes"
                  >
                    <CheckCheck className="h-4 w-4 mr-1 text-green-600 dark:text-green-400" /> Todos presentes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAttendance(Object.fromEntries(matriculas.map((m: any) => [m.id, false])))}
                    title="Marcar todos como ausentes"
                  >
                    <XSquare className="h-4 w-4 mr-1 text-destructive" /> Todos ausentes
                  </Button>
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="h-10">
                    {saveMutation.isPending ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Salvando…</span>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Salvar Chamada</>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {loadingMat ? <Skeleton className="h-32 m-4" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[240px]">Aluno</TableHead>
                        <TableHead className="text-center">Faltas Totais</TableHead>
                        <TableHead className="text-center">Presença (%)</TableHead>
                        <TableHead className="text-center">Última Presença</TableHead>
                        <TableHead className="text-center">Status Hoje</TableHead>
                        <TableHead className="text-center w-[100px]">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((m: any) => {
                        const s = stats.get(m.id);
                        const rate = s?.total ? Math.round((s.pres / s.total) * 100) : 100;
                        const isCritical = rate < CRITICAL_THRESHOLD;
                        const isPresent = attendance[m.id] ?? true;
                        const initials = (m.aluno?.nome_aluno ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                        return (
                          <TableRow key={m.id} className={isCritical ? "bg-destructive/5" : ""}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback></Avatar>
                                <div>
                                  <p className="text-sm font-medium">{m.aluno?.nome_aluno}</p>
                                  {isCritical && <Badge variant="destructive" className="text-[10px] h-4 px-1 mt-0.5"><AlertTriangle className="h-3 w-3 mr-0.5" /> Crítico</Badge>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm">{s?.absences ?? 0}</TableCell>
                            <TableCell className="text-center">
                              <span className={`text-sm font-medium ${rate >= 85 ? "text-green-600 dark:text-green-300" : rate >= CRITICAL_THRESHOLD ? "text-foreground" : "text-destructive"}`}>{rate}%</span>
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">{s?.lastPresent ? new Date(s.lastPresent).toLocaleDateString("pt-BR") : "—"}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={isPresent ? "default" : "destructive"} className="text-xs">{isPresent ? "Presente" : "Ausente"}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch checked={isPresent} onCheckedChange={(v) => setAttendance((p) => ({ ...p, [m.id]: v }))} aria-label={`Marcar ${m.aluno?.nome_aluno} como ${isPresent ? "ausente" : "presente"}`} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Histórico de Chamadas</CardTitle><CardDescription>Registros anteriores</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead className="w-[200px]">Aluno</TableHead><TableHead className="text-center">Presença (%)</TableHead><TableHead className="text-center">Total Faltas</TableHead><TableHead>Últimos Registros</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {matriculas.map((m: any) => {
                      const s = stats.get(m.id); const rate = s?.total ? Math.round((s.pres / s.total) * 100) : 0;
                      const recent = historico.filter((h: any) => h.matricula_id === m.id).sort((a: any, b: any) => b.data.localeCompare(a.data)).slice(0, 8);
                      const initials = (m.aluno?.nome_aluno ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                      return (
                        <TableRow key={m.id}>
                          <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback></Avatar><span className="text-sm font-medium">{m.aluno?.nome_aluno}</span></div></TableCell>
                          <TableCell className="text-center"><span className={`text-sm font-medium ${rate >= 85 ? "text-green-600 dark:text-green-300" : rate >= CRITICAL_THRESHOLD ? "text-foreground" : "text-destructive"}`}>{rate}%</span></TableCell>
                          <TableCell className="text-center text-sm">{s?.absences ?? 0}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {recent.map((h: any, i: number) => (
                                <div key={i} title={`${new Date(h.data).toLocaleDateString("pt-BR")}: ${h.presente ? "Presente" : "Ausente"}`}
                                  className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium ${h.presente ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                  {h.presente ? "P" : "F"}
                                </div>
                              ))}
                              {recent.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
