import * as XLSX from "xlsx";
import {
  ENTITIES,
  ENTITY_ORDER,
  EntityKey,
  detectEntityFromSheetName,
  suggestColumnMapping,
} from "./schema";

export interface ParsedSheet {
  originalName: string;
  detectedEntity: EntityKey | null;
  headers: string[];
  sample: Record<string, unknown>[]; // primeiras 5 linhas
  rowCount: number;
  rows: Record<string, unknown>[]; // todas as linhas
}

export interface ParsedWorkbook {
  fileName: string;
  sheets: ParsedSheet[];
}

export async function parseExcelFile(file: File): Promise<ParsedWorkbook> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheets: ParsedSheet[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
      raw: false,
    });
    const headers = json.length > 0 ? Object.keys(json[0]) : [];
    return {
      originalName: name,
      detectedEntity: detectEntityFromSheetName(name),
      headers,
      sample: json.slice(0, 5),
      rowCount: json.length,
      rows: json,
    };
  });
  return { fileName: file.name, sheets };
}

/** Gera modelo Excel oficial com 7 abas e cabeçalhos preenchidos */
export function downloadOfficialTemplate(): void {
  const wb = XLSX.utils.book_new();
  ENTITY_ORDER.forEach((key) => {
    const ent = ENTITIES[key];
    // cabeçalhos + 1 linha vazia de exemplo
    const ws = XLSX.utils.aoa_to_sheet([ent.columns, ent.columns.map(() => "")]);
    XLSX.utils.book_append_sheet(wb, ws, ent.label);
  });
  XLSX.writeFile(wb, "modelo_importacao_nexus.xlsx");
}

export interface ColumnMap {
  original: string;
  target: string; // coluna oficial ou "ignorar" ou ""
  status: "mapped" | "pending" | "ignored";
}

export function buildInitialMappings(
  headers: string[],
  entity: EntityKey | null,
): ColumnMap[] {
  return headers.map((h) => {
    if (!entity) return { original: h, target: "", status: "pending" as const };
    const target = suggestColumnMapping(h, entity);
    return {
      original: h,
      target,
      status: target ? ("mapped" as const) : ("pending" as const),
    };
  });
}

export interface SheetValidationResult {
  entity: EntityKey;
  totalRows: number;
  validRows: number;
  errors: { row: number; field: string; message: string }[];
}

export interface ValidationContext {
  /** Números de matrícula já existentes no sistema (registros prévios). */
  existingMatriculas?: Set<string>;
}

