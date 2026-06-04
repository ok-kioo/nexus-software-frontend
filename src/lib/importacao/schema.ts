// Schema oficial das 7 entidades suportadas no upload de Excel
// Importação multiabas — apenas Excel (.xlsx, .xls)

export type EntityKey =
  | "unidades"
  | "cursos"
  | "turmas"
  | "alunos"
  | "matriculas"
  | "frequencia"
  | "notas";

export interface EntitySchema {
  key: EntityKey;
  label: string;
  sheetAliases: string[]; // nomes de aba aceitos (case-insensitive, sem acentos)
  columns: string[]; // colunas oficiais
  required: string[]; // colunas obrigatórias
  description: string;
}

export const ENTITY_ORDER: EntityKey[] = [
  "unidades",
  "cursos",
  "turmas",
  "alunos",
  "matriculas",
  "frequencia",
  "notas",
];

export const ENTITIES: Record<EntityKey, EntitySchema> = {
  unidades: {
    key: "unidades",
    label: "Unidades",
    sheetAliases: ["unidades", "unidade", "campus", "polos", "polo"],
    columns: ["nome_unidade", "cidade", "estado", "status"],
    required: ["nome_unidade", "cidade", "estado"],
    description: "Unidades / campi da rede educacional",
  },
  cursos: {
    key: "cursos",
    label: "Cursos",
    sheetAliases: ["cursos", "curso", "programas"],
    columns: ["nome_curso", "categoria", "carga_horaria", "status"],
    required: ["nome_curso", "categoria"],
    description: "Cursos oferecidos",
  },
  turmas: {
    key: "turmas",
    label: "Turmas",
    sheetAliases: ["turmas", "turma", "classes", "classe"],
    columns: [
      "nome_turma",
      "nome_unidade",
      "nome_curso",
      "capacidade",
      "periodo",
      "turno",
      "status",
    ],
    required: ["nome_turma", "nome_unidade", "nome_curso"],
    description: "Turmas vinculadas a unidades e cursos",
  },
  alunos: {
    key: "alunos",
    label: "Alunos",
    sheetAliases: ["alunos", "aluno", "estudantes", "discentes"],
    columns: [
      "nome_aluno",
      "documento",
      "data_nascimento",
      "email",
      "telefone",
      "status",
    ],
    required: ["nome_aluno", "documento"],
    description: "Cadastro de alunos",
  },
  matriculas: {
    key: "matriculas",
    label: "Matrículas",
    sheetAliases: ["matriculas", "matricula", "matrículas", "matrícula"],
    columns: [
      "numero_matricula",
      "nome_aluno",
      "nome_turma",
      "status",
      "data_inicio",
      "data_fim",
    ],
    required: ["numero_matricula", "nome_aluno", "nome_turma"],
    description: "Vínculo aluno × turma (identificado por numero_matricula)",
  },
  frequencia: {
    key: "frequencia",
    label: "Frequência",
    sheetAliases: ["frequencia", "frequência", "presencas", "presenças", "freq"],
    columns: ["nome_aluno", "nome_turma", "data", "presente", "observacao"],
    required: ["nome_aluno", "nome_turma", "data", "presente"],
    description: "Registro diário de presença",
  },
  notas: {
    key: "notas",
    label: "Notas",
    sheetAliases: ["notas", "nota", "avaliacoes", "avaliações", "boletim"],
    columns: [
      "nome_aluno",
      "nome_turma",
      "nota_1",
      "nota_2",
      "nota_3",
      "nota_4",
      "observacao",
    ],
    required: ["nome_aluno", "nome_turma"],
    description: "Até 4 notas por aluno (mínimo 1 preenchida)",
  },
};

// Dicionário de auto-match (chave normalizada → coluna oficial)
// Usado para sugerir mapeamento inteligente de colunas
export const COLUMN_ALIASES: Record<string, string> = {
  // alunos
  aluno: "nome_aluno",
  nome: "nome_aluno",
  "nome do aluno": "nome_aluno",
  "nome completo": "nome_aluno",
  estudante: "nome_aluno",
  discente: "nome_aluno",
  // turmas
  turma: "nome_turma",
  classe: "nome_turma",
  "nome da turma": "nome_turma",
  // unidades
  unidade: "nome_unidade",
  campus: "nome_unidade",
  polo: "nome_unidade",
  // cursos
  curso: "nome_curso",
  programa: "nome_curso",
  // documento
  cpf: "documento",
  doc: "documento",
  rg: "documento",
  // ⚠️ "matricula" / "ra" agora são número da matrícula (entidade Matrículas)
  matricula: "numero_matricula",
  matrícula: "numero_matricula",
  "numero matricula": "numero_matricula",
  "número matrícula": "numero_matricula",
  "nº matricula": "numero_matricula",
  "nº matrícula": "numero_matricula",
  "no matricula": "numero_matricula",
  numero: "numero_matricula",
  número: "numero_matricula",
  codigo_matricula: "numero_matricula",
  "codigo matricula": "numero_matricula",
  "código matrícula": "numero_matricula",
  registro: "numero_matricula",
  ra: "numero_matricula",
  rm: "numero_matricula",
  enrollment_number: "numero_matricula",
  "enrollment number": "numero_matricula",
  // contato
  "e-mail": "email",
  mail: "email",
  celular: "telefone",
  fone: "telefone",
  // datas
  dia: "data",
  // presença
  presenca: "presente",
  presença: "presente",
  frequencia: "presente",
  frequência: "presente",
  freq: "presente",
  // notas
  nota: "nota_1",
  "nota final": "nota_1",
  n1: "nota_1",
  n2: "nota_2",
  n3: "nota_3",
  n4: "nota_4",
  // localização
  cidade: "cidade",
  uf: "estado",
  estado: "estado",
  // outros
  capacidade: "capacidade",
  vagas: "capacidade",
  periodo: "periodo",
  período: "periodo",
  semestre: "periodo",
  turno: "turno",
  status: "status",
  situacao: "status",
  situação: "status",
  categoria: "categoria",
  ch: "carga_horaria",
  "carga horaria": "carga_horaria",
  "carga horária": "carga_horaria",
  observacao: "observacao",
  observação: "observacao",
  obs: "observacao",
  nascimento: "data_nascimento",
  "data de nascimento": "data_nascimento",
  inicio: "data_inicio",
  início: "data_inicio",
  fim: "data_fim",
};

function normalize(s: string): string {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function detectEntityFromSheetName(name: string): EntityKey | null {
  const n = normalize(name);
  for (const ent of Object.values(ENTITIES)) {
    if (ent.sheetAliases.some((a) => normalize(a) === n)) return ent.key;
  }
  // fallback: contém alias
  for (const ent of Object.values(ENTITIES)) {
    if (ent.sheetAliases.some((a) => n.includes(normalize(a)))) return ent.key;
  }
  return null;
}

export function suggestColumnMapping(
  original: string,
  entity: EntityKey,
): string {
  const n = normalize(original);
  // 1) match direto com coluna oficial
  const cols = ENTITIES[entity].columns;
  const direct = cols.find((c) => normalize(c) === n);
  if (direct) return direct;
  // 2) dicionário
  const alias = COLUMN_ALIASES[n];
  if (alias && cols.includes(alias)) return alias;
  // 3) contém
  const partial = cols.find((c) => n.includes(normalize(c)) || normalize(c).includes(n));
  if (partial) return partial;
  return "";
}

export { normalize };
