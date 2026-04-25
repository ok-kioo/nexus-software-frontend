// Constantes e tipos compartilhados. Os dados de domínio agora vêm do banco
// (ver src/hooks/useEntities.ts e src/hooks/useAnalytics.ts).

export type UserRole = "administrador" | "gestor" | "professor";

export const unitColors = ["#3852B4", "#5E7AC4", "#F08D39", "#F3BE7A", "#22c55e"];

// Períodos padrão usados em filtros quando não há dados ainda no banco.
export const periods = ["2025.1", "2025.2", "2026.1"];

// Lista mock de números de matrícula usados na simulação de importação.
export const existingEnrollmentNumbers: string[] = [
  "MAT2026001",
  "MAT2026002",
  "MAT2026003",
  "MAT2025010",
  "MAT2025011",
];
