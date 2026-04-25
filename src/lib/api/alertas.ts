import { apiRequest } from "./client";

export type AlertaSeverity = "critico" | "atencao" | "informativo";
export type AlertaStatus = "ativo" | "resolvido" | "ignorado" | "convertido";
export type AlertaEntidade = "aluno" | "turma" | "rede";

export interface Alerta {
  id: string;
  tipo: string;
  severity: AlertaSeverity;
  entidade: AlertaEntidade;
  entidade_id: string | null;
  titulo: string;
  descricao: string;
  unidade: string | null;
  unidade_id: string | null;
  metricas: Record<string, unknown>;
  status: AlertaStatus;
  plano_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertaHistorico {
  id: string;
  alerta_id: string;
  evento: "detected" | "reseen" | "status_change" | "promoted";
  payload: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}

export const alertasApi = {
  list: (params: { status?: AlertaStatus; refresh?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.refresh === false) qs.set("refresh", "false");
    const s = qs.toString();
    return apiRequest<{ rows: Alerta[]; total: number }>(`/v1/alertas${s ? `?${s}` : ""}`);
  },
  detail: (id: string) =>
    apiRequest<{ alerta: Alerta; historico: AlertaHistorico[] }>(`/v1/alertas/${id}`),
  updateStatus: (id: string, status: Exclude<AlertaStatus, "convertido">) =>
    apiRequest<Alerta>(`/v1/alertas/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  promote: (
    id: string,
    body: { titulo?: string; descricao?: string; prazo?: string | null; prioridade?: "baixa" | "media" | "alta"; responsavel_id?: string | null } = {},
  ) =>
    apiRequest<{ plano: { id: string }; alerta_id: string }>(`/v1/alertas/${id}/promote`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};