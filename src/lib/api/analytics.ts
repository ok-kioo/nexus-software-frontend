import { apiRequest } from "./client";

export const analyticsApi = {
  base: () =>
    apiRequest<{ matriculas: any[]; freq: any[]; notas: any[] }>("/v1/analytics/base"),
  alunoPerfil: (alunoId: string) =>
    apiRequest<{
      aluno: any;
      matriculas: any[];
      frequencias: any[];
      notas: any[];
      contatos: any[];
    }>(`/v1/analytics/aluno/${alunoId}`),
  relatorioTurma: (turmaId: string) =>
    apiRequest<{
      turma: any;
      matriculas: any[];
      frequencias: any[];
      notas: any[];
      professores: any[];
    }>(`/v1/analytics/turma/${turmaId}`),
  turmasDoProfessor: () => apiRequest<{ rows: any[] }>("/v1/analytics/turmas-do-professor"),
  matriculasDaTurma: (turmaId: string) =>
    apiRequest<{ rows: any[] }>(`/v1/analytics/matriculas-da-turma/${turmaId}`),
  turmasCounts: (turmaIds: string[]) =>
    apiRequest<{ counts: Record<string, number> }>(
      `/v1/analytics/turmas-counts?turmaIds=${encodeURIComponent(turmaIds.join(","))}`,
    ),
};
