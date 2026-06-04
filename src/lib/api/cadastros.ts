import { apiRequest } from "./client";

export interface PagedResponse<T> {
  rows: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: Record<string, string | undefined>;
}

function buildQuery({ page, pageSize, search, filters }: ListParams = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));
  if (search) params.set("search", search);
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value && value !== "all") params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listResource<T>(resource: string, params?: ListParams) {
  return apiRequest<PagedResponse<T>>(`/v1/${resource}${buildQuery(params)}`);
}

export function getResource<T>(resource: string, id: string) {
  return apiRequest<T>(`/v1/${resource}/${id}`);
}

export function createResource<T>(resource: string, payload: Record<string, unknown>) {
  return apiRequest<T>(`/v1/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateResource<T>(resource: string, id: string, payload: Record<string, unknown>) {
  return apiRequest<T>(`/v1/${resource}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteResource(resource: string, id: string) {
  return apiRequest<{ ok: boolean }>(`/v1/${resource}/${id}`, { method: "DELETE" });
}

// Joins específicos
export function listTurmasWithRelations() {
  return apiRequest<PagedResponse<unknown>>("/v1/turmas/with-relations");
}

export interface MatriculasJoinParams extends ListParams {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  unidadeId?: string;
  cursoId?: string;
  turmaId?: string;
}

export function listMatriculasWithRelations(params: MatriculasJoinParams = {}) {
  const merged: ListParams = {
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    filters: {
      status: params.status,
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      unidadeId: params.unidadeId,
      cursoId: params.cursoId,
      turmaId: params.turmaId,
    },
  };
  return apiRequest<PagedResponse<unknown>>(`/v1/matriculas/with-relations${buildQuery(merged)}`);
}
