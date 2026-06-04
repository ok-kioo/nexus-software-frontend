import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/reusable/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, BookOpen, Users, GraduationCap } from "lucide-react";
import { useTurmasDoProfessor } from "@/hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

export default function Professor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading } = useTurmasDoProfessor(user?.id);

  // Conta alunos ativos por turma em uma única query
  const { data: counts } = useQuery({
    enabled: turmas.length > 0,
    queryKey: ["professor-turma-counts", turmas.map((t: any) => t.id)],
    queryFn: async () => {
      const res = await analyticsApi.turmasCounts(turmas.map((t: any) => t.id));
      return res.counts;
    },
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Minhas Turmas" subtitle={`Olá, ${user?.name || "Professor"}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Minhas Turmas"
        subtitle={`Olá, ${user?.name || "Professor"}. Gerencie frequência e notas das suas turmas.`}
      />

      <OnboardingChecklist />



      {turmas.length === 0 ? (
        <Card className="text-center">
          <CardContent className="p-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">Nenhuma turma atribuída</p>
            <p className="text-sm text-muted-foreground">Entre em contato com o administrador para atribuição de turmas.</p>
          </CardContent>
        </Card>
      ) : (
        <div data-tour="professor-turmas" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map((t: any) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle className="text-lg">{t.nome_turma}</CardTitle>
                <CardDescription>{t.curso?.nome_curso} · {t.unidade?.nome_unidade}/{t.unidade?.estado}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{counts?.[t.id] ?? 0} alunos ativos</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="flex-1 h-12 sm:h-10 text-base sm:text-sm" onClick={() => navigate(`/frequencia?turma=${t.id}`)}>
                    <ClipboardCheck className="h-5 w-5 mr-2 sm:h-4 sm:w-4 sm:mr-1" />
                    Frequência
                  </Button>
                  <Button variant="outline" className="flex-1 border-accent text-accent hover:bg-accent/10 h-12 sm:h-10 text-base sm:text-sm" onClick={() => navigate(`/notas?turma=${t.id}`)}>
                    <GraduationCap className="h-5 w-5 mr-2 sm:h-4 sm:w-4 sm:mr-1" />
                    Notas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
