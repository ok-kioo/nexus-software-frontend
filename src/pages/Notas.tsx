import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Combobox } from "@/components/reusable/Combobox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTurmasDoProfessor, useMatriculasDaTurma } from "@/hooks/useAnalytics";
import { notasApi } from "@/lib/api/academico";
import { Search, Save, BookOpen, Calculator, Loader2, AlertCircle } from "lucide-react";

type GradesMap = Record<string, { nota_1: string; nota_2: string; nota_3: string; nota_4: string }>;

export default function Notas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const { data: turmas = [], isLoading: loadingTurmas } = useTurmasDoProfessor(user?.id);

  const initialTurma = params.get("turma") ?? "";
  const [selectedTurma, setSelectedTurma] = useState<string>(initialTurma);
  useEffect(() => { if (!selectedTurma && turmas.length) setSelectedTurma(turmas[0].id); }, [turmas, selectedTurma]);

  const { data: matriculas = [], isLoading: loadingMat } = useMatriculasDaTurma(selectedTurma);

  const { data: notasExistentes = [] } = useQuery({
    enabled: matriculas.length > 0,
    queryKey: ["notas-turma", selectedTurma, matriculas.length, "api"],
    queryFn: async () => {
      const res = await notasApi.byTurma(selectedTurma);
      return (res.registros ?? []) as any[];
    },
  });

  const [search, setSearch] = useState("");
  const [grades, setGrades] = useState<GradesMap>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const initial: GradesMap = {};
    matriculas.forEach((m: any) => {
      const ex = notasExistentes.find((n: any) => n.matricula_id === m.id);
      initial[m.id] = {
        nota_1: ex?.nota_1?.toString() ?? "",
        nota_2: ex?.nota_2?.toString() ?? "",
        nota_3: ex?.nota_3?.toString() ?? "",
        nota_4: ex?.nota_4?.toString() ?? "",
      };
    });
    setGrades(initial);
    setDirty(false);
  }, [matriculas, notasExistentes]);

  const filtered = useMemo(() => {
    if (!search) return matriculas;
    return matriculas.filter((m: any) => m.aluno?.nome_aluno?.toLowerCase().includes(search.toLowerCase()));
  }, [matriculas, search]);

  const handleChange = (id: string, slot: 1 | 2 | 3 | 4, value: string) => {
    if (value !== "") {
      const num = parseFloat(value); if (isNaN(num) || num < 0 || num > 10) return;
    }
    setGrades((p) => ({ ...p, [id]: { ...p[id], [`nota_${slot}`]: value } }));
    setDirty(true);
  };

  const getAvg = (id: string) => {
    const g = grades[id]; if (!g) return "—";
    const arr = [g.nota_1, g.nota_2, g.nota_3, g.nota_4].map(parseFloat).filter((v) => !isNaN(v));
    if (!arr.length) return "—";
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows = Object.entries(grades).map(([matricula_id, g]) => ({
        matricula_id,
        nota_1: g.nota_1 === "" ? null : Number(g.nota_1),
        nota_2: g.nota_2 === "" ? null : Number(g.nota_2),
        nota_3: g.nota_3 === "" ? null : Number(g.nota_3),
        nota_4: g.nota_4 === "" ? null : Number(g.nota_4),
        registrado_por: user?.id ?? null,
      }));
      const existing = await notasApi.byTurma(selectedTurma);
      await Promise.all(
        (existing.registros as any[]).map((r) => notasApi.remove(r.id)),
      );
      await Promise.all(rows.map((r) => notasApi.create(r as Record<string, unknown>)));
    },
    onSuccess: () => {
      toast({ title: "Notas salvas", description: `Registradas para ${matriculas.length} alunos.` });
      qc.invalidateQueries({ queryKey: ["notas-turma", selectedTurma] });
      qc.invalidateQueries({ queryKey: ["analytics-base"] });
      setDirty(false);
    },
    onError: (e: Error) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  if (loadingTurmas) return <div><PageHeader title="Lançamento de Notas" subtitle="Carregando…" /><Skeleton className="h-32" /></div>;

  if (turmas.length === 0) {
    return (
      <div>
        <PageHeader title="Lançamento de Notas" subtitle="Registre as notas dos seus alunos" />
        <Card className="text-center">
          <CardContent className="p-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">Nenhuma turma atribuída</p>
            <p className="text-sm text-muted-foreground">Entre em contato com o administrador para atribuição de turmas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Lançamento de Notas" subtitle="Registre as notas dos seus alunos" />

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
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
        {dirty && !saveMutation.isPending && (
          <Badge variant="outline" className="self-center gap-1.5 border-warning/40 text-warning-foreground bg-warning/20">
            <AlertCircle className="h-3 w-3" /> Alterações não salvas
          </Badge>
        )}
        <Button onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending} className="shrink-0 h-10">
          {saveMutation.isPending ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Salvando…</span>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Salvar Notas</>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Notas — {turmas.find((t: any) => t.id === selectedTurma)?.nome_turma}</CardTitle>
              <CardDescription>Preencha as 4 notas (0 a 10) para cada aluno</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calculator className="h-4 w-4" /><span>Média automática</span></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loadingMat ? <Skeleton className="h-32 m-4" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] sticky left-0 bg-card z-10">Aluno</TableHead>
                    {[1, 2, 3, 4].map((i) => <TableHead key={i} className="text-center w-[100px]">Nota {i}</TableHead>)}
                    <TableHead className="text-center w-[100px]">Média</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m: any) => {
                    const avg = getAvg(m.id); const avgNum = parseFloat(avg);
                    const initials = (m.aluno?.nome_aluno ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="sticky left-0 bg-card z-10">
                          <div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback></Avatar><span className="text-sm font-medium">{m.aluno?.nome_aluno}</span></div>
                        </TableCell>
                        {[1, 2, 3, 4].map((slot) => (
                          <TableCell key={slot} className="text-center">
                            <Input type="number" min="0" max="10" step="0.1" placeholder="0-10"
                              className="w-20 h-9 text-center bg-muted/30 mx-auto"
                              value={grades[m.id]?.[`nota_${slot}` as keyof typeof grades[string]] ?? ""}
                              onChange={(e) => handleChange(m.id, slot as 1 | 2 | 3 | 4, e.target.value)}
                              aria-label={`Nota ${slot} de ${m.aluno?.nome_aluno}`} />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Badge variant={avgNum >= 7 ? "default" : avgNum >= 5 ? "secondary" : avg === "—" ? "outline" : "destructive"} className="text-sm font-bold min-w-[3rem]">{avg}</Badge>
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
    </div>
  );
}
