import { useMemo, useState } from "react";
import { ShieldAlert, TrendingDown, Users, CalendarX, Phone, X, Database } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/reusable/PageHeader";
import { KPICard } from "@/components/reusable/KPICard";
import { ChartCard } from "@/components/reusable/ChartCard";
import { FilterBar } from "@/components/reusable/FilterBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalytics, derivePermanencia } from "@/hooks/useAnalytics";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/reusable/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

const kpiIcons = [
  <TrendingDown className="h-4 w-4" />,
  <ShieldAlert className="h-4 w-4" />,
  <Users className="h-4 w-4" />,
  <CalendarX className="h-4 w-4" />,
];

export default function Permanencia() {
  const { data: base, isLoading } = useAnalytics();
  const [filters, setFilters] = useState({ unit: "all", course: "all", period: "all" });
  const { role } = useAuth();

  const filteredBase = useMemo(() => {
    if (!base) return base;
    const matriculas = base.matriculas.filter((m: any) => {
      if (filters.unit !== "all" && m.turma?.unidade?.id !== filters.unit) return false;
      if (filters.course !== "all" && m.turma?.curso?.id !== filters.course) return false;
      if (filters.period !== "all" && (m.turma?.periodo ?? "") !== filters.period) return false;
      return true;
    });
    const ids = new Set(matriculas.map((m: any) => m.id));
    return {
      matriculas,
      freq: base.freq.filter((f: any) => ids.has(f.matricula_id)),
      notas: base.notas.filter((n: any) => ids.has(n.matricula_id)),
    };
  }, [base, filters]);

  if (isLoading || !base || !filteredBase) {
    return (
      <div>
        <PageHeader title="Indicadores de Permanência" subtitle="Evasão, retenção e alunos em risco" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (base.matriculas.length === 0) {
    const canImport = role === "administrador" || role === "gestor";
    return (
      <div>
        <PageHeader title="Indicadores de Permanência" subtitle="Evasão, retenção e alunos em risco" />
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<Database className="h-7 w-7 text-primary" />}
              title="Você ainda não possui registros cadastrados"
              description="Para visualizar os indicadores de permanência é necessário importar os dados da instituição primeiro."
              actionLabel={canImport ? "Importar Dados" : undefined}
              actionRoute={canImport ? "/importar" : undefined}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { kpis, dropoutEvolution, dropoutByUnit, dropoutByCourse, risco } = derivePermanencia(filteredBase);
  const activeCount = Object.values(filters).filter((v) => v !== "all").length;
  const handleFilterChange = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ unit: "all", course: "all", period: "all" });

  return (
    <div>
      <PageHeader title="Indicadores de Permanência" subtitle="Evasão, retenção e alunos em risco" />
      <FilterBar
        config={{ unit: true, course: true, period: true }}
        values={filters}
        onFilterChange={handleFilterChange}
      />
      {activeCount > 0 && (
        <div className="flex items-center gap-2 mb-4 -mt-2">
          <Badge variant="secondary">Filtros ativos: {activeCount}</Badge>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar filtros
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} icon={kpiIcons[i]} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      <ChartCard title="Evolução das Desistências" subtitle="Por mês" className="mb-6">
        <div className="h-[260px]">
          {dropoutEvolution.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Sem desistências registradas.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dropoutEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="taxa" stroke="#F08D39" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Desistências por Unidade">
          <div className="h-[260px]">
            {dropoutByUnit.length === 0 ? <p className="text-sm text-muted-foreground p-4">Sem dados.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dropoutByUnit}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="unit" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="desistencias" fill="#F08D39" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Desistências por Curso">
          <div className="h-[260px]">
            {dropoutByCourse.length === 0 ? <p className="text-sm text-muted-foreground p-4">Sem dados.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dropoutByCourse} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis dataKey="course" type="category" width={150} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="desistencias" fill="#F3BE7A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alunos em Risco de Evasão</CardTitle>
          <CardDescription>Calculado a partir de frequência, notas e faltas consecutivas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {risco.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Nenhum aluno em risco identificado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Freq.</TableHead>
                  <TableHead>Últ. Média</TableHead>
                  <TableHead>Faltas Consec.</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risco.slice(0, 50).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{r.turma}</TableCell>
                    <TableCell className="text-muted-foreground">{r.frequencia}%</TableCell>
                    <TableCell className="text-muted-foreground">{r.ultimaNota ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.faltasConsec}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${r.risk}%`, backgroundColor: r.risk >= 80 ? "#F08D39" : r.risk >= 60 ? "#F3BE7A" : "#5E7AC4" }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{r.risk}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Phone className="h-3 w-3 mr-1" /> Contatar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
