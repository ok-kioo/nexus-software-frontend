import { apiRequest } from "./client";

export type ExportSection = "matriculas" | "turmas" | "academico" | "permanencia";

export function fetchExportSection<T = unknown>(section: ExportSection) {
  return apiRequest<{ rows: T[] }>(`/v1/exportacao/${section}`);
}