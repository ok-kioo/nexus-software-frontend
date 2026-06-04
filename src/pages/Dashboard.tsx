import { useMemo, useState } from "react";
import { Users, TrendingDown, CalendarCheck, Award, X, Database } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PageHeader } from "@/components/reusable/PageHeader";
import { KPICard } from "@/components/reusable/KPICard";
import { ChartCard } from "@/components/reusable/ChartCard";
import { FilterBar } from "@/components/reusable/FilterBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAnalytics, deriveDashboard, unitColorFor } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/reusable/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

const kpiIcons = [
  <Users className="h-4 w-4" />,
  <TrendingDown className="h-4 w-4" />,
  <CalendarCheck className="h-4 w-4" />,
  <Award className="h-4 w-4" />,
];

export default function Dashboard() {
  const { data: base, isLoading } = useAnalytics();
  const [filters, setFilters] = useState({ unit: "all", period: "all" });
  const { role } = useAuth();
  const canImport = role === "administrador" || role === "gestor";

  const filteredBase = useMemo(() => {
    if (!base) return base;
    const matriculas = base.matriculas.filter((m: any) => {
      if (filters.unit !== "all" && m.turma?.unidade?.id !== filters.unit) return false;
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
        <PageHeader title="Painéis Gerenciais" subtitle="Visão geral da rede de ensino" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[280px] mb-6" />
      </div>
    );
  }

  // Estado vazio real: requisição concluída e ainda não há matrículas no sistema.
  if (base.matriculas.length === 0) {
    return (
      <div>
        <PageHeader title="Painéis Gerenciais" subtitle="Visão geral da rede de ensino" />
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<Database className="h-7 w-7 text-primary" />}
              title="Você ainda não possui registros cadastrados"
              description="Para visualizar os indicadores da rede é necessário importar os dados da instituição primeiro."
              actionLabel={canImport ? "Importar Dados" : undefined}
              actionRoute={canImport ? "/importar" : undefined}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { kpis, unitComparison, risco } = deriveDashboard(filteredBase);
  const unitKeys = unitComparison.map((u) => u.unit);
  const top5 = risco.slice(0, 5);
  const activeCount = Object.values(filters).filter((v) => v !== "all").length;
  const handleFilterChange = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ unit: "all", period: "all" });

  return (
    <div>
      <PageHeader title="Painéis Gerenciais" subtitle="Visão geral da rede de ensino" />
      <OnboardingChecklist />
      <FilterBar
        config={{ unit: true, period: true }}
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

      <div data-tour="dashboard-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} icon={kpiIcons[i]} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartCard title="Comparativo de Unidades" subtitle="Matrículas, frequência (%) e desempenho">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="unit" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Legend />
                  <Bar dataKey="matriculas" fill="hsl(var(--chart-1))" name="Matrículas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="frequencia" fill="hsl(var(--chart-2))" name="Frequência (%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="desempenho" fill="hsl(var(--chart-3))" name="Desempenho (0-10)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Frequência por Unidade" subtitle="Comparativo atual">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="unit" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="frequencia" name="Frequência %">
                    {unitComparison.map((u, i) => <Bar key={u.unit} dataKey="frequencia" fill={unitColorFor(u.unit, i)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Alunos em Risco de Evasão</CardTitle>
            <CardDescription>Top 5 com maior score de risco</CardDescription>
          </CardHeader>
          <CardContent>
            {top5.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum aluno em risco identificado.</p>
            ) : (
              <div className="space-y-4">
                {top5.map((s) => {
                  const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-accent/20 text-accent text-xs font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.unit} · {s.turma}</p>
                        <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              s.risk >= 80 ? "bg-accent" : s.risk >= 60 ? "bg-warning" : "bg-secondary"
                            }`}
                            style={{ width: `${s.risk}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.risk}% risco · freq {s.frequencia}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
