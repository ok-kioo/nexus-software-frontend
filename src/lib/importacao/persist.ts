import { ColumnMap, ParsedSheet } from "./excel";
import { EntityKey } from "./schema";
import { commitImport, type ImportEntity } from "@/lib/api/importacao";

export interface PersistResult {
  entity: EntityKey;
  inserted: number;
  skipped: number;
  errors: string[];
}

function applyMapping(rows: Record<string, unknown>[], mappings: ColumnMap[]) {
  return rows.map((raw) => {
    const out: Record<string, unknown> = {};
    mappings.forEach((m) => {
      if (m.status === "mapped" && m.target) out[m.target] = raw[m.original];
    });
    return out;
  });
}

const ORDER: EntityKey[] = [
  "unidades",
  "cursos",
  "turmas",
  "alunos",
  "matriculas",
  "frequencia",
  "notas",
];

/** Envia todos os lotes para o backend, que persiste em ordem referencial. */
export async function persistImport(
  selected: { sheet: ParsedSheet; entity: EntityKey; mappings: ColumnMap[] }[],
): Promise<PersistResult[]> {
  const batches = ORDER
    .map((ent) => {
      const item = selected.find((s) => s.entity === ent);
      if (!item) return null;
      return {
        entity: ent as ImportEntity,
        rows: applyMapping(item.sheet.rows, item.mappings),
      };
    })
    .filter((b): b is { entity: ImportEntity; rows: Record<string, unknown>[] } => Boolean(b));

  const { results } = await commitImport(batches);
  return results.map((r) => ({
    entity: r.entity as EntityKey,
    inserted: r.inserted,
    skipped: r.skipped,
    errors: r.errors,
  }));
}
