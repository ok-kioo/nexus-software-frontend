import { Navigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Award, TrendingUp, TrendingDown, AlertTriangle, X, Database } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PageHeader } from "@/components/reusable/PageHeader";
import { KPICard } from "@/components/reusable/KPICard";
import { ChartCard } from "@/components/reusable/ChartCard";
import { FilterBar } from "@/components/reusable/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics, deriveAcademico, unitColorFor } from "@/hooks/useAnalytics";
import { EmptyState } from "@/components/reusable/EmptyState";

const kpiIcons = [
  <Award className="h-4 w-4" />,
  <TrendingUp className="h-4 w-4" />,
  <TrendingDown className="h-4 w-4" />,
  <AlertTriangle className="h-4 w-4" />,
];

export default function Academico() {
  const { role } = useAuth();
  const { data: base, isLoading } = useAnalytics();
  const [filters, setFilters] = useState({ unit: "all", course: "all", turma: "all", period: "all" });

  const filteredBase = useMemo(() => {
    if (!base) return base;
    const matriculas = base.matriculas.filter((m) => {
      if (filters.unit !== "all" && m.turma?.unidade?.id !== filters.unit) return false;
      if (filters.course !== "all" && m.turma?.curso?.id !== filters.course) return false;
      if (filters.turma !== "all" && m.turma?.id !== filters.turma) return false;
      if (filters.period !== "all" && (m.turma?.periodo ?? "") !== filters.period) return false;
      return true;
    });
    const ids = new Set(matriculas.map((m) => m.id));
    return {
      matriculas,
      freq: base.freq.filter((f) => ids.has(f.matricula_id)),
      notas: base.notas.filter((n) => ids.has(n.matricula_id)),
    };
  }, [base, filters]);

  if (role === "professor") return <Navigate to="/professor" replace />;

  if (isLoading || !base || !filteredBase) {
    return (
      <div>
        <PageHeader title="Indicadores Acadêmicos" subtitle="Desempenho e frequência da rede" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (base.matriculas.length === 0) {
    const canImport = role === "administrador" || role === "gestor";
    return (
      <div>
        <PageHeader title="Indicadores Acadêmicos" subtitle="Desempenho e frequência da rede" />
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<Database className="h-7 w-7 text-primary" />}
              title="Você ainda não possui registros cadastrados"
              description="Para visualizar os indicadores acadêmicos é necessário importar os dados da instituição primeiro."
              actionLabel={canImport ? "Importar Dados" : undefined}
              actionRoute={canImport ? "/importar" : undefined}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { kpis, gradesByCourse, attendanceOverTime, top, bottom, academicProgress } = deriveAcademico(filteredBase);
  const unitKeys = attendanceOverTime.length
    ? Object.keys(attendanceOverTime[0]).filter((k) => k !== "month")
    : [];
  const activeCount = Object.values(filters).filter((v) => v !== "all").length;
  const handleFilterChange = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ unit: "all", course: "all", turma: "all", period: "all" });

  return (
    <div>
      <PageHeader title="Indicadores Acadêmicos" subtitle="Desempenho e frequência calculados a partir do banco" />
      <FilterBar
        config={{ unit: true, course: true, turma: true, period: true }}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Frequência por Unidade (mensal)" subtitle="Taxa de presença por mês">
          <div className="h-[280px]">
            {attendanceOverTime.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Sem registros de frequência.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Legend />
                  {unitKeys.map((u, i) => (
                    <Line key={u} type="monotone" dataKey={u} stroke={unitColorFor(u, i)} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Média por Curso">
          <div className="h-[280px]">
            {gradesByCourse.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Sem notas registradas.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradesByCourse} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis dataKey="course" type="category" width={150} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="media" fill="#5E7AC4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Progresso Acadêmico" subtitle="Média geral da rede por período" className="mb-6">
        <div className="h-[240px]">
          {academicProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Sem dados de progresso.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={academicProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semester" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="media" stroke="#3852B4" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      {[
        { title: "Top 10 Melhores Alunos", students: top },
        { title: "10 Alunos com Médias Mais Baixas", students: bottom },
      ].map((section) => (
        <Card key={section.title} className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {section.students.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Sem dados disponíveis.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Média</TableHead>
                    <TableHead>Frequência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.students.map((s, i) => (
                    <TableRow key={`${s.name}-${i}`}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.unit}</TableCell>
                      <TableCell className="text-muted-foreground">{s.turma}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.media.toFixed(1).replace(".", ",")}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.frequencia}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
