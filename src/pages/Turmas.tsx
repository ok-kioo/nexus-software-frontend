import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/reusable/PageHeader";
import { ChartCard } from "@/components/reusable/ChartCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useTurmasPagedJoin, useTurmasComJoin, useDeleteTurma, DEFAULT_PAGE_SIZE, Turma } from "@/hooks/useEntities";
import { TurmaForm } from "@/components/crud/TurmaForm";
import { ConfirmDelete } from "@/components/crud/ConfirmDelete";
import { SearchInput } from "@/components/reusable/SearchInput";
import { PaginationBar } from "@/components/reusable/PaginationBar";
import { useDebounce } from "@/hooks/useDebounce";
import { TableSkeleton, CardGridSkeleton } from "@/components/reusable/TableSkeleton";
import { ErrorState } from "@/components/reusable/ErrorState";
import { EmptyState } from "@/components/reusable/EmptyState";
import { LayoutGrid } from "lucide-react";

function getOccColor(pct: number) {
  if (pct >= 90) return "hsl(var(--destructive))";
  if (pct >= 60) return "hsl(var(--primary))";
  return "hsl(var(--muted-foreground))";
}

export default function Turmas() {
  const { role } = useAuth();
  const canManage = role === "administrador" || role === "gestor";
  const canDelete = role === "administrador";
  const del = useDeleteTurma();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Página atual (paginada) — para tabela e cards
  const { data: paged, isLoading, isFetching, isError, error, refetch } = useTurmasPagedJoin({ page, search: debouncedSearch });
  const rows = paged?.rows ?? [];
  const total = paged?.total ?? 0;

  // Dataset agregado para o gráfico (sem paginação)
  const { data: allTurmas = [] } = useTurmasComJoin();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [confirm, setConfirm] = useState<any>(null);

  const enriched = useMemo(() => {
    return rows.map((t: any) => {
      const enrolled = (t.matriculas ?? []).filter((m: any) => m.status === "ativa").length;
      const pct = t.capacidade ? Math.round((enrolled / t.capacidade) * 100) : 0;
      return { ...t, enrolled, pct };
    });
  }, [rows]);

  const chartData = useMemo(() =>
    allTurmas.slice(0, 12).map((t: any) => ({
      turma: t.nome_turma,
      total: (t.matriculas ?? []).filter((m: any) => m.status === "ativa").length,
    })),
    [allTurmas]);

  return (
    <div>
      <PageHeader
        title="Gestão de Turmas"
        subtitle="Ocupação e status das turmas"
        action={canManage ? (
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova Turma
          </Button>
        ) : undefined}
      />

      <div className="mb-4 max-w-md">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar turma…" />
      </div>

      {chartData.length > 0 && (
        <ChartCard title="Alunos por Turma" className="mb-6">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="turma" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {isLoading ? (
        <>
          <CardGridSkeleton count={8} height={140} />
          <div className="mt-6">
            <TableSkeleton columns={6} rows={5} />
          </div>
        </>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : enriched.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-7 w-7 text-muted-foreground" />}
          title={debouncedSearch ? "Nenhum resultado para sua busca" : "Nenhuma turma cadastrada"}
          description={debouncedSearch ? "Tente outros termos ou limpe a busca." : "Crie a primeira turma para começar a vincular alunos e professores."}
          action={!debouncedSearch && canManage && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Nova Turma
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/importar"><Upload className="h-4 w-4 mr-1" /> Importar Dados</Link>
              </Button>
            </div>
          )}
        />
      ) : (
        <>
          <h3 className="font-semibold text-foreground text-sm mb-3">Ocupação ({total} no total)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {enriched.map((t: any) => {
              const color = getOccColor(t.pct);
              return (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground text-sm truncate">{t.nome_turma}</h4>
                        <p className="text-xs text-muted-foreground truncate">{t.unidade?.nome_unidade}/{t.unidade?.estado}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{t.curso?.nome_curso}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{t.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{t.enrolled}/{t.capacidade}</span>
                      <span style={{ color }}>{t.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(t.pct, 100)}%`, backgroundColor: color }} />
                    </div>
                    {canManage && (
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditing(t); setOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => setConfirm(t)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead><TableHead>Unidade</TableHead><TableHead>Curso</TableHead>
                    <TableHead>Capacidade</TableHead><TableHead>Matriculados</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enriched.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nome_turma}</TableCell>
                      <TableCell>{t.unidade?.nome_unidade}/{t.unidade?.estado}</TableCell>
                      <TableCell>{t.curso?.nome_curso}</TableCell>
                      <TableCell>{t.capacidade}</TableCell>
                      <TableCell>{t.enrolled}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{t.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <PaginationBar page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} loading={isFetching} />
        </>
      )}

      <TurmaForm open={open} onOpenChange={setOpen} turma={editing as any} />
      <ConfirmDelete
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Excluir turma?"
        description={`Tem certeza que deseja excluir "${confirm?.nome_turma}"? Matrículas vinculadas serão removidas.`}
        loading={del.isPending}
        onConfirm={async () => { if (confirm) { await del.mutateAsync(confirm.id); setConfirm(null); } }}
      />
    </div>
  );
}
