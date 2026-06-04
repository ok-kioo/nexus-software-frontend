import { apiRequest } from "./client";

export interface PagedResponse<T> {
  rows: T[];
  total?: number;
}

/* ─── Frequência ─── */
export const frequenciaApi = {
  list: () => apiRequest<PagedResponse<unknown>>("/v1/frequencia?pageSize=200"),
  byTurma: (turmaId: string, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const s = qs.toString();
    return apiRequest<{ matriculas: unknown[]; registros: unknown[] }>(
      `/v1/frequencia/by-turma/${turmaId}${s ? `?${s}` : ""}`,
    );
  },
  create: (payload: Record<string, unknown>) =>
    apiRequest("/v1/frequencia", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiRequest(`/v1/frequencia/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => apiRequest(`/v1/frequencia/${id}`, { method: "DELETE" }),
};

/* ─── Notas ─── */
export const notasApi = {
  list: () => apiRequest<PagedResponse<unknown>>("/v1/notas?pageSize=200"),
  byTurma: (turmaId: string) =>
    apiRequest<{ matriculas: unknown[]; registros: unknown[] }>(`/v1/notas/by-turma/${turmaId}`),
  create: (payload: Record<string, unknown>) =>
    apiRequest("/v1/notas", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiRequest(`/v1/notas/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => apiRequest(`/v1/notas/${id}`, { method: "DELETE" }),
};

/* ─── Planos de ação ─── */
export const planosApi = {
  list: () => apiRequest<PagedResponse<unknown>>("/v1/planos"),
  create: (payload: Record<string, unknown>) =>
    apiRequest("/v1/planos", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiRequest(`/v1/planos/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => apiRequest(`/v1/planos/${id}`, { method: "DELETE" }),
};

/* ─── Contatos do aluno ─── */
export const contatosApi = {
  byAluno: (alunoId: string) =>
    apiRequest<PagedResponse<unknown>>(`/v1/contatos?aluno_id=${encodeURIComponent(alunoId)}`),
  create: (payload: Record<string, unknown>) =>
    apiRequest("/v1/contatos", { method: "POST", body: JSON.stringify(payload) }),
  remove: (id: string) => apiRequest(`/v1/contatos/${id}`, { method: "DELETE" }),
};
