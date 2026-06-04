import { apiRequest } from "./client";

export const avisosApi = {
  list: () => apiRequest<{ rows: unknown[] }>("/v1/avisos"),
  create: (payload: Record<string, unknown>) =>
    apiRequest("/v1/avisos", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiRequest(`/v1/avisos/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => apiRequest(`/v1/avisos/${id}`, { method: "DELETE" }),
  listLeituras: () => apiRequest<{ rows: { aviso_id: string }[] }>("/v1/avisos/leituras"),
  marcarLido: (aviso_id: string) =>
    apiRequest("/v1/avisos/leituras", { method: "POST", body: JSON.stringify({ aviso_id }) }),
};

export const eventosApi = {
  list: () => apiRequest<{ rows: unknown[] }>("/v1/eventos"),
  create: (payload: Record<string, unknown>) =>
    apiRequest("/v1/eventos", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiRequest(`/v1/eventos/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => apiRequest(`/v1/eventos/${id}`, { method: "DELETE" }),
};
