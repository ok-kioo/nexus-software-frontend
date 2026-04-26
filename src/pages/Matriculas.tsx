import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Building2, Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/reusable/PageHeader";
import { KPICard } from "@/components/reusable/KPICard";
import { ChartCard } from "@/components/reusable/ChartCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useMatriculasComJoin, useMatriculasPagedJoin, useDeleteMatricula, DEFAULT_PAGE_SIZE, Matricula } from "@/hooks/useEntities";
import { MatriculaForm } from "@/components/crud/MatriculaForm";
import { ConfirmDelete } from "@/components/crud/ConfirmDelete";
import { SearchInput } from "@/components/reusable/SearchInput";
import { PaginationBar } from "@/components/reusable/PaginationBar";
import { useDebounce } from "@/hooks/useDebounce";
import { FilterBar } from "@/components/reusable/FilterBar";
import { TableSkeleton } from "@/components/reusable/TableSkeleton";
import { ErrorState } from "@/components/reusable/ErrorState";
import { EmptyState } from "@/components/reusable/EmptyState";
import { ClipboardList } from "lucide-react";

export default function Matriculas() {
  const { role } = useAuth();
  const canManage = role === "administrador" || role === "gestor";
  const canDelete = role === "administrador";
  const del = useDeleteMatricula();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);

  const [chartFilters, setChartFilters] = useState({ unit: "all", course: "all", turma: "all" });

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, dataInicio, dataFim, chartFilters]);

  const { data: paged, isLoading, isFetching, isError, error, refetch } = useMatriculasPagedJoin({
    page, search: debouncedSearch, status: statusFilter,
    dataInicio: dataInicio || undefined, dataFim: dataFim || undefined,
    unidadeId: chartFilters.unit, cursoId: chartFilters.course, turmaId: chartFilters.turma,
  });
  const filtered = paged?.rows ?? [];
  const total = paged?.total ?? 0;

  // Dataset agregado para KPIs e gráficos (sem paginação)
  const { data: allData = [] } = useMatriculasComJoin();
  const data = useMemo(() => {
    return (allData as any[]).filter((m) => {
      if (chartFilters.unit !== "all" && m.turma?.unidade?.id !== chartFilters.unit) return false;
      if (chartFilters.course !== "all" && m.turma?.curso?.id !== chartFilters.course) return false;
      if (chartFilters.turma !== "all" && m.turma?.id !== chartFilters.turma) return false;
      return true;
    });
  }, [allData, chartFilters]);
  const chartActiveCount = Object.values(chartFilters).filter((v) => v !== "all").length;
  const handleChartFilterChange = (key: string, value: string) =>
    setChartFilters((prev) => ({ ...prev, [key]: value }));
  const clearChartFilters = () => setChartFilters({ unit: "all", course: "all", turma: "all" });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Matricula | null>(null);
  const [confirm, setConfirm] = useState<any>(null);

  const kpis = useMemo(() => {
    const total = data.length;
    const ativas = data.filter((m: any) => m.status === "ativa").length;
    const unidades = new Map<string, number>();
    data.forEach((m: any) => {
      const u = m.turma?.unidade?.nome_unidade;
      if (u) unidades.set(u, (unidades.get(u) ?? 0) + 1);
    });
    const sorted = [...unidades.entries()].sort((a, b) => b[1] - a[1]);
    return {
      total, ativas,
      maior: sorted[0] ? `${sorted[0][0]} (${sorted[0][1]})` : "—",
      menor: sorted.length > 1 ? `${sorted[sorted.length - 1][0]} (${sorted[sorted.length - 1][1]})` : "—",
    };
  }, [data]);

  const byUnit = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((m: any) => {
      const u = m.turma?.unidade ? `${m.turma.unidade.nome_unidade}/${m.turma.unidade.estado}` : "—";
      map.set(u, (map.get(u) ?? 0) + 1);
    });
    return [...map.entries()].map(([unit, total]) => ({ unit, total }));
  }, [data]);

  const byCourse = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((m: any) => {
      const c = m.turma?.curso?.nome_curso ?? "—";
      map.set(c, (map.get(c) ?? 0) + 1);
    });
    return [...map.entries()].map(([course, total]) => ({ course, total })).sort((a, b) => b.total - a.total);
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Gestão de Matrículas"
        subtitle="Matrículas ativas, por unidade e por curso"
        action={canManage ? (
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova Matrícula
          </Button>
        ) : undefined}
      />

      <FilterBar
        config={{ unit: true, course: true, turma: true }}
        values={chartFilters}
        onFilterChange={handleChartFilterChange}
      />
      {chartActiveCount > 0 && (
        <div className="flex items-center gap-2 mb-4 -mt-2">
          <Badge variant="secondary">Filtros ativos: {chartActiveCount}</Badge>
          <Button variant="ghost" size="sm" onClick={clearChartFilters} className="h-7 px-2">
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar filtros
          </Button>
          <span className="text-xs text-muted-foreground">Aplicados aos KPIs, gráficos e tabela</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard icon={<Users className="h-4 w-4" />} label="Total Matrículas" value={String(kpis.total)} />
        <KPICard icon={<TrendingUp className="h-4 w-4" />} label="Ativas" value={String(kpis.ativas)} />
        <KPICard icon={<Building2 className="h-4 w-4" />} label="Maior Unidade" value={kpis.maior} />
        <KPICard icon={<Building2 className="h-4 w-4" />} label="Menor Unidade" value={kpis.menor} />
      </div>

      {data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Matrículas por Unidade">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byUnit}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="unit" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Matrículas por Curso">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCourse} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis dataKey="course" type="category" width={130} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="total" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nº matrícula, aluno ou CPF…" className="lg:col-span-2" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="trancada">Trancada</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">De</Label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="bg-card" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Até</Label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-card" />
              </div>
            </div>
          </div>
          {(debouncedSearch || statusFilter !== "all" || dataInicio || dataFim) && (
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <span>Filtros ativos.</span>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setSearch(""); setStatusFilter("all"); setDataInicio(""); setDataFim(""); }}>
                <X className="h-3 w-3 mr-1" /> Limpar
              </Button>
            </div>
          )}
          {isLoading ? (
            <TableSkeleton columns={6} rows={6} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => refetch()} compact />
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Matrícula</TableHead><TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead><TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="p-0">
                    <EmptyState
                      compact
                      icon={<ClipboardList className="h-6 w-6 text-muted-foreground" />}
                      title={(debouncedSearch || statusFilter !== "all" || dataInicio || dataFim) ? "Nenhum resultado para os filtros" : "Nenhuma matrícula cadastrada"}
                      description={(debouncedSearch || statusFilter !== "all" || dataInicio || dataFim) ? "Ajuste ou limpe os filtros para ver mais resultados." : "Crie a primeira matrícula vinculando um aluno a uma turma."}
                      action={!(debouncedSearch || statusFilter !== "all" || dataInicio || dataFim) && canManage && (
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
                            <Plus className="h-4 w-4 mr-1" /> Nova Matrícula
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/importar"><Upload className="h-4 w-4 mr-1" /> Importar Dados</Link>
                          </Button>
                        </div>
                      )}
                    />
                  </TableCell></TableRow>
                ) : filtered.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.numero_matricula}</TableCell>
                    <TableCell>{m.aluno?.nome_aluno ?? "—"}</TableCell>
                    <TableCell>{m.turma?.nome_turma ?? "—"}</TableCell>
                    <TableCell>{m.turma?.unidade ? `${m.turma.unidade.nome_unidade}/${m.turma.unidade.estado}` : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{m.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(m); setOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirm(m)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} loading={isFetching} />
            </>
          )}
        </CardContent>
      </Card>

      <MatriculaForm open={open} onOpenChange={setOpen} matricula={editing as any} />
      <ConfirmDelete
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Excluir matrícula?"
        description={`Excluir matrícula ${confirm?.numero_matricula}? Frequência e notas vinculadas serão removidas.`}
        loading={del.isPending}
        onConfirm={async () => { if (confirm) { await del.mutateAsync(confirm.id); setConfirm(null); } }}
      />
    </div>
  );
}