/** Valida linhas de uma aba aplicando mapeamento e regras específicas. */
export function validateSheet(
  sheet: ParsedSheet,
  entity: EntityKey,
  mappings: ColumnMap[],
  ctx: ValidationContext = {},
): SheetValidationResult {
  const ent = ENTITIES[entity];
  const errors: SheetValidationResult["errors"] = [];
  let validRows = 0;

  // Verifica se todas as colunas obrigatórias estão mapeadas
  const mappedTargets = new Set(
    mappings.filter((m) => m.status === "mapped").map((m) => m.target),
  );
  const missingRequired = ent.required.filter((r) => !mappedTargets.has(r));
  if (missingRequired.length > 0) {
    errors.push({
      row: 0,
      field: missingRequired.join(", "),
      message: `Colunas obrigatórias não mapeadas: ${missingRequired.join(", ")}`,
    });
  }

  // Regra especial NOTAS: nº de notas preenchidas deve ser uniforme na turma
  const notasPorTurma: Record<string, Set<number>> = {};

  // Regra MATRÍCULAS: numero_matricula único no arquivo
  const matriculasVistas = new Map<string, number>(); // numero → primeira linha
  const existingMatriculas = ctx.existingMatriculas ?? new Set<string>();

  sheet.rows.forEach((raw, idx) => {
    const rowNum = idx + 2; // 1 = header
    const mapped: Record<string, unknown> = {};
    mappings.forEach((m) => {
      if (m.status === "mapped") mapped[m.target] = raw[m.original];
    });

    // Obrigatórios
    let rowOk = true;
    for (const req of ent.required) {
      const val = mapped[req];
      if (val === undefined || val === null || String(val).trim() === "") {
        errors.push({
          row: rowNum,
          field: req,
          message: `Campo obrigatório vazio: ${req}`,
        });
        rowOk = false;
      }
    }

    // Validações específicas por entidade
    if (entity === "matriculas") {
      const num = String(mapped["numero_matricula"] ?? "").trim();
      if (num) {
        const prev = matriculasVistas.get(num);
        if (prev !== undefined) {
          errors.push({
            row: rowNum,
            field: "numero_matricula",
            message: `Número de matrícula ${num} duplicado no arquivo (já aparece na linha ${prev}).`,
          });
          rowOk = false;
        } else {
          matriculasVistas.set(num, rowNum);
        }
        if (existingMatriculas.has(num)) {
          errors.push({
            row: rowNum,
            field: "numero_matricula",
            message: `Número de matrícula ${num} já existe.`,
          });
          rowOk = false;
        }
      }
    }

    if (entity === "notas") {
      const slots = ["nota_1", "nota_2", "nota_3", "nota_4"];
      const filled = slots.filter((s) => {
        const v = mapped[s];
        return v !== undefined && v !== null && String(v).trim() !== "";
      });
      if (filled.length === 0) {
        errors.push({
          row: rowNum,
          field: "nota_*",
          message: "Linha sem nenhuma nota preenchida",
        });
        rowOk = false;
      }
      // Valida valores numéricos 0-10
      filled.forEach((slot) => {
        const v = Number(String(mapped[slot]).replace(",", "."));
        if (Number.isNaN(v) || v < 0 || v > 10) {
          errors.push({
            row: rowNum,
            field: slot,
            message: `Nota inválida em ${slot}: "${mapped[slot]}" (esperado 0–10)`,
          });
          rowOk = false;
        }
      });
      // Registra qtd de notas por turma
      const turma = String(mapped["nome_turma"] ?? "").trim();
      if (turma && filled.length > 0) {
        notasPorTurma[turma] = notasPorTurma[turma] ?? new Set<number>();
        notasPorTurma[turma].add(filled.length);
      }
    }

    if (entity === "frequencia") {
      const presente = String(mapped["presente"] ?? "").toLowerCase().trim();
      if (
        presente &&
        !["true", "false", "1", "0", "sim", "nao", "não", "presente", "ausente"].includes(
          presente,
        )
      ) {
        errors.push({
          row: rowNum,
          field: "presente",
          message: `Valor de presença inválido: "${mapped["presente"]}" (use true/false, sim/não)`,
        });
        rowOk = false;
      }
    }

    if (rowOk) validRows++;
  });

  // Regra de uniformidade de notas por turma
  if (entity === "notas") {
    Object.entries(notasPorTurma).forEach(([turma, sizes]) => {
      if (sizes.size > 1) {
        errors.push({
          row: 0,
          field: "nota_*",
          message: `Turma "${turma}" tem alunos com quantidades diferentes de notas (${[...sizes].join(", ")}). Uniformize.`,
        });
      }
    });
  }

  return {
    entity,
    totalRows: sheet.rowCount,
    validRows: Math.max(0, validRows),
    errors,
  };
}

/** Verifica se o pacote da implantação inicial está completo (todas as 7 abas, todas com linhas). */
export function checkInitialDeploymentReady(
  detected: { entity: EntityKey | null; rowCount: number }[],
): { ready: boolean; missing: EntityKey[] } {
  const present = new Set(
    detected.filter((d) => d.entity && d.rowCount > 0).map((d) => d.entity as EntityKey),
  );
  const missing = ENTITY_ORDER.filter((e) => !present.has(e));
  return { ready: missing.length === 0, missing };
}
