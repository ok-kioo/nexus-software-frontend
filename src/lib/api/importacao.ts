import { apiRequest } from "./client";

export type ImportEntity =
  | "unidades"
  | "cursos"
  | "turmas"
  | "alunos"
  | "matriculas"
  | "frequencia"
  | "notas";

export interface PreviewResponse {
  entity: ImportEntity;
  total: number;
  valid: number;
  invalid: { row: number; reason: string }[];
}

export interface CommitResult {
  entity: ImportEntity;
  inserted: number;
  skipped: number;
  errors: string[];
}

export function previewImport(entity: ImportEntity, rows: Record<string, unknown>[]) {
  return apiRequest<PreviewResponse>("/v1/importacao/preview", {
    method: "POST",
    body: JSON.stringify({ entity, rows }),
  });
}

export function commitImport(batches: { entity: ImportEntity; rows: Record<string, unknown>[] }[]) {
  return apiRequest<{ results: CommitResult[] }>("/v1/importacao/commit", {
    method: "POST",
    body: JSON.stringify({ batches }),
  });
}