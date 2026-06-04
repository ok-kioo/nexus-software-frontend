import type { UserRole } from "@/data/mockData";

export interface CriticalOperation {
  id: string;
  group: "Papéis & convites" | "Importação de dados" | "Cadastros sensíveis" | "Acadêmico (turma)";
  name: string;
  description: string;
  endpoint: string;
  allowedRoles: UserRole[];
  unauthorizedStatus: 401 | 403 | 404;
  unauthorizedLabel: string;
  audit?: string;
}

/**
 * Catálogo de operações críticas do sistema.
 * Documenta requisito de privilégio, código HTTP esperado quando o usuário não tem
 * permissão e onde a operação é registrada (audit trail).
 * Usado pela página /auditoria (aba "Operações críticas") como referência operacional.
 */
export const CRITICAL_OPERATIONS: CriticalOperation[] = [
  // --- Papéis & convites ---
  {
    id: "invite-create",
    group: "Papéis & convites",
    name: "Criar convite de usuário",
    description:
      "Envia convite por e-mail para administrador, gestor ou professor. Gestores só podem convidar professores.",
    endpoint: "edge fn: send-invite",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "Não autorizado",
    audit: "audit_log + tabela invites",
  },
  {
    id: "invite-accept",
    group: "Papéis & convites",
    name: "Aceitar convite",
    description:
      "Confirma o convite, cria conta com senha e atribui o papel definido. Validado server-side.",
    endpoint: "edge fn: accept-invite",
    allowedRoles: ["administrador", "gestor", "professor"],
    unauthorizedStatus: 404,
    unauthorizedLabel: "Token inválido",
    audit: "RPC accept_invite (security definer)",
  },
  {
    id: "invite-resend",
    group: "Papéis & convites",
    name: "Reenviar convite",
    description: "Reenvia o e-mail e renova o token de um convite pendente.",
    endpoint: "edge fn: send-invite (resend_id)",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "Não autorizado",
    audit: "audit_log",
  },
  {
    id: "user-roles-assign",
    group: "Papéis & convites",
    name: "Atribuir papel (user_roles)",
    description:
      "Insere/atualiza linha em user_roles. Bloqueado para todos os clientes — só ocorre via accept_invite (security definer).",
    endpoint: "tabela: public.user_roles",
    allowedRoles: [],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log (INSERT/UPDATE)",
  },
  {
    id: "dev-test-invite",
    group: "Papéis & convites",
    name: "Gerar convite de teste",
    description:
      "Cria convites marcados como is_test=true para validar cenários de erro. Restrito a admin.",
    endpoint: "edge fn: dev-create-test-invite",
    allowedRoles: ["administrador"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "Não autorizado",
    audit: "tabela invites (is_test=true)",
  },
  {
    id: "dev-test-invite-cleanup",
    group: "Papéis & convites",
    name: "Limpar convites de teste",
    description: "Remove todos os convites com flag is_test=true.",
    endpoint: "RPC: delete_test_invites()",
    allowedRoles: ["administrador"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log (DELETE)",
  },

  // --- Importação de dados ---
  {
    id: "import-unidades",
    group: "Importação de dados",
    name: "Importar unidades",
    description:
      "Insere lote de unidades a partir de planilha Excel após validação de schema.",
    endpoint: "tabela: public.unidades (insert lote)",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log por linha inserida",
  },
  {
    id: "import-cursos",
    group: "Importação de dados",
    name: "Importar cursos",
    description: "Insere lote de cursos. Validações de carga horária e categoria.",
    endpoint: "tabela: public.cursos (insert lote)",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log por linha inserida",
  },
  {
    id: "import-turmas",
    group: "Importação de dados",
    name: "Importar turmas",
    description: "Cria turmas vinculando curso e unidade.",
    endpoint: "tabela: public.turmas (insert lote)",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log por linha inserida",
  },
  {
    id: "import-alunos",
    group: "Importação de dados",
    name: "Importar alunos",
    description: "Insere lote de alunos.",
    endpoint: "tabela: public.alunos (insert lote)",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log por linha inserida",
  },
  {
    id: "import-matriculas",
    group: "Importação de dados",
    name: "Importar matrículas",
    description:
      "Vincula alunos a turmas, gerando número único de matrícula validado server-side.",
    endpoint: "tabela: public.matriculas (insert lote)",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log por linha inserida",
  },
  {
    id: "import-frequencia",
    group: "Importação de dados",
    name: "Importar frequência",
    description: "Insere registros históricos de presença/falta por matrícula e data.",
    endpoint: "tabela: public.frequencia (insert lote)",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log por linha inserida",
  },
  {
    id: "import-notas",
    group: "Importação de dados",
    name: "Importar notas",
    description: "Upsert de notas (1 a 4) por matrícula.",
    endpoint: "tabela: public.notas (upsert lote)",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log por linha inserida",
  },

  // --- Cadastros sensíveis ---
  {
    id: "aluno-delete",
    group: "Cadastros sensíveis",
    name: "Excluir aluno",
    description: "Apaga aluno e seus vínculos (matrículas, notas, frequência em cascata).",
    endpoint: "tabela: public.alunos (delete)",
    allowedRoles: ["administrador"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log (DELETE)",
  },
  {
    id: "matricula-delete",
    group: "Cadastros sensíveis",
    name: "Excluir matrícula",
    description: "Remove a matrícula de um aluno em uma turma.",
    endpoint: "tabela: public.matriculas (delete)",
    allowedRoles: ["administrador"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log (DELETE)",
  },
  {
    id: "turma-delete",
    group: "Cadastros sensíveis",
    name: "Excluir turma",
    description: "Remove turma e vínculos com professores.",
    endpoint: "tabela: public.turmas (delete)",
    allowedRoles: ["administrador"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log (DELETE)",
  },

  // --- Acadêmico (turma) ---
  {
    id: "frequencia-write",
    group: "Acadêmico (turma)",
    name: "Registrar frequência",
    description:
      "Insere/atualiza frequência. Professor só pode registrar para turmas onde leciona.",
    endpoint: "tabela: public.frequencia",
    allowedRoles: ["administrador", "gestor", "professor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega (escopo turma)",
    audit: "audit_log",
  },
  {
    id: "notas-write",
    group: "Acadêmico (turma)",
    name: "Registrar notas",
    description:
      "Upsert de notas. Professor só pode registrar para alunos das turmas onde leciona.",
    endpoint: "tabela: public.notas",
    allowedRoles: ["administrador", "gestor", "professor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega (escopo turma)",
    audit: "audit_log",
  },
  {
    id: "aviso-publish",
    group: "Acadêmico (turma)",
    name: "Publicar aviso no mural",
    description: "Cria aviso com público-alvo (todos, professores, gestores).",
    endpoint: "tabela: public.avisos",
    allowedRoles: ["administrador", "gestor"],
    unauthorizedStatus: 403,
    unauthorizedLabel: "RLS nega",
    audit: "audit_log",
  },
];