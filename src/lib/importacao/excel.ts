import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
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

/**
 * Linhas de exemplo realistas para cada entidade — uma por aba.
 * Devem casar EXATAMENTE com a ordem das colunas em `ENTITIES[key].columns`.
 */
const EXAMPLE_ROWS: Record<EntityKey, (string | number)[]> = {
  unidades: ["Polo Centro", "São Paulo", "SP", "ativa"],
  cursos: ["Engenharia de Software", "Graduação", 3200, "ativo"],
  turmas: [
    "ESW-2026-1A",
    "Polo Centro",
    "Engenharia de Software",
    40,
    "2026.1",
    "Noturno",
    "ativa",
  ],
  alunos: [
    "Maria da Silva",
    "12345678901",
    "2002-05-14",
    "maria@exemplo.com",
    "(11) 99999-0000",
    "ativo",
  ],
  matriculas: [
    "MAT2026001",
    "Maria da Silva",
    "ESW-2026-1A",
    "ativa",
    "2026-02-01",
    "2026-12-15",
  ],
  frequencia: ["Maria da Silva", "ESW-2026-1A", "2026-03-10", "sim", ""],
  notas: ["Maria da Silva", "ESW-2026-1A", 8.5, 7.0, 9.2, 8.0, "Excelente desempenho"],
};

/**
 * Texto-instrução por entidade exibido na aba "Instruções" do modelo oficial.
 * Mantém os mesmos formatos que o validador da página de importação aceita.
 */
const ENTITY_RULES: Record<EntityKey, string[]> = {
  unidades: [
    "estado: sigla com 2 letras (ex.: SP, RJ, MG)",
    "status: ativa | inativa",
  ],
  cursos: [
    "categoria: Graduação | Pós-Graduação | Técnico | Livre",
    "carga_horaria: número inteiro em horas",
    "status: ativo | inativo",
  ],
  turmas: [
    "nome_unidade e nome_curso devem existir nas abas Unidades e Cursos",
    "capacidade: número inteiro (vagas máximas)",
    "periodo: AAAA.S (ex.: 2026.1)",
    "turno: Manhã | Tarde | Noite | Integral",
    "status: ativa | inativa",
  ],
  alunos: [
    "documento (CPF): 11 dígitos numéricos, sem pontos ou traços",
    "data_nascimento: AAAA-MM-DD ou DD/MM/AAAA",
    "email: opcional, mas se preenchido deve ser válido",
    "status: ativo | inativo",
  ],
  matriculas: [
    "numero_matricula: único em todo o sistema",
    "nome_aluno e nome_turma: devem existir nas abas Alunos e Turmas",
    "status: ativa | trancada | concluida | cancelada",
    "data_inicio / data_fim: AAAA-MM-DD ou DD/MM/AAAA",
  ],
  frequencia: [
    "data: AAAA-MM-DD ou DD/MM/AAAA",
    "presente: aceita sim | não | true | false | 1 | 0 | presente | ausente",
    "observacao: opcional",
  ],
  notas: [
    "Cada nota deve estar entre 0 e 10 (use ponto como separador decimal)",
    "Pelo menos UMA nota deve estar preenchida por linha",
    "Todos os alunos da mesma turma devem ter a MESMA quantidade de notas preenchidas",
    "observacao: opcional",
  ],
};

/** Gera modelo Excel oficial com aba "Instruções" + 7 abas formatadas. */
export async function downloadOfficialTemplate(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Nexus";
  wb.created = new Date();

  // ── Aba 1: Instruções ────────────────────────────────────
  const ws = wb.addWorksheet("Instruções", {
    views: [{ showGridLines: false }],
  });
  ws.columns = [{ width: 4 }, { width: 28 }, { width: 90 }];

  const titleRow = ws.addRow(["", "Modelo de Importação — Nexus", ""]);
  titleRow.getCell(2).font = { bold: true, size: 16, color: { argb: "FF111827" } };
  ws.addRow([]);
  const subRow = ws.addRow([
    "",
    "",
    "Este arquivo contém 7 abas, uma por entidade. Substitua as linhas de exemplo pelos seus dados.",
  ]);
  subRow.getCell(3).font = { italic: true, color: { argb: "FF6B7280" } };
  ws.addRow([]);

  const fmtHeader = ws.addRow(["", "Formatos aceitos", ""]);
  fmtHeader.getCell(2).font = { bold: true, size: 12, color: { argb: "FF111827" } };

  const generalRules: [string, string][] = [
    ["Datas", "AAAA-MM-DD (ex.: 2026-03-10) ou DD/MM/AAAA (ex.: 10/03/2026)"],
    ["UF (estado)", "Sigla com 2 letras: SP, RJ, MG, RS, etc."],
    ["CPF (documento)", "11 dígitos numéricos, sem pontos ou traços"],
    ["Booleanos (presente)", "sim | não | true | false | 1 | 0 | presente | ausente"],
    ["Notas (0–10)", "Use ponto como separador decimal: 8.5, 9.0, 7.25"],
    ["Status", "ativa/ativo ou inativa/inativo conforme a entidade"],
    ["Codificação", "UTF-8. Salve sempre como .xlsx"],
  ];
  generalRules.forEach(([k, v]) => {
    const r = ws.addRow(["", k, v]);
    r.getCell(2).font = { bold: true };
    r.getCell(3).alignment = { wrapText: true, vertical: "top" };
  });

  ws.addRow([]);
  const entHeader = ws.addRow(["", "Regras por entidade", ""]);
  entHeader.getCell(2).font = { bold: true, size: 12, color: { argb: "FF111827" } };

  ENTITY_ORDER.forEach((key) => {
    const ent = ENTITIES[key];
    ws.addRow([]);
    const r = ws.addRow(["", ent.label, ent.description]);
    r.getCell(2).font = { bold: true, color: { argb: "FF1F2937" } };
    r.getCell(3).font = { italic: true, color: { argb: "FF6B7280" } };
    const cols = ws.addRow([
      "",
      "Colunas",
      ent.columns
        .map((c) => (ent.required.includes(c) ? `${c} (obrigatório)` : c))
        .join(", "),
    ]);
    cols.getCell(3).alignment = { wrapText: true, vertical: "top" };
    ENTITY_RULES[key].forEach((rule) => {
      const rr = ws.addRow(["", "•", rule]);
      rr.getCell(3).alignment = { wrapText: true, vertical: "top" };
    });
  });

  // ── 7 abas das entidades ─────────────────────────────────
  ENTITY_ORDER.forEach((key) => {
    const ent = ENTITIES[key];
    const sheet = wb.addWorksheet(ent.label, {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = ent.columns.map((c) => ({
      header: c,
      key: c,
      width: Math.max(16, c.length + 4),
    }));

    // Cabeçalho formatado: negrito + fundo cinza
    const header = sheet.getRow(1);
    header.values = ent.columns;
    header.font = { bold: true, color: { argb: "FF111827" } };
    header.alignment = { vertical: "middle", horizontal: "left" };
    header.height = 22;
    ent.columns.forEach((_, i) => {
      const cell = header.getCell(i + 1);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
    });

    // Linha 2: exemplo realista
    const example = EXAMPLE_ROWS[key];
    const exRow = sheet.addRow(example);
    exRow.font = { color: { argb: "FF6B7280" }, italic: true };
    exRow.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });

    // AutoFilter no cabeçalho
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: ent.columns.length },
    };
  });

  // ── Download ─────────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo_importacao_nexus.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
