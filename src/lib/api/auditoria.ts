import { apiRequest } from "./client";

export const auditoriaApi = {
  list: (filters: { entidade?: string; acao?: string; user_id?: string } = {}) => {
    const qs = new URLSearchParams();
    if (filters.entidade) qs.set("entidade", filters.entidade);
    if (filters.acao) qs.set("acao", filters.acao);
    if (filters.user_id) qs.set("user_id", filters.user_id);
    const s = qs.toString();
    return apiRequest<{ rows: unknown[] }>(`/v1/auditoria${s ? `?${s}` : ""}`);
  },
};
