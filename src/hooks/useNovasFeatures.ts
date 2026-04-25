import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscribeToTable } from "@/lib/auth";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { analyticsApi } from "@/lib/api/analytics";
import { contatosApi, planosApi } from "@/lib/api/academico";
import { avisosApi, eventosApi } from "@/lib/api/mural";
import { auditoriaApi } from "@/lib/api/auditoria";

/* ============ PERFIL DO ALUNO ============ */
export function useAlunoPerfil(alunoId: string | undefined) {
  return useQuery({
    enabled: !!alunoId,
    queryKey: ["aluno-perfil", alunoId, "api"],
    queryFn: () => analyticsApi.alunoPerfil(alunoId!),
  });
}

export function useCreateContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { aluno_id: string; tipo: string; descricao: string }) =>
      contatosApi.create(payload as Record<string, unknown>),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["aluno-perfil", vars.aluno_id] });
      toast.success("Contato registrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============ AVISOS / MURAL ============ */
export function useAvisos() {
  const qc = useQueryClient();
  // Realtime continua via canal Supabase (sessão JWT do usuário); apenas dados passam pela API.
  useEffect(() => {
    return subscribeToTable("avisos-rt", { table: "avisos" }, () => {
      qc.invalidateQueries({ queryKey: ["avisos"] });
    });
  }, [qc]);
  return useQuery({
    queryKey: ["avisos", "api"],
    queryFn: async () => {
      const res = await avisosApi.list();
      return res.rows as any[];
    },
  });
}

export function useCreateAviso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { titulo: string; corpo: string; publico_alvo: string; fixado?: boolean }) =>
      avisosApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["avisos"] });
      toast.success("Aviso publicado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAviso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => avisosApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["avisos"] });
      toast.success("Aviso removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarcarLido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (aviso_id: string) => avisosApi.marcarLido(aviso_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["avisos-leituras"] }),
  });
}

export function useMinhasLeituras() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["avisos-leituras", user?.id, "api"],
    queryFn: async () => {
      const res = await avisosApi.listLeituras();
      return new Set(res.rows.map((d) => d.aviso_id));
    },
  });
}

/* ============ EVENTOS CALENDÁRIO ============ */
export function useEventos() {
  return useQuery({
    queryKey: ["eventos", "api"],
    retry: 1,
    queryFn: async () => {
      const res = await eventosApi.list();
      return res.rows as any[];
    },
  });
}

export function useCreateEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => eventosApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
      toast.success("Evento criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventosApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos"] });
      toast.success("Evento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============ PLANOS DE AÇÃO ============ */
export function usePlanosAcao() {
  return useQuery({
    queryKey: ["planos-acao", "api"],
    retry: 1,
    queryFn: async () => {
      const res = await planosApi.list();
      return res.rows as any[];
    },
  });
}

export function useCreatePlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => planosApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planos-acao"] });
      toast.success("Plano de ação criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const updates: any = { ...payload };
      if (payload.status === "concluido" && !payload.concluido_em) {
        updates.concluido_em = new Date().toISOString();
      }
      await planosApi.update(id, updates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planos-acao"] });
      toast.success("Plano atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planosApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planos-acao"] });
      toast.success("Plano removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ============ AUDITORIA ============ */
export function useAuditoria(filters: { entidade?: string; acao?: string; user_id?: string } = {}) {
  return useQuery({
    queryKey: ["auditoria", filters, "api"],
    queryFn: async () => {
      const res = await auditoriaApi.list(filters);
      return res.rows as any[];
    },
  });
}

/* ============ RELATÓRIO POR TURMA ============ */
export function useRelatorioTurma(turmaId: string | undefined) {
  return useQuery({
    enabled: !!turmaId,
    queryKey: ["relatorio-turma", turmaId, "api"],
    queryFn: () => analyticsApi.relatorioTurma(turmaId!),
  });
}
